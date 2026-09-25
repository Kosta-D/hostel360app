package com.hostel360.stay;

import com.hostel360.common.Currency;
import com.hostel360.guest.Guest;
import com.hostel360.guest.GuestRepository;
import com.hostel360.room.Room;
import com.hostel360.room.RoomRepository;
import com.hostel360.room.RoomStatus;
import com.hostel360.settings.SettingsRepository;
import com.hostel360.stay.BookingExportReader.Reservation;
import com.hostel360.stay.StayEnums.PaymentStatus;
import com.hostel360.stay.StayEnums.StaySource;
import com.hostel360.stay.StayEnums.StayStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Turns a Booking.com reservations export into stays. Only confirmed ("ok") reservations are imported;
 * rooms are picked by their Booking.com room type, and reservations already in the app are skipped.
 * Past stays come in checked out and paid, stays in progress checked in, and future ones booked.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class BookingImportService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d.M.yyyy");

    private final StayRepository stays;
    private final RoomRepository rooms;
    private final GuestRepository guests;
    private final SettingsRepository settings;

    @Schema(name = "BookingImportResult")
    public record Result(int imported, int alreadyInApp, int notImported,
                         @Schema(description = "Stays ended early because the next guest got the room") List<String> shortened,
                         @Schema(description = "Reservations that could not be imported") List<String> problems) {}

    public Result importExport(InputStream file) {
        var reservations = BookingExportReader.read(file);
        var run = new Run(settings.eurToRsd(), LocalDate.now());
        reservations.stream()
                .sorted(Comparator.comparing(Reservation::checkIn).thenComparing(Reservation::line))
                .forEach(run::add);
        return new Result(run.imported, run.alreadyInApp, run.notImported, run.shortened, run.problems);
    }

    private final class Run {
        final BigDecimal rate;
        final LocalDate today;
        int imported, alreadyInApp, notImported;
        final List<String> shortened = new ArrayList<>(), problems = new ArrayList<>();

        Run(BigDecimal rate, LocalDate today) {
            this.rate = rate;
            this.today = today;
        }

        void add(Reservation r) {
            if (!r.status().equals("ok")) {
                notImported++;
                return;
            }
            var label = "Line " + r.line() + " (" + r.guestName() + ", " + DATE.format(r.checkIn()) + "): ";
            if (!r.checkOut().isAfter(r.checkIn()) || r.unitTypes().isEmpty()) {
                problems.add(label + "missing dates or room type.");
                return;
            }
            Currency currency;
            try {
                currency = Currency.valueOf(r.currency());
            } catch (IllegalArgumentException e) {
                problems.add(label + "unknown currency " + r.currency() + ".");
                return;
            }
            int units = r.unitTypes().size();
            var shares = split(r.price(), units);
            int peopleLeft = r.people();
            for (int i = 0; i < units; i++) {
                var ref = units == 1 ? r.ref() : r.ref() + "-" + (i + 1);
                var type = r.unitTypes().get(i);
                if (stays.existsByBookingRef(ref) || linkManualStay(r, ref)) {
                    alreadyInApp++;
                    continue;
                }
                var candidates = rooms.findByBookingTypeIgnoreCaseOrderByNumberAsc(type);
                if (candidates.isEmpty()) {
                    problems.add(label + "no room is set to the Booking.com type \"" + type + "\".");
                    continue;
                }
                var room = pickRoom(candidates, r);
                if (room == null) {
                    problems.add(label + "all " + type + " rooms are taken on those dates.");
                    continue;
                }
                int people = Math.max(1, Math.min(room.getCapacity(), peopleLeft - (units - 1 - i)));
                peopleLeft -= people;
                save(r, ref, room, people, shares.get(i), currency);
                imported++;
            }
        }

        /** A stay the manager already typed in by hand: link it instead of adding a duplicate. */
        private boolean linkManualStay(Reservation r, String ref) {
            return stays.findManualStay(r.checkIn(), r.guestName())
                    .map(s -> {
                        s.setBookingRef(ref);
                        return true;
                    }).orElse(false);
        }

        /**
         * A free room of the type, or else one whose only overlap is an earlier Booking.com guest
         * (they left early and this guest got the room), ending that stay on this arrival.
         */
        private Room pickRoom(List<Room> candidates, Reservation r) {
            LocalDate from = r.checkIn(), to = r.checkOut();
            for (var room : candidates)
                if (stays.findUsingRoom(room.getId(), from, to).isEmpty()) return room;
            for (var room : candidates) {
                var overlaps = stays.findUsingRoom(room.getId(), from, to);
                if (overlaps.stream().allMatch(s -> s.getSource() == StaySource.BOOKING && !s.isLongTerm() && s.getCheckIn().isBefore(from))) {
                    for (var s : overlaps) {
                        shortened.add(s.getGuest().getName() + " in room " + room.getNumber() + " now leaves " + DATE.format(from)
                                + " instead of " + DATE.format(s.getCheckOut()) + ", when " + r.guestName() + " arrived.");
                        s.setCheckOut(from);
                    }
                    return room;
                }
            }
            return null;
        }

        private void save(Reservation r, String ref, Room room, int people, BigDecimal amount, Currency currency) {
            // Departed guests are done and paid; guests who arrived before today are in the house now.
            var status = r.checkOut().isBefore(today) ? StayStatus.CHECKED_OUT
                    : r.checkIn().isBefore(today) ? StayStatus.CHECKED_IN : StayStatus.BOOKED;
            var stay = new Stay();
            stay.setRoom(room);
            stay.setGuest(guest(r));
            stay.setPeople(people);
            stay.setLongTerm(false);
            stay.setSource(StaySource.BOOKING);
            stay.setCheckIn(r.checkIn());
            stay.setCheckOut(r.checkOut());
            stay.setAmount(amount);
            stay.setCurrency(currency);
            stay.setEurToRsd(rate);
            stay.setStatus(status);
            stay.setPaymentStatus(status == StayStatus.CHECKED_OUT ? PaymentStatus.PAID : PaymentStatus.NOT_PAID);
            if (status == StayStatus.CHECKED_IN) room.setStatus(RoomStatus.TAKEN);
            stay.setBookingRef(ref);
            stays.save(stay);
        }

        private Guest guest(Reservation r) {
            return guests.findFirstByNameIgnoreCaseOrderByIdAsc(r.guestName()).orElseGet(() -> {
                var g = new Guest();
                g.setName(r.guestName());
                g.setCountry(country(r.countryCode()));
                return guests.save(g);
            });
        }
    }

    /** ISO code ("ge") to the English name used by the guest form ("Georgia"). */
    private static String country(String code) {
        if (code == null || code.length() != 2) return null;
        var name = Locale.of("", code.toUpperCase(Locale.ROOT)).getDisplayCountry(Locale.ENGLISH);
        return name.isBlank() || name.equalsIgnoreCase(code) ? null : name;
    }

    /** Splits an amount into equal parts that add up exactly. */
    private static List<BigDecimal> split(BigDecimal total, int parts) {
        var share = total.divide(BigDecimal.valueOf(parts), 2, RoundingMode.DOWN);
        var result = new ArrayList<>(Collections.nCopies(parts, share));
        result.set(parts - 1, total.subtract(share.multiply(BigDecimal.valueOf(parts - 1))));
        return result;
    }
}
