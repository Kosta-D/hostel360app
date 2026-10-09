package com.hostel360;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Switching the primary currency converts every total; runs on its own database so other tests keep EUR. */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PrimaryCurrencyTest {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void makesSecondCurrencyPrimaryAndBack() throws Exception {
        var token = json.readTree(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"admin\"}")).andReturn().getResponse().getContentAsString()).get("token").asText();
        java.util.function.Function<MockHttpServletRequestBuilder, MockHttpServletRequestBuilder> authed =
                r -> r.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
        var rooms = json.readTree(mvc.perform(authed.apply(get("/api/rooms"))).andReturn().getResponse().getContentAsString());
        var stay = "{\"roomId\":%d,\"guestName\":\"G\",\"people\":1,\"longTerm\":false,\"source\":\"DIRECT\",\"checkIn\":\"2030-05-01\","
                + "\"checkOut\":\"2030-05-03\",\"amount\":%s,\"currency\":\"%s\",\"paymentStatus\":\"PAID\"}";
        var eurStay = json.readTree(mvc.perform(authed.apply(post("/api/stays")).content(stay.formatted(rooms.get(0).get("id").asLong(), "100", "EUR")))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        var rsdStay = json.readTree(mvc.perform(authed.apply(post("/api/stays")).content(stay.formatted(rooms.get(1).get("id").asLong(), "11740", "RSD")))
                .andExpect(jsonPath("$.amountPrimary").value(100.0))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();

        mvc.perform(authed.apply(post("/api/settings/primary")).content("{\"code\":\"USD\"}")).andExpect(status().isConflict());
        mvc.perform(authed.apply(post("/api/settings/primary")).content("{\"code\":\"RSD\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.primaryCurrency").value("RSD"))
                .andExpect(jsonPath("$.secondCurrency").value("EUR"));
        mvc.perform(authed.apply(get("/api/stays/" + rsdStay))).andExpect(jsonPath("$.amountPrimary").value(11740.0));
        mvc.perform(authed.apply(get("/api/stays/" + eurStay))).andExpect(jsonPath("$.amountPrimary").value(11740.0));

        mvc.perform(authed.apply(post("/api/settings/primary")).content("{\"code\":\"EUR\"}"))
                .andExpect(jsonPath("$.primaryCurrency").value("EUR"))
                .andExpect(jsonPath("$.secondRate").value(117.4));
        mvc.perform(authed.apply(get("/api/stays/" + eurStay))).andExpect(jsonPath("$.amountPrimary").value(100.0));
        mvc.perform(authed.apply(get("/api/stays/" + rsdStay))).andExpect(jsonPath("$.amountPrimary").value(100.0));
    }
}
