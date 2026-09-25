package com.hostel360.guest;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class GuestDto {
    private GuestDto() {}

    @Schema(name = "GuestRequest")
    public record Request(@NotBlank @Size(max = 100) String name, @Size(max = 60) String country, @Size(max = 500) String note) {
        void applyTo(Guest g) {
            g.setName(name.trim());
            g.setCountry(blankToNull(country));
            g.setNote(blankToNull(note));
        }
    }

    @Schema(name = "Guest")
    public record Response(Long id, String name, @Schema(nullable = true) String country, @Schema(nullable = true) String note) {
        public static Response from(Guest g) {
            return new Response(g.getId(), g.getName(), g.getCountry(), g.getNote());
        }
    }

    static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
