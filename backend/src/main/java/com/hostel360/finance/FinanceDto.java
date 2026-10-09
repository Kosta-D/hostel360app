package com.hostel360.finance;

import com.hostel360.stay.StayEnums.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Finance report shapes. All totals are in the primary currency. */
public final class FinanceDto {
    private FinanceDto() {}

    @Schema(name = "CategoryTotal")
    public record CategoryTotal(ExpenseCategory category, BigDecimal amount) {}

    @Schema(name = "MonthSummary", description = "Income counts on the arrival date; long-term rent counts once per month.")
    public record MonthSummary(
            @Schema(description = "First day of the month") LocalDate month,
            BigDecimal booking, BigDecimal airbnb, BigDecimal direct, BigDecimal longTerm, BigDecimal income,
            @Schema(description = "Booking.com and Airbnb commission") BigDecimal commission, BigDecimal expenses, BigDecimal costs, BigDecimal profit,
            @Schema(description = "Expenses by category, largest first") List<CategoryTotal> byCategory,
            int arrivals) {}

    @Schema(name = "UnpaidItem", description = "A short stay not fully paid, or one unpaid month of a long-term stay")
    public record UnpaidItem(
            Long stayId, String guestName, int roomNumber,
            @Schema(description = "The apartment's name for an apartment") String roomName, boolean apartment, boolean longTerm,
            LocalDate checkIn,
            @Schema(nullable = true) LocalDate checkOut,
            @Schema(nullable = true, description = "Rent month (first day) for long-term stays") LocalDate month,
            BigDecimal amount, String currency, BigDecimal amountPrimary,
            @Schema(nullable = true, description = "Short stays only") PaymentStatus paymentStatus) {}

    @Schema(name = "RentPaymentRequest")
    public record RentPaymentRequest(@NotNull Long stayId, @NotNull LocalDate month, @NotNull Boolean paid) {}
}
