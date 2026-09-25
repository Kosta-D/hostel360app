package com.hostel360.guest;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.guest.GuestDto.Request;
import com.hostel360.guest.GuestDto.Response;
import com.hostel360.stay.StayRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guests")
@RequiredArgsConstructor
public class GuestController {
    private final GuestRepository repo;
    private final StayRepository stays;

    @GetMapping
    public List<Response> listGuests(@RequestParam(required = false) String q) {
        var guests = q == null || q.isBlank() ? repo.findAllByOrderByNameAsc() : repo.findByNameContainingIgnoreCaseOrderByNameAsc(q.trim());
        return guests.stream().map(Response::from).toList();
    }

    @GetMapping("/{id}")
    public Response getGuest(@PathVariable Long id) {
        return Response.from(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response createGuest(@Valid @RequestBody Request req) {
        var guest = new Guest();
        req.applyTo(guest);
        return Response.from(repo.save(guest));
    }

    @PutMapping("/{id}")
    @Transactional
    public Response updateGuest(@PathVariable Long id, @Valid @RequestBody Request req) {
        var guest = find(id);
        req.applyTo(guest);
        return Response.from(guest);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGuest(@PathVariable Long id) {
        var guest = find(id);
        if (stays.existsByGuestId(id)) throw new BusinessException(guest.getName() + " has stays. Delete those first.");
        repo.delete(guest);
    }

    private Guest find(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Guest", id));
    }
}
