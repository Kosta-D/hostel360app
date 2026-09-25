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
    void seedsTheHostelRooms() throws Exception {
        mvc.perform(authed(get("/api/rooms")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(9))
                .andExpect(jsonPath("$[0].number").value(1))
                .andExpect(jsonPath("$[0].name").value("Ksenija"))
                .andExpect(jsonPath("$[8].number").value(23))
                .andExpect(jsonPath("$[8].floor").value(2));
    }

    @Test
    void roomCrud() throws Exception {
        var room = Map.of("number", 101, "name", "Test room", "floor", 1, "capacity", 2, "longTerm", false, "status", "AVAILABLE");
        var created = mvc.perform(authed(post("/api/rooms")).content(json.writeValueAsString(room)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.number").value(101))
                .andReturn().getResponse().getContentAsString();
        var id = json.readTree(created).get("id").asLong();

        mvc.perform(authed(post("/api/rooms")).content(json.writeValueAsString(room)))
                .andExpect(status().isConflict());
        mvc.perform(authed(post("/api/rooms")).content(json.writeValueAsString(Map.of(
                        "number", 102, "name", "Too big", "floor", 3, "capacity", 3, "longTerm", false, "status", "AVAILABLE"))))
                .andExpect(status().isBadRequest());

        mvc.perform(authed(put("/api/rooms/" + id)).content(json.writeValueAsString(
                        Map.of("number", 101, "name", "Test room", "floor", 2, "capacity", 1, "longTerm", true, "status", "TAKEN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.floor").value(2))
                .andExpect(jsonPath("$.longTerm").value(true));

        mvc.perform(authed(patch("/api/rooms/" + id + "/status")).content("{\"status\":\"NEEDS_CLEANING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEEDS_CLEANING"));

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
