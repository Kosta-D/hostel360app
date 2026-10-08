package com.hostel360.currency;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** A currency the manager accepts. EUR is the base (rate 1) and can't be changed. */
@Entity
@Getter
@Setter
public class Currency {
    public static final String EUR = "EUR";

    @Id
    private String code;
    private String name;
    /** How many units of this currency one EUR buys. */
    private BigDecimal rate;
    private boolean active = true;
}
