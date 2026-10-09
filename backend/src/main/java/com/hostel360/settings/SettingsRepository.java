package com.hostel360.settings;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;

public interface SettingsRepository extends JpaRepository<Settings, Long> {

    default Settings load() {
        return findById(1L).orElseThrow();
    }

    /** Current Booking.com commission in percent, saved on each Booking.com stay. */
    default BigDecimal bookingCommission() {
        return load().getBookingCommission();
    }
}
