package com.hostel360.stay;

import com.hostel360.common.BusinessException;
import com.hostel360.stay.StayDto.Request;
import com.hostel360.stay.StayDto.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stays")
@RequiredArgsConstructor
public class StayController {
    private final StayService service;
    private final StayRepository repo;
    private final BookingImportService bookingImport;

    /** Stays overlapping [from, to); all stays when no range is given. */
    @GetMapping
    @Transactional(readOnly = true)
    public List<Response> listStays(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long guestId) {
        return repo.search(from != null ? from : StayRepository.MIN, to != null ? to : StayRepository.MAX, guestId != null ? guestId : -1)
                .stream().map(Response::from).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public Response getStay(@PathVariable Long id) {
        return Response.from(service.find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Response createStay(@Valid @RequestBody Request req) {
        return Response.from(service.create(req));
    }

    @PutMapping("/{id}")
    @Transactional
    public Response updateStay(@PathVariable Long id, @Valid @RequestBody Request req) {
        return Response.from(service.update(id, req));
    }

    @PostMapping("/{id}/check-in")
    @Transactional
    public Response checkIn(@PathVariable Long id) {
        return Response.from(service.checkIn(id));
    }

    @PostMapping("/{id}/check-out")
    @Transactional
    public Response checkOut(@PathVariable Long id) {
        return Response.from(service.checkOut(id));
    }

    @PostMapping("/{id}/paid")
    @Transactional
    public Response markPaid(@PathVariable Long id) {
        return Response.from(service.markPaid(id));
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public Response cancelStay(@PathVariable Long id) {
        return Response.from(service.cancel(id));
    }

    /** Imports a reservations export from the Booking.com extranet (.xls or .xlsx). */
    @PostMapping(value = "/import-booking", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BookingImportService.Result importBooking(@RequestPart("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new BusinessException("Choose the export file to import.");
        try (var in = file.getInputStream()) {
            return bookingImport.importExport(in);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStay(@PathVariable Long id) {
        service.delete(id);
    }
}
