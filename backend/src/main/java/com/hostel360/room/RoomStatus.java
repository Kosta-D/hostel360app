package com.hostel360.room;

public enum RoomStatus {
    /** Clean and free, can be booked. */
    AVAILABLE,
    /** Free of guests but not ready for use. */
    NEEDS_CLEANING,
    /** Someone is currently staying. */
    TAKEN
}
