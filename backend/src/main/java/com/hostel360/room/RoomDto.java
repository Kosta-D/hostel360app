package com.hostel360.room;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public final class RoomDto {
    private RoomDto() {}

    @Schema(name = "RoomRequest")
    public record Request(
            @NotBlank @Size(max = 50) String name,
            @NotNull @Min(1) @Max(50) Integer capacity,
            @NotNull @DecimalMin("0") BigDecimal pricePerNight,
            @NotNull RoomStatus status,
            @Size(max = 500) String notes) {

        void applyTo(Room r) {
            r.setName(name.trim());
            r.setCapacity(capacity);
            r.setPricePerNight(pricePerNight);
            r.setStatus(status);
            r.setNotes(notes);
        }
    }

    @Schema(name = "Room")
    public record Response(Long id, String name, int capacity, BigDecimal pricePerNight, RoomStatus status, String notes) {
        static Response from(Room r) {
            return new Response(r.getId(), r.getName(), r.getCapacity(), r.getPricePerNight(), r.getStatus(), r.getNotes());
        }
    }
}
