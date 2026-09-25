package com.hostel360.settings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;

public interface SettingsRepository extends JpaRepository<Settings, Long> {

    /** Current EUR to RSD rate, saved on every money record so later rate changes don't alter it. */
    default BigDecimal eurToRsd() {
        return findById(1L).map(Settings::getEurToRsd).orElseThrow();
    }
}
