package com.hostel360.currency;

import com.hostel360.common.BusinessException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;

public interface CurrencyRepository extends JpaRepository<Currency, String> {

    /**
     * Current rate for a new amount in {@code code}. Switched-off currencies are refused,
     * unless the record already uses it ({@code current}).
     */
    default BigDecimal rateFor(String code, String current) {
        var c = findById(code).orElseThrow(() -> new BusinessException("Unknown currency " + code + ". Add it in Settings."));
        if (!c.isActive() && !code.equals(current)) throw new BusinessException(code + " is switched off in Settings.");
        return c.getRate();
    }
}
