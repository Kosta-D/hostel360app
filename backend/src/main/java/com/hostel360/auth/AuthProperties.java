package com.hostel360.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties("app.auth")
public record AuthProperties(
        @NotBlank String username,
        @NotBlank String password,
        @Size(min = 32, message = "must be at least 32 characters") String jwtSecret,
        Duration tokenTtl) {
}
