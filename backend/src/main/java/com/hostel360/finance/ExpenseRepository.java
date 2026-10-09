package com.hostel360.finance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    /** Expenses that may count in [from, to): dated in the range, or repeating and started before its end. */
    @Query("""
            select e from Expense e
            where e.date < :to and (e.date >= :from or (e.repeatMonthly = true and (e.repeatUntil is null or e.repeatUntil >= :from)))
            order by e.date, e.id""")
    List<Expense> findCounting(LocalDate from, LocalDate to);
}
