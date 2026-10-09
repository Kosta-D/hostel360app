package com.hostel360.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    /** Every room and apartment unit, property by property. */
    @Query("select r from Room r join fetch r.property p order by p.id, r.number")
    List<Room> findAllByOrderByNumberAsc();

    List<Room> findByPropertyIdOrderByNumberAsc(Long propertyId);

    List<Room> findByPropertyIdAndBookingTypeIgnoreCaseOrderByNumberAsc(Long propertyId, String bookingType);

    boolean existsByPropertyIdAndNumberAndIdNot(Long propertyId, int number, Long id);

    boolean existsByPropertyIdAndNameIgnoreCaseAndIdNot(Long propertyId, String name, Long id);
}
