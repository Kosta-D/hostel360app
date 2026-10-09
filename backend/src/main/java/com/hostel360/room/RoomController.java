package com.hostel360.room;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.property.PropertyRepository;
import com.hostel360.room.RoomDto.Request;
import com.hostel360.room.RoomDto.Response;
import com.hostel360.room.RoomDto.StatusRequest;
import com.hostel360.stay.StayRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Transactional
public class RoomController {
    private final RoomRepository repo;
    private final StayRepository stays;
    private final PropertyRepository properties;

    @GetMapping
    public List<Response> listRooms() {
        return repo.findAllByOrderByNumberAsc().stream().map(Response::from).toList();
    }

    @GetMapping("/{id}")
    public Response getRoom(@PathVariable Long id) {
        return Response.from(find(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Response createRoom(@Valid @RequestBody Request req) {
        var room = new Room();
        apply(room, req);
        return Response.from(repo.save(room));
    }

    @PutMapping("/{id}")
    public Response updateRoom(@PathVariable Long id, @Valid @RequestBody Request req) {
        var room = find(id);
        if (room.isApartment()) throw new BusinessException("An apartment has no rooms; edit it on the Properties page.");
        apply(room, req);
        return Response.from(repo.saveAndFlush(room));
    }

    /** Quick status change from the rooms list (e.g. after cleaning). */
    @PatchMapping("/{id}/status")
    public Response updateRoomStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        var room = find(id);
        room.setStatus(req.status());
        return Response.from(repo.saveAndFlush(room));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@PathVariable Long id) {
        var room = find(id);
        if (room.isApartment()) throw new BusinessException("Delete the apartment on the Properties page.");
        if (stays.existsByRoomId(id)) throw new BusinessException("Room " + room.getNumber() + " has stays and can't be deleted.");
        repo.delete(room);
    }

    /** Rooms belong to a hostel; numbers and names are unique inside it. */
    private void apply(Room room, Request req) {
        var property = properties.findById(req.propertyId()).orElseThrow(() -> new NotFoundException("Property", req.propertyId()));
        if (property.isApartment()) throw new BusinessException(property.getName() + " is an apartment and has no rooms.");
        var id = room.getId() != null ? room.getId() : -1L;
        if (repo.existsByPropertyIdAndNumberAndIdNot(property.getId(), req.number(), id))
            throw new BusinessException(property.getName() + " already has a room " + req.number() + ".");
        if (repo.existsByPropertyIdAndNameIgnoreCaseAndIdNot(property.getId(), req.name().trim(), id))
            throw new BusinessException(property.getName() + " already has a room called " + req.name().trim() + ".");
        room.setProperty(property);
        req.applyTo(room);
    }

    private Room find(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Room", id));
    }
}
