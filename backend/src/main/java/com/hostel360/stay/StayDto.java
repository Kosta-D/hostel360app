package com.hostel360.stay;

import com.hostel360.common.Currency;
import com.hostel360.stay.StayEnums.PaymentStatus;
import com.hostel360.stay.StayEnums.StaySource;
import com.hostel360.stay.StayEnums.StayStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class StayDto {
    private StayDto() {}

    @Schema(name = "StayRequest", description = "Pass guestId for an existing guest, or guestName (and guestCountry) to create one.")
    public record Request(
            @NotNull Long roomId,
            Long guestId,
            @Size(max = 100) String guestName,
            @Size(max = 60) String guestCountry,
            @NotNull @Min(1) @Max(2) Integer people,
            @NotNull Boolean longTerm,
            StaySource source,
            @NotNull LocalDate checkIn,
            LocalDate checkOut,
            @NotNull @DecimalMin("0") BigDecimal amount,
            @NotNull Currency currency,
            @NotNull PaymentStatus paymentStatus,
            @Size(max = 500) String note) {
    }

    @Schema(name = "StayRoom")
    public record RoomRef(Long id, int number, String name) {}

    @Schema(name = "StayGuest")
    public record GuestRef(Long id, String name, @Schema(nullable = true) String country) {}

    @Schema(name = "Stay")
    public record Response(
            Long id, RoomRef room, GuestRef guest, int people, boolean longTerm,
            @Schema(nullable = true) StaySource source,
            LocalDate checkIn,
            @Schema(nullable = true, description = "Exclusive end date; empty for an open-ended long-term stay") LocalDate checkOut,
            @Schema(nullable = true, description = "Short stays only") Integer nights,
            BigDecimal amount, Currency currency, BigDecimal eurToRsd,
            @Schema(description = "Amount converted to EUR with the saved rate") BigDecimal amountEur,
            PaymentStatus paymentStatus, StayStatus status,
            @Schema(nullable = true) String note) {

        static Response from(Stay s) {
            var room = s.getRoom();
            var guest = s.getGuest();
            Integer nights = s.isLongTerm() || s.getCheckOut() == null ? null : (int) ChronoUnit.DAYS.between(s.getCheckIn(), s.getCheckOut());
            var amountEur = s.getCurrency() == Currency.EUR ? s.getAmount() : s.getAmount().divide(s.getEurToRsd(), 2, RoundingMode.HALF_UP);
            return new Response(s.getId(), new RoomRef(room.getId(), room.getNumber(), room.getName()),
                    new GuestRef(guest.getId(), guest.getName(), guest.getCountry()), s.getPeople(), s.isLongTerm(),
                    s.getSource(), s.getCheckIn(), s.getCheckOut(), nights, s.getAmount(), s.getCurrency(), s.getEurToRsd(),
                    amountEur, s.getPaymentStatus(), s.getStatus(), s.getNote());
        }
    }
}
