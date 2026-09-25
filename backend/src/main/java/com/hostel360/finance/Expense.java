package com.hostel360.finance;

import com.hostel360.common.BaseEntity;
import com.hostel360.common.Currency;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/** A cost. A repeating one counts every month from its date until {@code repeatUntil} (or for good). */
@Entity
@Getter
@Setter
public class Expense extends BaseEntity {
    private LocalDate date;
    @Enumerated(EnumType.STRING)
    private ExpenseCategory category;
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private Currency currency;
    private BigDecimal eurToRsd;
    private String note;
    private boolean repeatMonthly;
    /** First day of the last month a repeating expense counts in; empty while it keeps repeating. */
    private LocalDate repeatUntil;

    public BigDecimal amountEur() {
        return currency.toEur(amount, eurToRsd);
    }

    /** Whether this expense counts in the given month. */
    public boolean appliesTo(YearMonth month) {
        var start = YearMonth.from(date);
        if (!repeatMonthly) return start.equals(month);
        return !month.isBefore(start) && (repeatUntil == null || !month.isAfter(YearMonth.from(repeatUntil)));
    }
}
