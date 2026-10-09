package com.hostel360.property;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long> {
    List<Property> findAllByOrderByIdAsc();

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
