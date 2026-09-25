package com.hostel360.finance;

import com.hostel360.finance.FinanceDto.MonthSummary;
import com.hostel360.finance.FinanceDto.RentPaymentRequest;
import com.hostel360.finance.FinanceDto.UnpaidItem;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
public class FinanceController {
    private final FinanceService service;

    /** Income, costs and profit for each month of the year. */
    @GetMapping("/year/{year}")
    public List<MonthSummary> financeYear(@PathVariable int year) {
        return service.year(year);
    }

    @GetMapping("/unpaid")
    public List<UnpaidItem> listUnpaid() {
        return service.unpaid();
    }

    /** Marks one month of a long-term stay as paid or unpaid. */
    @PutMapping("/rent-payments")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setRentPaid(@Valid @RequestBody RentPaymentRequest req) {
        service.setRentPaid(req.stayId(), req.month(), req.paid());
    }
}
