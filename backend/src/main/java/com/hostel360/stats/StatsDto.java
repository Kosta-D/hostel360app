package com.hostel360.stats;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Yearly statistics. Money is in EUR and counts on the arrival date; occupancy counts nights. */
public final class StatsDto {
    private StatsDto() {}

    @Schema(name = "StatsTotals")
    public record Totals(
            @Schema(description = "Short stays that arrived in the period") int stays,
            @Schema(description = "Nights of those stays") int nights,
            BigDecimal income,
            @Schema(description = "Short-term occupancy in percent (nights sold / nights available)") BigDecimal occupancy,
            @Schema(description = "Short-stay income per night") BigDecimal avgPrice,
            BigDecimal avgStayNights, BigDecimal avgPeople,
            int guests,
            @Schema(description = "Guests of this period who have stayed more than once") int returningGuests,
            @Schema(description = "Share of short stays from Booking.com, in percent") BigDecimal bookingShareStays,
            @Schema(description = "Share of short-stay income from Booking.com, in percent") BigDecimal bookingShareIncome) {}

    @Schema(name = "StatsMonth")
    public record Month(LocalDate month, BigDecimal occupancy, int nightsSold, int nightsAvailable,
                        BigDecimal booking, BigDecimal direct, BigDecimal longTerm, BigDecimal avgPrice) {}

    @Schema(name = "StatsRoomMonth")
    public record RoomMonth(@Schema(description = "Share of the month the room was occupied, in percent") BigDecimal occupied,
                            @Schema(description = "A long-term tenant was in the room this month") boolean longTerm) {}

    @Schema(name = "StatsRoom")
    public record Room(Long id, int number, String name, int nightsSold,
                       @Schema(description = "Short-term occupancy for the year, in percent") BigDecimal occupancy,
                       BigDecimal income, BigDecimal avgPrice, List<RoomMonth> months) {}

    @Schema(name = "StatsCountry")
    public record Country(@Schema(nullable = true, description = "Empty when not known") String country,
                          int guests, int stays, int nights, BigDecimal income) {}

    @Schema(name = "YearStats")
    public record Year(int year, Totals totals,
                       @Schema(nullable = true, description = "Last year's totals, when there were stays") Totals previous,
                       List<Month> months, List<Room> rooms,
                       @Schema(description = "Most nights first") List<Country> countries) {}
}
