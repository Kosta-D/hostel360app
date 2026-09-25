package com.hostel360.config;

import io.swagger.v3.oas.models.media.Schema;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;

/** Marks every response field as required so the generated TypeScript types are non-optional. */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenApiCustomizer requiredResponseFields() {
        return api -> api.getComponents().getSchemas().forEach((name, schema) -> {
            if (!name.endsWith("Request") && schema.getProperties() != null) {
                schema.setRequired(new ArrayList<>(((Schema<?>) schema).getProperties().keySet()));
            }
        });
    }
}
