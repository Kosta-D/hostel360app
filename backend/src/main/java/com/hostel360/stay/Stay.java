package com.hostel360.stay;

import com.hostel360.common.BaseEntity;
import com.hostel360.common.Currency;
import com.hostel360.guest.Guest;
import com.hostel360.room.Room;
import com.hostel360.stay.StayEnums.PaymentStatus;
import com.hostel360.stay.StayEnums.StaySource;
import com.hostel360.stay.StayEnums.StayStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * One booking of a room by a guest. Dates are a half-open range [checkIn, checkOut).
 * Long-term stays use whole months (checkIn = 1st of the first month, checkOut = 1st of the month
 * after the last one) and may leave checkOut empty when the end is unknown.
 */
@Entity
@Getter
@Setter
public class Stay extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Room room;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Guest guest;
    private int people;
    private boolean longTerm;
    @Enumerated(EnumType.STRING)
    private StaySource source;
    private LocalDate checkIn;
    private LocalDate checkOut;
    /** Total for a short stay, monthly rent for a long-term one. */
    private BigDecimal amount;
    @Enumerated(EnumType.STRING)
    private Currency currency;
    /** Exchange rate when the amount was saved. */
    private BigDecimal eurToRsd;
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.NOT_PAID;
    @Enumerated(EnumType.STRING)
    private StayStatus status = StayStatus.BOOKED;
    private String note;
    /** Booking.com commission in percent when the stay was saved; empty for other sources. */
    private BigDecimal commissionPct;
    /** Booking.com reservation number for imported stays. */
    private String bookingRef;
}
