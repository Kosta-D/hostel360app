package com.hostel360.settings;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Single-row table (id = 1) with app-wide settings. */
@Entity
@Getter
@Setter
public class Settings {
    @Id
    private Long id;
    private String hostelName;
    /** All totals are in this currency. */
    private String primaryCurrency;
    /** Optional second currency (totals are also shown in it) and third one; rates are units per 1 primary. */
    private String secondCurrency;
    private BigDecimal secondRate;
    private String thirdCurrency;
    private BigDecimal thirdRate;
}
