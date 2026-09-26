package com.hostel360.stats;

import com.hostel360.room.Room;
import com.hostel360.room.RoomRepository;
import com.hostel360.stats.StatsDto.Country;
import com.hostel360.stats.StatsDto.Month;
import com.hostel360.stats.StatsDto.RoomMonth;
import com.hostel360.stats.StatsDto.Totals;
import com.hostel360.stay.Stay;
import com.hostel360.stay.StayEnums.StaySource;
import com.hostel360.stay.StayEnums.StayStatus;
import com.hostel360.stay.StayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Occupancy, money and guest statistics for a year.
 * Occupancy is short-term only: a room's nights under a long-term tenant aren't available, and a room
 * marked long-term counts only in months it also had short stays. Money counts on the arrival date,
 * long-term rent once per month, as in Finance.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class StatsService {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final StayRepository stayRepo;
    private final RoomRepository roomRepo;

    public StatsDto.Year year(int year) {
        var stays = stayRepo.search(StayRepository.MIN, StayRepository.MAX, -1).stream()
                .filter(s -> s.getStatus() != StayStatus.CANCELLED).toList();
        var staysPerGuest = stays.stream().collect(Collectors.groupingBy(s -> s.getGuest().getId(), Collectors.counting()));
        var rooms = roomRepo.findAllByOrderByNumberAsc();

        var months = new ArrayList<Month>();
        var roomStats = rooms.stream().collect(Collectors.toMap(Room::getId, r -> new RoomAcc(), (a, b) -> a, LinkedHashMap::new));
        for (int m = 1; m <= 12; m++) {
            var ym = YearMonth.of(year, m);
            LocalDate from = ym.atDay(1), to = ym.plusMonths(1).atDay(1);
            int days = ym.lengthOfMonth(), sold = 0, available = 0;
            for (var room : rooms) {
                var o = occupancy(stays, room, ym);
                var acc = roomStats.get(room.getId());
                sold += o.sold();
                available += o.available();
                acc.sold += o.sold();
                acc.available += o.available();
                acc.months.add(new RoomMonth(pct(Math.min(days, o.shortNights() + o.longNights()), days), o.longNights() > 0));
            }
            var arrived = arrivals(stays, from, to);
            BigDecimal booking = sum(arrived, s -> s.getSource() == StaySource.BOOKING), direct = sum(arrived, s -> s.getSource() != StaySource.BOOKING);
            var rent = stays.stream().filter(Stay::isLongTerm).filter(s -> s.rentMonths(ym).anyMatch(ym::equals))
                    .map(Stay::amountEur).reduce(BigDecimal.ZERO, BigDecimal::add);
            months.add(new Month(from, pct(sold, available), sold, available, booking, direct, rent,
                    ratio(booking.add(direct), totalNights(arrived))));
        }

        LocalDate yearFrom = LocalDate.of(year, 1, 1), yearTo = yearFrom.plusYears(1);
        var arrivedInYear = arrivals(stays, yearFrom, yearTo);
        var longInYear = stays.stream().filter(Stay::isLongTerm).filter(s -> s.nightsWithin(yearFrom, yearTo) > 0).toList();

        var roomList = rooms.stream().map(room -> {
            var acc = roomStats.get(room.getId());
            var own = arrivedInYear.stream().filter(s -> s.getRoom().getId().equals(room.getId())).toList();
            var shortIncome = sum(own, s -> true);
            var rent = longInYear.stream().filter(s -> s.getRoom().getId().equals(room.getId()))
                    .map(s -> rentInYear(s, year)).reduce(BigDecimal.ZERO, BigDecimal::add);
            return new StatsDto.Room(room.getId(), room.getNumber(), room.getName(), acc.sold, pct(acc.sold, acc.available),
                    shortIncome.add(rent), ratio(shortIncome, totalNights(own)), acc.months);
        }).toList();

        int sold = months.stream().mapToInt(Month::nightsSold).sum(), available = months.stream().mapToInt(Month::nightsAvailable).sum();
        var totals = totals(arrivedInYear, longInYear, year, pct(sold, available), staysPerGuest);
        var previous = previous(stays, year - 1, staysPerGuest, rooms);
        return new StatsDto.Year(year, totals, previous, months, roomList, countries(arrivedInYear, longInYear, year));
    }

    /** Last year's totals, occupancy included, or null when it had no stays. */
    private Totals previous(List<Stay> stays, int year, Map<Long, Long> staysPerGuest, List<Room> rooms) {
        LocalDate from = LocalDate.of(year, 1, 1), to = from.plusYears(1);
        var arrived = arrivals(stays, from, to);
        var longTerm = stays.stream().filter(Stay::isLongTerm).filter(s -> s.nightsWithin(from, to) > 0).toList();
        if (arrived.isEmpty() && longTerm.isEmpty()) return null;
        int sold = 0, available = 0;
        for (int m = 1; m <= 12; m++)
            for (var room : rooms) {
                var o = occupancy(stays, room, YearMonth.of(year, m));
                sold += o.sold();
                available += o.available();
            }
        return totals(arrived, longTerm, year, pct(sold, available), staysPerGuest);
    }

    private Totals totals(List<Stay> arrived, List<Stay> longTerm, int year, BigDecimal occupancy, Map<Long, Long> staysPerGuest) {
        int nights = totalNights(arrived);
        var shortIncome = sum(arrived, s -> true);
        var income = shortIncome.add(longTerm.stream().map(s -> rentInYear(s, year)).reduce(BigDecimal.ZERO, BigDecimal::add));
        var guestIds = new HashSet<Long>();
        arrived.forEach(s -> guestIds.add(s.getGuest().getId()));
        longTerm.forEach(s -> guestIds.add(s.getGuest().getId()));
        int returning = (int) guestIds.stream().filter(id -> staysPerGuest.getOrDefault(id, 0L) > 1).count();
        long bookingStays = arrived.stream().filter(s -> s.getSource() == StaySource.BOOKING).count();
        int people = arrived.stream().mapToInt(Stay::getPeople).sum();
        return new Totals(arrived.size(), nights, income, occupancy, ratio(shortIncome, nights),
                ratio(BigDecimal.valueOf(nights), arrived.size()), ratio(BigDecimal.valueOf(people), arrived.size()),
                guestIds.size(), returning, pct((int) bookingStays, arrived.size()),
                shortIncome.signum() == 0 ? BigDecimal.ZERO
                        : sum(arrived, s -> s.getSource() == StaySource.BOOKING).multiply(HUNDRED).divide(shortIncome, 1, RoundingMode.HALF_UP));
    }

    private static List<Country> countries(List<Stay> arrived, List<Stay> longTerm, int year) {
        LocalDate from = LocalDate.of(year, 1, 1), to = from.plusYears(1);
        var byCountry = new HashMap<String, CountryAcc>();
        for (var s : arrived) byCountry.computeIfAbsent(countryOf(s), c -> new CountryAcc()).add(s, s.nightsWithin(s.getCheckIn(), s.getCheckOut()), s.amountEur());
        for (var s : longTerm) byCountry.computeIfAbsent(countryOf(s), c -> new CountryAcc()).add(s, s.nightsWithin(from, to), rentInYear(s, year));
        return byCountry.entrySet().stream()
                .map(e -> new Country(e.getKey().isEmpty() ? null : e.getKey(), e.getValue().guests.size(), e.getValue().stays, e.getValue().nights, e.getValue().income))
                .sorted(Comparator.comparingInt(Country::nights).reversed().thenComparing(Country::income, Comparator.reverseOrder()))
                .toList();
    }

    private static String countryOf(Stay s) {
        var c = s.getGuest().getCountry();
        return c == null ? "" : c;
    }

    private static List<Stay> arrivals(List<Stay> stays, LocalDate from, LocalDate to) {
        return stays.stream().filter(s -> !s.isLongTerm() && !s.getCheckIn().isBefore(from) && s.getCheckIn().isBefore(to)).toList();
    }

    /** One room in one month: short and long-term nights, and what counts toward short-term occupancy. */
    private record Occupancy(int shortNights, int longNights, int sold, int available) {}

    private static Occupancy occupancy(List<Stay> stays, Room room, YearMonth month) {
        LocalDate from = month.atDay(1), to = month.plusMonths(1).atDay(1);
        int shortNights = nights(stays, room, from, to, s -> !s.isLongTerm());
        int longNights = nights(stays, room, from, to, Stay::isLongTerm);
        boolean counts = !room.isLongTerm() || shortNights > 0;
        return new Occupancy(shortNights, longNights, counts ? shortNights : 0,
                counts ? Math.max(0, month.lengthOfMonth() - longNights) : 0);
    }

    private static int nights(List<Stay> stays, Room room, LocalDate from, LocalDate to, Predicate<Stay> kind) {
        return stays.stream().filter(s -> s.getRoom().getId().equals(room.getId())).filter(kind)
                .mapToInt(s -> s.nightsWithin(from, to)).sum();
    }

    private static int totalNights(List<Stay> shortStays) {
        return shortStays.stream().mapToInt(s -> s.nightsWithin(s.getCheckIn(), s.getCheckOut())).sum();
    }

    private static BigDecimal rentInYear(Stay s, int year) {
        long months = s.rentMonths(YearMonth.of(year, 12)).filter(m -> m.getYear() == year).count();
        return s.amountEur().multiply(BigDecimal.valueOf(months));
    }

    private static BigDecimal sum(List<Stay> stays, Predicate<Stay> filter) {
        return stays.stream().filter(filter).map(Stay::amountEur).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal pct(int part, int whole) {
        return whole == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(part).multiply(HUNDRED).divide(BigDecimal.valueOf(whole), 1, RoundingMode.HALF_UP);
    }

    private static BigDecimal ratio(BigDecimal amount, int count) {
        return count == 0 ? BigDecimal.ZERO : amount.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private static final class RoomAcc {
        int sold, available;
        final List<RoomMonth> months = new ArrayList<>();
    }

    private static final class CountryAcc {
        final Set<Long> guests = new HashSet<>();
        int stays, nights;
        BigDecimal income = BigDecimal.ZERO;

        void add(Stay s, int nights, BigDecimal income) {
            guests.add(s.getGuest().getId());
            stays++;
            this.nights += nights;
            this.income = this.income.add(income);
        }
    }
}
