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
        mvc.perform(authed(put("/api/settings")).content("{\"hostelName\":\"Hostel 360\",\"eurToRsd\":117.2,\"bookingCommission\":15}"))
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

    static final String DOUBLE = "Double or Twin Room with Shared Bathroom", SINGLE = "Single Room with Shared Bathroom";

    /** A Booking.com extranet export with its Serbian headers (only the columns the import reads, in a different order). */
    static byte[] bookingExport(Object[]... rows) throws Exception {
        try (var wb = new org.apache.poi.hssf.usermodel.HSSFWorkbook(); var out = new java.io.ByteArrayOutputStream()) {
            var sheet = wb.createSheet("Sheet1");
            String[] header = {"Broj rezervacije", "Ime gosta", "Prijavljivanje", "Odjavljivanje ", "Status", "Osobe ", "Cena", "Booker country", "Vrsta jedinice"};
            var h = sheet.createRow(0);
            for (int i = 0; i < header.length; i++) h.createCell(i).setCellValue(header[i]);
            for (int r = 0; r < rows.length; r++) {
                var row = sheet.createRow(r + 1);
                for (int i = 0; i < rows[r].length; i++) {
                    if (rows[r][i] instanceof Number n) row.createCell(i).setCellValue(n.doubleValue());
                    else row.createCell(i).setCellValue(String.valueOf(rows[r][i]));
                }
            }
            wb.write(out);
            return out.toByteArray();
        }
    }

    String importBooking(byte[] file) throws Exception {
        return mvc.perform(multipart("/api/stays/import-booking").file(new org.springframework.mock.web.MockMultipartFile("file", "export.xls", "application/vnd.ms-excel", file))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void importsBookingExport() throws Exception {
        var file = bookingExport(
                new Object[]{1001d, "Ana Past", "2020-06-03", "2020-06-05", "ok", 1d, "53.56 EUR", "ge", SINGLE},
                new Object[]{1002d, "Nina Cancel", "2028-06-04", "2028-06-06", "cancelled_by_guest", 2d, "71.52 EUR", "de", DOUBLE},
                new Object[]{1003d, "Ivo NoShow", "2028-06-04", "2028-06-06", "no_show", 2d, "71.52 EUR", "de", DOUBLE},
                new Object[]{1004d, "Double One", "2028-06-10", "2028-06-12", "ok", 2d, "70 EUR", "fr", DOUBLE},
                new Object[]{1005d, "Double Two", "2028-06-10", "2028-06-12", "ok", 2d, "70 EUR", "fr", DOUBLE},
                new Object[]{1006d, "Early Leaver", "2028-07-01", "2028-07-08", "ok", 1d, "300 EUR", "tr", SINGLE},
                new Object[]{1007d, "Next Guest", "2028-07-05", "2028-07-07", "ok", 1d, "80 EUR", "mk", SINGLE},
                new Object[]{1008d, "Two Rooms", "2028-08-01", "2028-08-03", "ok", 3d, "100.01 EUR", "", SINGLE + ", " + DOUBLE});

        var result = json.readTree(importBooking(file));
        org.assertj.core.api.Assertions.assertThat(result.get("imported").asInt()).isEqualTo(7);
        org.assertj.core.api.Assertions.assertThat(result.get("notImported").asInt()).isEqualTo(2);
        org.assertj.core.api.Assertions.assertThat(result.get("shortened").toString()).contains("Early Leaver", "Next Guest");
        org.assertj.core.api.Assertions.assertThat(result.get("problems")).isEmpty();

        mvc.perform(authed(get("/api/stays?from=2020-06-01&to=2020-07-01")))
                .andExpect(jsonPath("$[0].guest.name").value("Ana Past"))
                .andExpect(jsonPath("$[0].guest.country").value("Georgia"))
                .andExpect(jsonPath("$[0].room.number").value(20))
                .andExpect(jsonPath("$[0].status").value("CHECKED_OUT"))
                .andExpect(jsonPath("$[0].paymentStatus").value("PAID"));
        mvc.perform(authed(get("/api/stays?from=2028-06-10&to=2028-06-11")))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].room.number").value(13))
                .andExpect(jsonPath("$[1].room.number").value(21))
                .andExpect(jsonPath("$[0].status").value("BOOKED"));
        mvc.perform(authed(get("/api/stays?from=2028-07-01&to=2028-07-02")))
                .andExpect(jsonPath("$[0].checkOut").value("2028-07-05"))
                .andExpect(jsonPath("$[0].amount").value(300.0));
        mvc.perform(authed(get("/api/stays?from=2028-08-01&to=2028-08-02")))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].room.number").value(13))
                .andExpect(jsonPath("$[0].people").value(2))
                .andExpect(jsonPath("$[0].amount").value(50.01))
                .andExpect(jsonPath("$[1].room.number").value(20))
                .andExpect(jsonPath("$[1].people").value(1))
                .andExpect(jsonPath("$[1].amount").value(50.0));

        var again = json.readTree(importBooking(file));
        org.assertj.core.api.Assertions.assertThat(again.get("imported").asInt()).isZero();
        org.assertj.core.api.Assertions.assertThat(again.get("alreadyInApp").asInt()).isEqualTo(7);
    }

    @Test
    void rejectsFilesThatAreNotBookingExports() throws Exception {
        mvc.perform(multipart("/api/stays/import-booking").file(new org.springframework.mock.web.MockMultipartFile("file", "x.txt", "text/plain", "hello".getBytes()))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    long createId(String url, String body) throws Exception {
        var res = mvc.perform(authed(post(url)).content(body)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("id").asLong();
    }

    String expense(String date, String category, int amount, boolean repeat) throws Exception {
        return json.writeValueAsString(Map.of("date", date, "category", category, "amount", amount, "currency", "EUR", "repeatMonthly", repeat));
    }

    @Test
    void financeYearAddsIncomeCommissionAndExpenses() throws Exception {
        createId("/api/stays", stay(roomId(12), "Fin Booking", 1, false, "2032-03-10", "2032-03-12", "EUR", 100));
        var direct = new java.util.HashMap<String, Object>(json.readValue(stay(roomId(13), "Fin Direct", 1, false, "2032-03-20", "2032-03-21", "EUR", 50), Map.class));
        direct.put("source", "DIRECT");
        createId("/api/stays", json.writeValueAsString(direct));
        createId("/api/stays", stay(roomId(1), "Fin Tenant", 1, true, "2032-02-01", "2032-05-01", "EUR", 300));
        createId("/api/expenses", expense("2032-03-05", "CLEANING", 20, false));
        var internet = createId("/api/expenses", expense("2032-01-15", "INTERNET", 30, true));

        mvc.perform(authed(get("/api/finance/year/2032")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(12))
                .andExpect(jsonPath("$[0].expenses").value(30.0))
                .andExpect(jsonPath("$[0].profit").value(-30.0))
                .andExpect(jsonPath("$[1].longTerm").value(300.0))
                .andExpect(jsonPath("$[2].booking").value(100.0))
                .andExpect(jsonPath("$[2].direct").value(50.0))
                .andExpect(jsonPath("$[2].longTerm").value(300.0))
                .andExpect(jsonPath("$[2].income").value(450.0))
                .andExpect(jsonPath("$[2].commission").value(15.0))
                .andExpect(jsonPath("$[2].expenses").value(50.0))
                .andExpect(jsonPath("$[2].profit").value(385.0))
                .andExpect(jsonPath("$[2].byCategory[0].category").value("INTERNET"))
                .andExpect(jsonPath("$[4].longTerm").value(0))
                .andExpect(jsonPath("$[11].expenses").value(30.0));
        mvc.perform(authed(get("/api/expenses?month=2032-03-01"))).andExpect(jsonPath("$.length()").value(2));

        mvc.perform(authed(post("/api/expenses/" + internet + "/stop"))).andExpect(jsonPath("$.repeatUntil").value("2032-01-01"));
        mvc.perform(authed(get("/api/finance/year/2032"))).andExpect(jsonPath("$[1].expenses").value(0));
    }

    @Test
    void unpaidListsShortStaysAndRentMonthsUntilPaid() throws Exception {
        var tenant = createId("/api/stays", stay(roomId(2), "Old Tenant", 1, true, "2021-01-01", "2021-03-01", "EUR", 250));
        var guest = createId("/api/stays", stay(roomId(20), "Old Guest", 1, false, "2021-01-10", "2021-01-12", "EUR", 40));
        var unpaid = "$[?(@.stayId == %d)]";

        mvc.perform(authed(get("/api/finance/unpaid")))
                .andExpect(jsonPath(unpaid.formatted(tenant) + ".month").value(org.hamcrest.Matchers.contains("2021-01-01", "2021-02-01")))
                .andExpect(jsonPath(unpaid.formatted(guest) + ".amountEur").value(org.hamcrest.Matchers.contains(40.0)));

        mvc.perform(authed(put("/api/finance/rent-payments")).content(json.writeValueAsString(Map.of("stayId", tenant, "month", "2021-01-01", "paid", true))))
                .andExpect(status().isNoContent());
        mvc.perform(authed(post("/api/stays/" + guest + "/paid"))).andExpect(jsonPath("$.paymentStatus").value("PAID"));

        mvc.perform(authed(get("/api/finance/unpaid")))
                .andExpect(jsonPath(unpaid.formatted(tenant) + ".month").value(org.hamcrest.Matchers.contains("2021-02-01")))
                .andExpect(jsonPath(unpaid.formatted(guest)).isEmpty());
    }
}
