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

    long roomId(int number) throws Exception {
        var body = mvc.perform(authed(get("/api/rooms"))).andReturn().getResponse().getContentAsString();
        for (var room : json.readTree(body)) if (room.get("number").asInt() == number) return room.get("id").asLong();
        throw new AssertionError("no room " + number);
    }

    String stay(long roomId, Object guest, int people, boolean longTerm, String in, String out, String currency, int amount) throws Exception {
        var stay = new java.util.HashMap<String, Object>(Map.of("roomId", roomId, "people", people, "longTerm", longTerm,
                "checkIn", in, "amount", amount, "currency", currency, "paymentStatus", "NOT_PAID"));
        if (guest instanceof Long id) stay.put("guestId", id); else stay.put("guestName", guest);
        if (out != null) stay.put("checkOut", out);
        if (!longTerm) stay.put("source", "BOOKING");
        return json.writeValueAsString(stay);
    }

    @Test
    void createsStayWithNewGuestAndBlocksDoubleBooking() throws Exception {
        var room = roomId(12);
        var created = mvc.perform(authed(post("/api/stays")).content(stay(room, "Ana Petrović", 2, false, "2030-01-10", "2030-01-13", "RSD", 11740)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.guest.name").value("Ana Petrović"))
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.amountEur").value(100.0))
                .andExpect(jsonPath("$.status").value("BOOKED"))
                .andReturn().getResponse().getContentAsString();
        var guestId = json.readTree(created).get("guest").get("id").asLong();

        mvc.perform(authed(post("/api/stays")).content(stay(room, guestId, 1, false, "2030-01-12", "2030-01-15", "EUR", 90)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("already booked for Ana Petrović")));
        // Departure day is free for the next arrival.
        mvc.perform(authed(post("/api/stays")).content(stay(room, guestId, 1, false, "2030-01-13", "2030-01-14", "EUR", 30)))
                .andExpect(status().isCreated());

        mvc.perform(authed(get("/api/stays?from=2030-01-01&to=2030-02-01&guestId=" + guestId)))
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(authed(delete("/api/guests/" + guestId))).andExpect(status().isConflict());
    }

    @Test
    void rejectsMoreGuestsThanCapacityAndShortStayWithoutDeparture() throws Exception {
        mvc.perform(authed(post("/api/stays")).content(stay(roomId(11), "Big Group", 2, false, "2030-02-01", "2030-02-02", "EUR", 30)))
                .andExpect(status().isConflict());
        mvc.perform(authed(post("/api/stays")).content(stay(roomId(20), "No End", 1, false, "2030-02-01", null, "EUR", 30)))
                .andExpect(status().isConflict());
    }

    @Test
    void checkInAndOutUpdateRoomStatus() throws Exception {
        var room = roomId(13);
        var created = mvc.perform(authed(post("/api/stays")).content(stay(room, "Marko", 2, false, "2030-03-01", "2030-03-04", "EUR", 120)))
                .andReturn().getResponse().getContentAsString();
        var id = json.readTree(created).get("id").asLong();

        mvc.perform(authed(post("/api/stays/" + id + "/check-out"))).andExpect(status().isConflict());
        mvc.perform(authed(post("/api/stays/" + id + "/check-in"))).andExpect(jsonPath("$.status").value("CHECKED_IN"));
        mvc.perform(authed(get("/api/rooms/" + room))).andExpect(jsonPath("$.status").value("TAKEN"));
        mvc.perform(authed(post("/api/stays/" + id + "/check-out"))).andExpect(jsonPath("$.status").value("CHECKED_OUT"));
        mvc.perform(authed(get("/api/rooms/" + room))).andExpect(jsonPath("$.status").value("NEEDS_CLEANING"));
    }

    @Test
    void openEndedLongTermStayBlocksRoomUntilCancelled() throws Exception {
        var room = roomId(23);
        var created = mvc.perform(authed(post("/api/stays")).content(stay(room, "Andrej", 1, true, "2031-01-01", null, "EUR", 250)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.source").isEmpty())
                .andExpect(jsonPath("$.nights").isEmpty())
                .andReturn().getResponse().getContentAsString();
        var id = json.readTree(created).get("id").asLong();

        mvc.perform(authed(post("/api/stays")).content(stay(room, "Later Guest", 1, false, "2035-05-01", "2035-05-03", "EUR", 60)))
                .andExpect(status().isConflict());
        mvc.perform(authed(post("/api/stays/" + id + "/cancel"))).andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(authed(post("/api/stays")).content(stay(room, "Later Guest", 1, false, "2035-05-01", "2035-05-03", "EUR", 60)))
                .andExpect(status().isCreated());
    }
}
