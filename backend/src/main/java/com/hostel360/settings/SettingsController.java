package com.hostel360.settings;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.currency.Currency;
import com.hostel360.currency.CurrencyRepository;
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
    private final CurrencyRepository currencies;

    @io.swagger.v3.oas.annotations.media.Schema(name = "Settings")
    public record SettingsDto(@NotBlank String hostelName,
                              @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal bookingCommission,
                              @io.swagger.v3.oas.annotations.media.Schema(nullable = true, description = "Totals are also shown in this currency; empty for EUR only")
                              String displayCurrency) {
        static SettingsDto from(Settings s) {
            return new SettingsDto(s.getHostelName(), s.getBookingCommission(), s.getDisplayCurrency());
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
        s.setBookingCommission(dto.bookingCommission());
        var display = dto.displayCurrency() == null || dto.displayCurrency().isBlank() || dto.displayCurrency().equals(Currency.EUR)
                ? null : dto.displayCurrency();
        if (display != null && !currencies.findById(display).map(Currency::isActive).orElse(false))
            throw new BusinessException("Choose a currency from the list in Settings.");
        s.setDisplayCurrency(display);
        return SettingsDto.from(s);
    }

    private Settings load() {
        return repo.findById(ID).orElseThrow(() -> new NotFoundException("Settings", ID));
    }
}
