package com.hostel360.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RentPaymentRepository extends JpaRepository<RentPayment, Long> {
    List<RentPayment> findByStayIdIn(Collection<Long> stayIds);

    Optional<RentPayment> findByStayIdAndMonth(Long stayId, LocalDate month);
}
