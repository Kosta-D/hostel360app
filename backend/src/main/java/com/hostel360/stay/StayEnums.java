package com.hostel360.stay;

public final class StayEnums {
    private StayEnums() {}

    /** Where a short-term booking came from. */
    public enum StaySource { BOOKING, DIRECT }

    public enum StayStatus { BOOKED, CHECKED_IN, CHECKED_OUT, CANCELLED }

    public enum PaymentStatus { NOT_PAID, PARTLY_PAID, PAID }
}
