package com.hostel360.room;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

public final class RoomDto {
    private RoomDto() {}

    @Schema(name = "RoomRequest")
    public record Request(
            @NotNull Long propertyId,
            @NotNull @Min(1) @Max(999) Integer number,
            @NotBlank @Size(max = 50) String name,
            @NotNull @Min(-5) @Max(200) Integer floor,
            @NotNull @Min(1) @Max(10) Integer capacity,
            @NotNull Boolean longTerm,
            @NotNull RoomStatus status,
            @Size(max = 150) String bookingType) {

        void applyTo(Room r) {
            r.setNumber(number);
            r.setName(name.trim());
            r.setFloor(floor);
            r.setCapacity(capacity);
            r.setLongTerm(longTerm);
            r.setStatus(status);
            r.setBookingType(bookingType == null || bookingType.isBlank() ? null : bookingType.trim());
        }
    }

    @Schema(name = "RoomStatusRequest")
    public record StatusRequest(@NotNull RoomStatus status) {}

    @Schema(name = "Room", description = "A hostel room, or an apartment's hidden unit (apartment = true, named after the apartment)")
    public record Response(Long id, Long propertyId, String propertyName, boolean apartment, int number, String name,
                           @Schema(nullable = true) Integer floor, int capacity, boolean longTerm, RoomStatus status,
                           @Schema(nullable = true) String bookingType) {
        static Response from(Room r) {
            var p = r.getProperty();
            return new Response(r.getId(), p.getId(), p.getName(), p.isApartment(), r.getNumber(), r.getName(), r.getFloor(),
                    r.getCapacity(), r.isLongTerm(), r.getStatus(), r.getBookingType());
        }
    }
}
