package com.hostel360.guest;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findAllByOrderByNameAsc();

    List<Guest> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    Optional<Guest> findFirstByNameIgnoreCaseOrderByIdAsc(String name);
}
