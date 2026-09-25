package com.hostel360.finance;

import com.hostel360.common.BaseEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** One month of rent a long-term tenant has paid. */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class RentPayment extends BaseEntity {
    private Long stayId;
    /** First day of the paid month. */
    private LocalDate month;

    RentPayment(Long stayId, LocalDate month) {
        this.stayId = stayId;
        this.month = month;
    }
}
