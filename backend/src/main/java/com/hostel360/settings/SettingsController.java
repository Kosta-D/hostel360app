package com.hostel360.settings;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Locale;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {
    private static final long ID = 1L;
    private static final String CODE = "[A-Za-z]{3}";
    private final SettingsRepository repo;
    private final CurrencyService currencies;

    @Schema(name = "Settings", description = "Rates are units of that currency per 1 primary currency.")
    public record SettingsDto(@NotBlank String hostelName,
                              @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal bookingCommission,
                              @Schema(description = "Read-only here; change it with POST /api/settings/primary") String primaryCurrency,
                              @Schema(nullable = true) @Pattern(regexp = CODE, message = "must be 3 letters, like RSD") String secondCurrency,
                              @Schema(nullable = true) @DecimalMin(value = "0", inclusive = false) BigDecimal secondRate,
                              @Schema(nullable = true) @Pattern(regexp = CODE, message = "must be 3 letters, like USD") String thirdCurrency,
                              @Schema(nullable = true) @DecimalMin(value = "0", inclusive = false) BigDecimal thirdRate) {
        static SettingsDto from(Settings s) {
            return new SettingsDto(s.getHostelName(), s.getBookingCommission(), s.getPrimaryCurrency(),
                    s.getSecondCurrency(), s.getSecondRate(), s.getThirdCurrency(), s.getThirdRate());
        }
    }

    @Schema(name = "PrimaryCurrencyRequest")
    public record PrimaryRequest(@NotBlank String code) {}

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
        String second = code(dto.secondCurrency()), third = code(dto.thirdCurrency());
        BigDecimal secondRate = dto.secondRate(), thirdRate = dto.thirdRate();
        if (second == null) { second = third; secondRate = thirdRate; third = null; }
        check(second, secondRate, s.getPrimaryCurrency());
        check(third, thirdRate, s.getPrimaryCurrency());
        if (second != null && second.equals(third)) throw new BusinessException("The second and third currency must differ.");
        s.setSecondCurrency(second);
        s.setSecondRate(second == null ? null : secondRate);
        s.setThirdCurrency(third);
        s.setThirdRate(third == null ? null : thirdRate);
        return SettingsDto.from(s);
    }

    /** Makes the second or third currency primary; all totals, old ones included, switch to it. */
    @PostMapping("/primary")
    public SettingsDto makePrimary(@Valid @RequestBody PrimaryRequest req) {
        return SettingsDto.from(currencies.makePrimary(req.code().toUpperCase(Locale.ROOT)));
    }

    private static String code(String c) {
        return c == null || c.isBlank() ? null : c.trim().toUpperCase(Locale.ROOT);
    }

    private static void check(String code, BigDecimal rate, String primary) {
        if (code == null) return;
        if (code.equals(primary)) throw new BusinessException(code + " is already the primary currency.");
        if (rate == null) throw new BusinessException("Enter the rate for " + code + ".");
    }

    private Settings load() {
        return repo.findById(ID).orElseThrow(() -> new NotFoundException("Settings", ID));
    }
}
