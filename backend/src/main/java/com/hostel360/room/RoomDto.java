package com.hostel360.room;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

public final class RoomDto {
    private RoomDto() {}

    @Schema(name = "RoomRequest")
    public record Request(
            @NotNull @Min(1) @Max(999) Integer number,
            @NotBlank @Size(max = 50) String name,
            @NotNull @Min(1) @Max(2) Integer floor,
            @NotNull @Min(1) @Max(2) Integer capacity,
            @NotNull Boolean longTerm,
            @NotNull RoomStatus status) {

        void applyTo(Room r) {
            r.setNumber(number);
            r.setName(name.trim());
            r.setFloor(floor);
            r.setCapacity(capacity);
            r.setLongTerm(longTerm);
            r.setStatus(status);
        }
    }

    @Schema(name = "RoomStatusRequest")
    public record StatusRequest(@NotNull RoomStatus status) {}

    @Schema(name = "Room")
    public record Response(Long id, int number, String name, int floor, int capacity, boolean longTerm, RoomStatus status) {
        static Response from(Room r) {
            return new Response(r.getId(), r.getNumber(), r.getName(), r.getFloor(), r.getCapacity(), r.isLongTerm(), r.getStatus());
        }
    }
}
