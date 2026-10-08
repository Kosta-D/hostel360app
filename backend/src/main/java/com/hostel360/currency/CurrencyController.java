package com.hostel360.currency;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.finance.ExpenseRepository;
import com.hostel360.settings.SettingsRepository;
import com.hostel360.stay.StayRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/currencies")
@RequiredArgsConstructor
public class CurrencyController {
    private final CurrencyRepository repo;
    private final StayRepository stays;
    private final ExpenseRepository expenses;
    private final SettingsRepository settings;

    @io.swagger.v3.oas.annotations.media.Schema(name = "CurrencyRequest")
    public record Request(@NotBlank @Pattern(regexp = "[A-Za-z]{3}", message = "must be 3 letters, like USD") String code,
                          @NotBlank @Size(max = 40) String name,
                          @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal rate,
                          @NotNull Boolean active) {}

    @io.swagger.v3.oas.annotations.media.Schema(name = "Currency")
    public record Response(String code, String name, BigDecimal rate, boolean active, boolean inUse) {}

    /** All currencies, EUR first. */
    @GetMapping
    public List<Response> listCurrencies() {
        return repo.findAll().stream()
                .sorted(Comparator.comparing((Currency c) -> !c.getCode().equals(Currency.EUR)).thenComparing(Currency::getCode))
                .map(this::toResponse).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Response createCurrency(@Valid @RequestBody Request req) {
        var code = req.code().toUpperCase();
        if (repo.existsById(code)) throw new BusinessException(code + " is already in the list.");
        var c = new Currency();
        c.setCode(code);
        apply(c, req);
        return toResponse(repo.save(c));
    }

    /** Changes name, rate or on/off. Past stays and expenses keep the rate they were saved with. */
    @PutMapping("/{code}")
    @Transactional
    public Response updateCurrency(@PathVariable String code, @Valid @RequestBody Request req) {
        var c = find(code);
        apply(c, req);
        if (!c.isActive() && code.equals(settings.load().getDisplayCurrency()))
            throw new BusinessException("Totals are also shown in " + code + ". Pick another currency for that first.");
        return toResponse(c);
    }

    /** Only for currencies nothing uses yet (e.g. a typo); otherwise switch it off. */
    @DeleteMapping("/{code}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void deleteCurrency(@PathVariable String code) {
        var c = find(code);
        if (inUse(code)) throw new BusinessException(code + " is used by stays, expenses or settings. Switch it off instead.");
        repo.delete(c);
    }

    private void apply(Currency c, Request req) {
        if (Currency.EUR.equals(c.getCode())) throw new BusinessException("EUR is the base currency and can't be changed.");
        c.setName(req.name().trim());
        c.setRate(req.rate());
        c.setActive(req.active());
    }

    private boolean inUse(String code) {
        return stays.existsByCurrency(code) || expenses.existsByCurrency(code) || code.equals(settings.load().getDisplayCurrency());
    }

    private Response toResponse(Currency c) {
        return new Response(c.getCode(), c.getName(), c.getRate(), c.isActive(), c.getCode().equals(Currency.EUR) || inUse(c.getCode()));
    }

    private Currency find(String code) {
        return repo.findById(code.toUpperCase()).orElseThrow(() -> new NotFoundException("Currency", code));
    }
}
