package com.hostel360.guest;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findAllByOrderByNameAsc();

    List<Guest> findByNameContainingIgnoreCaseOrderByNameAsc(String name);
}
