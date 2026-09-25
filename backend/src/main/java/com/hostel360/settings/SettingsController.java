package com.hostel360.settings;

import com.hostel360.common.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {
    private static final long ID = 1L;
    private final SettingsRepository repo;

    @io.swagger.v3.oas.annotations.media.Schema(name = "Settings")
    public record SettingsDto(@NotBlank String hostelName, @NotNull @DecimalMin("0.0001") BigDecimal eurToRsd,
                              @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal bookingCommission) {
        static SettingsDto from(Settings s) {
            return new SettingsDto(s.getHostelName(), s.getEurToRsd(), s.getBookingCommission());
        }
    }

    @GetMapping
    public SettingsDto getSettings() {
        return SettingsDto.from(load());
    }

    @PutMapping
    @Transactional
    public SettingsDto updateSettings(@Valid @RequestBody SettingsDto dto) {
        var s = load();
        s.setHostelName(dto.hostelName());
        s.setEurToRsd(dto.eurToRsd());
        s.setBookingCommission(dto.bookingCommission());
        return SettingsDto.from(s);
    }

    private Settings load() {
        return repo.findById(ID).orElseThrow(() -> new NotFoundException("Settings", ID));
    }
}
