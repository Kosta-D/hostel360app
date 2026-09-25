package com.hostel360.room;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findAllByOrderByNumberAsc();

    List<Room> findByBookingTypeIgnoreCaseOrderByNumberAsc(String bookingType);
}
