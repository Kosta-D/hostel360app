package com.hostel360.finance;

import com.hostel360.common.NotFoundException;
import com.hostel360.finance.ExpenseDto.Request;
import com.hostel360.finance.ExpenseDto.Response;
import com.hostel360.settings.SettingsRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {
    private final ExpenseRepository repo;
    private final SettingsRepository settings;

    /** Expenses that count in the month containing {@code month}, repeating ones included. */
    @GetMapping
    public List<Response> listExpenses(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        var ym = YearMonth.from(month);
        return repo.findCounting(ym.atDay(1), ym.plusMonths(1).atDay(1)).stream()
                .filter(e -> e.appliesTo(ym)).map(Response::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response createExpense(@Valid @RequestBody Request req) {
        var e = new Expense();
        apply(e, req);
        return Response.from(repo.save(e));
    }

    @PutMapping("/{id}")
    @Transactional
    public Response updateExpense(@PathVariable Long id, @Valid @RequestBody Request req) {
        var e = find(id);
        apply(e, req);
        return Response.from(e);
    }

    /** Stops a repeating expense after the current month. */
    @PostMapping("/{id}/stop")
    @Transactional
    public Response stopRepeating(@PathVariable Long id) {
        var e = find(id);
        var start = e.getDate().withDayOfMonth(1);
        var thisMonth = LocalDate.now().withDayOfMonth(1);
        e.setRepeatUntil(thisMonth.isBefore(start) ? start : thisMonth);
        return Response.from(e);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteExpense(@PathVariable Long id) {
        repo.delete(find(id));
    }

    private Expense find(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Expense", id));
    }

    private void apply(Expense e, Request req) {
        if (e.getAmount() == null || e.getAmount().compareTo(req.amount()) != 0 || e.getCurrency() != req.currency())
            e.setEurToRsd(settings.eurToRsd());
        e.setDate(req.date());
        e.setCategory(req.category());
        e.setAmount(req.amount());
        e.setCurrency(req.currency());
        e.setNote(req.note() == null || req.note().isBlank() ? null : req.note().trim());
        if (!req.repeatMonthly()) e.setRepeatUntil(null);
        e.setRepeatMonthly(req.repeatMonthly());
    }
}
