package com.hostel360.settings;

import com.hostel360.common.BusinessException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;

/** The three currencies from Settings: rates for new amounts, and switching which one is primary. */
@Service
@RequiredArgsConstructor
public class CurrencyService {
    /** Rates shown in Settings keep 10 significant digits, so switching back and forth returns the same rate. */
    private static final MathContext PRECISION = new MathContext(10);
    private final SettingsRepository settings;
    private final EntityManager em;

    /**
     * Rate (units per 1 primary) for a new amount in {@code code}. A record that keeps a currency no longer
     * in Settings keeps its own rate ({@code currentRate}).
     */
    public BigDecimal rateFor(String code, String currentCode, BigDecimal currentRate) {
        var s = settings.load();
        if (code.equals(s.getPrimaryCurrency())) return BigDecimal.ONE;
        if (code.equals(s.getSecondCurrency())) return s.getSecondRate();
        if (code.equals(s.getThirdCurrency())) return s.getThirdRate();
        if (code.equals(currentCode) && currentRate != null) return currentRate;
        throw new BusinessException(code + " is not one of your currencies. Add it in Settings first.");
    }

    /**
     * Makes the second or third currency primary. Every saved rate is converted with that currency's current
     * rate, so old totals appear in the new primary; amounts already in it stay exact.
     */
    @Transactional
    public Settings makePrimary(String code) {
        var s = settings.load();
        BigDecimal factor;
        if (code.equals(s.getSecondCurrency())) {
            factor = s.getSecondRate();
            s.setSecondCurrency(s.getPrimaryCurrency());
            s.setSecondRate(rate(BigDecimal.ONE, factor));
            if (s.getThirdRate() != null) s.setThirdRate(rate(s.getThirdRate(), factor));
        } else if (code.equals(s.getThirdCurrency())) {
            factor = s.getThirdRate();
            s.setThirdCurrency(s.getPrimaryCurrency());
            s.setThirdRate(rate(BigDecimal.ONE, factor));
            if (s.getSecondRate() != null) s.setSecondRate(rate(s.getSecondRate(), factor));
        } else {
            throw new BusinessException("Only the second or third currency can become primary.");
        }
        s.setPrimaryCurrency(code);
        for (var table : new String[]{"stay", "expense"}) {
            em.createNativeQuery("UPDATE " + table + " SET rate = CASE WHEN currency = :code THEN 1 ELSE rate / :factor END")
                    .setParameter("code", code).setParameter("factor", factor).executeUpdate();
        }
        return s;
    }

    private static BigDecimal rate(BigDecimal rate, BigDecimal factor) {
        return rate.divide(factor, PRECISION).stripTrailingZeros();
    }
}
