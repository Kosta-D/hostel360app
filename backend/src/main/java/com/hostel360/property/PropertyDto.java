package com.hostel360.property;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public final class PropertyDto {
    private PropertyDto() {}

    @Schema(name = "PropertyRequest")
    public record Request(
            @NotBlank @Size(max = 60) String name,
            @NotNull @Schema(description = "Can't be changed after the property is added") PropertyType type,
            @Size(max = 200) String address,
            @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal bookingCommission,
            @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal airbnbCommission,
            @Schema(nullable = true, description = "Apartments only: most guests at once") @Min(1) @Max(10) Integer guests) {}

    @Schema(name = "Property")
    public record Response(Long id, String name, PropertyType type, @Schema(nullable = true) String address,
                           BigDecimal bookingCommission, BigDecimal airbnbCommission,
                           @Schema(nullable = true, description = "Apartments only: most guests at once") Integer guests,
                           @Schema(nullable = true, description = "Apartments only: the hidden room that stays are booked in") Long unitId,
                           @Schema(description = "Hostels: number of rooms") int rooms) {}
}
