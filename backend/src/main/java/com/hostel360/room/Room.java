package com.hostel360.room;

import com.hostel360.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Room extends BaseEntity {
    private int number;
    private String name;
    private int floor;
    private int capacity;
    /** Rented long term (monthly tenant) rather than short term (nightly guests). */
    private boolean longTerm;
    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.AVAILABLE;
}
