package com.hostel360.settings;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Single-row table (id = 1) with hostel-wide settings. */
@Entity
@Getter
@Setter
public class Settings {
    @Id
    private Long id;
    private String hostelName;
    /** Totals are also shown in this currency; empty for EUR only. */
    private String displayCurrency;
    /** Booking.com commission in percent. */
    private BigDecimal bookingCommission;
}
