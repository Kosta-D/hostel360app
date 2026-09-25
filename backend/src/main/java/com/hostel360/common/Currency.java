package com.hostel360.common;

/** EUR is the base currency; amounts in RSD are converted with the rate from settings. */
import java.math.BigDecimal;
import java.math.RoundingMode;

public enum Currency {
    EUR, RSD;

    /** This amount in EUR, using the rate saved with it. */
    public BigDecimal toEur(BigDecimal amount, BigDecimal eurToRsd) {
        return this == EUR ? amount : amount.divide(eurToRsd, 2, RoundingMode.HALF_UP);
    }
}
