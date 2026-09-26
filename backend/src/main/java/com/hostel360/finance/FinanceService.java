package com.hostel360.finance;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.finance.FinanceDto.CategoryTotal;
import com.hostel360.finance.FinanceDto.MonthSummary;
import com.hostel360.finance.FinanceDto.UnpaidItem;
import com.hostel360.stay.Stay;
import com.hostel360.stay.StayEnums.PaymentStatus;
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

/**
 * Profit and loss from stays and expenses. Short stays count on their arrival date; long-term rent
 * counts once per month of the stay (an open-ended stay through the end of the requested year).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class FinanceService {
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final StayRepository stays;
    private final ExpenseRepository expenses;
    private final RentPaymentRepository rentPayments;

    @Transactional(readOnly = true)
    public List<MonthSummary> year(int year) {
        var from = LocalDate.of(year, 1, 1);
        var to = from.plusYears(1);
        var months = new TreeMap<YearMonth, Totals>();
        for (int m = 1; m <= 12; m++) months.put(YearMonth.of(year, m), new Totals());

        for (var s : active(stays.search(from, to, -1))) {
            var eur = s.amountEur();
            if (s.isLongTerm()) {
                s.rentMonths(YearMonth.of(year, 12)).map(months::get).filter(Objects::nonNull).forEach(t -> t.longTerm = t.longTerm.add(eur));
            } else if (!s.getCheckIn().isBefore(from) && s.getCheckIn().isBefore(to)) {
                var t = months.get(YearMonth.from(s.getCheckIn()));
                t.arrivals++;
                if (s.getSource() == StaySource.BOOKING) {
                    t.booking = t.booking.add(eur);
                    var pct = s.getCommissionPct() != null ? s.getCommissionPct() : BigDecimal.ZERO;
                    t.commission = t.commission.add(eur.multiply(pct).divide(HUNDRED, 4, RoundingMode.HALF_UP));
                } else {
                    t.direct = t.direct.add(eur);
                }
            }
        }
        for (var e : expenses.findCounting(from, to))
            months.forEach((month, t) -> {
                if (e.appliesTo(month)) t.byCategory.merge(e.getCategory(), e.amountEur(), BigDecimal::add);
            });
        return months.entrySet().stream().map(m -> m.getValue().summary(m.getKey())).toList();
    }

    /** Short stays that arrived and aren't fully paid, and unpaid rent months up to this month. */
    @Transactional(readOnly = true)
    public List<UnpaidItem> unpaid() {
        var today = LocalDate.now();
        var all = active(stays.search(StayRepository.MIN, today.plusDays(1), -1));
        var longTermIds = all.stream().filter(Stay::isLongTerm).map(Stay::getId).toList();
        var paid = new HashSet<String>();
        rentPayments.findByStayIdIn(longTermIds).forEach(p -> paid.add(p.getStayId() + "@" + p.getMonth()));

        var result = new ArrayList<UnpaidItem>();
        for (var s : all) {
            if (s.isLongTerm()) {
                s.rentMonths(YearMonth.from(today))
                        .filter(m -> !paid.contains(s.getId() + "@" + m.atDay(1)))
                        .forEach(m -> result.add(item(s, m.atDay(1))));
            } else if (s.getPaymentStatus() != PaymentStatus.PAID) {
                result.add(item(s, null));
            }
        }
        result.sort(Comparator.comparing((UnpaidItem i) -> i.month() != null ? i.month() : i.checkIn()));
        return result;
    }

    public void setRentPaid(Long stayId, LocalDate month, boolean paid) {
        var stay = stays.findById(stayId).orElseThrow(() -> new NotFoundException("Stay", stayId));
        if (!stay.isLongTerm()) throw new BusinessException("Only long-term stays are paid by month.");
        var first = month.withDayOfMonth(1);
        var existing = rentPayments.findByStayIdAndMonth(stayId, first);
        if (paid && existing.isEmpty()) rentPayments.save(new RentPayment(stayId, first));
        if (!paid) existing.ifPresent(rentPayments::delete);
    }

    private static List<Stay> active(List<Stay> list) {
        return list.stream().filter(s -> s.getStatus() != StayStatus.CANCELLED).toList();
    }

    private static UnpaidItem item(Stay s, LocalDate month) {
        return new UnpaidItem(s.getId(), s.getGuest().getName(), s.getRoom().getNumber(), s.getRoom().getName(), s.isLongTerm(),
                s.getCheckIn(), s.getCheckOut(), month, s.getAmount(), s.getCurrency(), s.amountEur(),
                s.isLongTerm() ? null : s.getPaymentStatus());
    }

    private static final class Totals {
        BigDecimal booking = BigDecimal.ZERO, direct = BigDecimal.ZERO, longTerm = BigDecimal.ZERO, commission = BigDecimal.ZERO;
        final Map<ExpenseCategory, BigDecimal> byCategory = new EnumMap<>(ExpenseCategory.class);
        int arrivals;

        MonthSummary summary(YearMonth month) {
            var income = booking.add(direct).add(longTerm);
            var expenses = byCategory.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            var commission = this.commission.setScale(2, RoundingMode.HALF_UP);
            var costs = commission.add(expenses);
            var categories = byCategory.entrySet().stream()
                    .map(e -> new CategoryTotal(e.getKey(), e.getValue()))
                    .sorted(Comparator.comparing(CategoryTotal::amount).reversed()).toList();
            return new MonthSummary(month.atDay(1), booking, direct, longTerm, income, commission, expenses, costs,
                    income.subtract(costs), categories, arrivals);
        }
    }
}
