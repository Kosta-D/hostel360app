package com.hostel360.room;

import com.hostel360.common.BaseEntity;
import com.hostel360.property.Property;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** A room of a hostel, or the single hidden unit of an apartment. */
@Entity
@Getter
@Setter
public class Room extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Property property;
    private int number;
    private String name;
    /** Empty for an apartment. */
    private Integer floor;
    private int capacity;
    /** Rented long term (monthly tenant) rather than short term (nightly guests). */
    private boolean longTerm;
    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.AVAILABLE;
    /** Booking.com room type this room is sold as; used by the reservations import. */
    private String bookingType;

    public boolean isApartment() {
        return property.isApartment();
    }
}
