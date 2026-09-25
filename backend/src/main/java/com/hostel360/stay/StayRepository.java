package com.hostel360.stay;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface StayRepository extends JpaRepository<Stay, Long> {
    LocalDate MIN = LocalDate.of(1900, 1, 1);
    LocalDate MAX = LocalDate.of(9999, 12, 31);

    /** Stays overlapping [from, to), optionally for one guest (guestId = -1 for all). */
    @Query("""
            select s from Stay s join fetch s.room join fetch s.guest
            where s.checkIn < :to and (s.checkOut is null or s.checkOut > :from)
              and (:guestId = -1 or s.guest.id = :guestId)
            order by s.checkIn, s.room.number""")
    List<Stay> search(LocalDate from, LocalDate to, long guestId);

    /** Active stays in a room overlapping [from, to), other than the one being edited. */
    @Query("""
            select s from Stay s join fetch s.guest
            where s.room.id = :roomId and s.id <> :excludeId
              and s.status in (com.hostel360.stay.StayEnums.StayStatus.BOOKED, com.hostel360.stay.StayEnums.StayStatus.CHECKED_IN)
              and s.checkIn < :to and (s.checkOut is null or s.checkOut > :from)""")
    List<Stay> findOverlapping(long roomId, long excludeId, LocalDate from, LocalDate to);

    boolean existsByGuestId(Long guestId);

    boolean existsByRoomId(Long roomId);
}
