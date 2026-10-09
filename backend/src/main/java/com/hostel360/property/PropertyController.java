package com.hostel360.property;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.finance.ExpenseRepository;
import com.hostel360.property.PropertyDto.Request;
import com.hostel360.property.PropertyDto.Response;
import com.hostel360.room.Room;
import com.hostel360.room.RoomRepository;
import com.hostel360.stay.StayRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@Transactional
public class PropertyController {
    private final PropertyRepository repo;
    private final RoomRepository rooms;
    private final StayRepository stays;
    private final ExpenseRepository expenses;

    @GetMapping
    @Transactional(readOnly = true)
    public List<Response> listProperties() {
        var byProperty = rooms.findAllByOrderByNumberAsc().stream().collect(Collectors.groupingBy(r -> r.getProperty().getId()));
        return repo.findAllByOrderByIdAsc().stream().map(p -> response(p, byProperty.getOrDefault(p.getId(), List.of()))).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response createProperty(@Valid @RequestBody Request req) {
        var p = new Property();
        p.setType(req.type());
        apply(p, req);
        repo.save(p);
        if (!p.isApartment()) return response(p, List.of());
        var unit = new Room();
        unit.setProperty(p);
        unit.setNumber(1);
        syncUnit(unit, p, req);
        return response(p, List.of(rooms.save(unit)));
    }

    @PutMapping("/{id}")
    public Response updateProperty(@PathVariable Long id, @Valid @RequestBody Request req) {
        var p = find(id);
        if (req.type() != p.getType()) throw new BusinessException("A property's type can't be changed.");
        apply(p, req);
        var own = rooms.findByPropertyIdOrderByNumberAsc(id);
        if (p.isApartment()) own.forEach(unit -> syncUnit(unit, p, req));
        return response(p, own);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProperty(@PathVariable Long id) {
        var p = find(id);
        if (repo.count() == 1) throw new BusinessException("You need at least one property.");
        var own = rooms.findByPropertyIdOrderByNumberAsc(id);
        if (own.stream().anyMatch(r -> stays.existsByRoomId(r.getId())))
            throw new BusinessException(p.getName() + " has stays and can't be deleted.");
        if (expenses.existsByPropertyId(id))
            throw new BusinessException(p.getName() + " has expenses. Move them to another property or delete them first.");
        rooms.deleteAll(own);
        repo.delete(p);
    }

    private void apply(Property p, Request req) {
        var name = req.name().trim();
        if (repo.existsByNameIgnoreCaseAndIdNot(name, p.getId() != null ? p.getId() : -1L))
            throw new BusinessException("There is already a property called " + name + ".");
        p.setName(name);
        p.setAddress(req.address() == null || req.address().isBlank() ? null : req.address().trim());
        p.setBookingCommission(req.bookingCommission());
        p.setAirbnbCommission(req.airbnbCommission());
    }

    /** The apartment's hidden room carries its name and size. */
    private static void syncUnit(Room unit, Property p, Request req) {
        if (req.guests() == null) throw new BusinessException("Enter how many guests the apartment fits.");
        unit.setName(p.getName());
        unit.setCapacity(req.guests());
    }

    private static Response response(Property p, List<Room> own) {
        var unit = p.isApartment() && !own.isEmpty() ? own.getFirst() : null;
        return new Response(p.getId(), p.getName(), p.getType(), p.getAddress(), p.getBookingCommission(), p.getAirbnbCommission(),
                unit != null ? unit.getCapacity() : null, unit != null ? unit.getId() : null, p.isApartment() ? 0 : own.size());
    }

    private Property find(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Property", id));
    }
}
