package com.hostel360.property;

import com.hostel360.common.BaseEntity;
import com.hostel360.stay.StayEnums.StaySource;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** A place that is rented out. An apartment has exactly one hidden room, its "unit", so stays work the same everywhere. */
@Entity
@Getter
@Setter
public class Property extends BaseEntity {
    private String name;
    @Enumerated(EnumType.STRING)
    private PropertyType type;
    private String address;
    /** Commissions in percent, saved on each stay from that site. */
    private BigDecimal bookingCommission;
    private BigDecimal airbnbCommission;

    public boolean isApartment() {
        return type == PropertyType.APARTMENT;
    }

    /** Commission in percent for a stay from this source, or null when the source takes none. */
    public BigDecimal commissionFor(StaySource source) {
        return switch (source) {
            case BOOKING -> bookingCommission;
            case AIRBNB -> airbnbCommission;
            case DIRECT -> null;
        };
    }
}
