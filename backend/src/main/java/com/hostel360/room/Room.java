package com.hostel360.room;

import com.hostel360.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
public class Room extends BaseEntity {
    private String name;
    private int capacity;
    /** Price in EUR (base currency). */
    private BigDecimal pricePerNight;
    @Enumerated(EnumType.STRING)
    private RoomStatus status = RoomStatus.AVAILABLE;
    private String notes;
}
