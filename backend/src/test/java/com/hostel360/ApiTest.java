package com.hostel360;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
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

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ApiTest {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    String token;

    @BeforeEach
    void login() throws Exception {
        var body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", "admin", "password", "admin"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        token = json.readTree(body).get("token").asText();
    }

    MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder req) {
        return req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON);
    }

    @Test
    void rejectsBadLoginAndMissingToken() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/rooms")).andExpect(status().isUnauthorized());
    }

    @Test
    void roomCrud() throws Exception {
        var room = Map.of("name", "101", "capacity", 2, "pricePerNight", 35, "status", "AVAILABLE");
        var created = mvc.perform(authed(post("/api/rooms")).content(json.writeValueAsString(room)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("101"))
                .andReturn().getResponse().getContentAsString();
        var id = json.readTree(created).get("id").asLong();

        mvc.perform(authed(post("/api/rooms")).content(json.writeValueAsString(room)))
                .andExpect(status().isConflict());
        mvc.perform(authed(post("/api/rooms")).content("{\"name\":\"\",\"capacity\":0}"))
                .andExpect(status().isBadRequest());

        mvc.perform(authed(put("/api/rooms/" + id)).content(json.writeValueAsString(
                        Map.of("name", "101", "capacity", 3, "pricePerNight", 40, "status", "CLEANING"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLEANING"));

        mvc.perform(authed(delete("/api/rooms/" + id))).andExpect(status().isNoContent());
        mvc.perform(authed(get("/api/rooms/" + id))).andExpect(status().isNotFound());
    }

    @Test
    void updatesExchangeRate() throws Exception {
        mvc.perform(authed(get("/api/settings"))).andExpect(jsonPath("$.eurToRsd").value(117.4));
        mvc.perform(authed(put("/api/settings")).content("{\"hostelName\":\"Hostel 360\",\"eurToRsd\":117.2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eurToRsd").value(117.2));
    }
}
