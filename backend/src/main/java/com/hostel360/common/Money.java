package com.hostel360.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Every amount is stored with the rate (units per 1 primary currency) that applied when it was saved. */
public final class Money {
    private Money() {}

    public static BigDecimal toPrimary(BigDecimal amount, BigDecimal rate) {
        return amount.divide(rate, 2, RoundingMode.HALF_UP);
    }
}
