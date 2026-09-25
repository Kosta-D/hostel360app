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
    /** How many RSD one EUR buys; the manager updates it when the rate changes. */
    private BigDecimal eurToRsd;
}
