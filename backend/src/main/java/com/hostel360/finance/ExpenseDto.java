package com.hostel360.finance;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class ExpenseDto {
    private ExpenseDto() {}

    @Schema(name = "ExpenseRequest")
    public record Request(
            @NotNull LocalDate date,
            @NotNull ExpenseCategory category,
            @NotNull @DecimalMin("0") BigDecimal amount,
            @NotBlank String currency,
            @Size(max = 500) String note,
            @NotNull Boolean repeatMonthly) {}

    @Schema(name = "Expense")
    public record Response(Long id, LocalDate date, ExpenseCategory category, BigDecimal amount, String currency,
                           @Schema(description = "Units of the currency per 1 primary currency when saved") BigDecimal rate, BigDecimal amountPrimary, @Schema(nullable = true) String note,
                           boolean repeatMonthly,
                           @Schema(nullable = true, description = "First day of the last month a repeating expense counts in") LocalDate repeatUntil) {
        static Response from(Expense e) {
            return new Response(e.getId(), e.getDate(), e.getCategory(), e.getAmount(), e.getCurrency(), e.getRate(),
                    e.amountPrimary(), e.getNote(), e.isRepeatMonthly(), e.getRepeatUntil());
        }
    }
}
