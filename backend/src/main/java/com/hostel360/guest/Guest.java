package com.hostel360.guest;

import com.hostel360.common.BaseEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Guest extends BaseEntity {
    private String name;
    private String country;
    private String note;
}
