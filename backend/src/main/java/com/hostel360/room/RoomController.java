package com.hostel360.room;

import com.hostel360.common.NotFoundException;
import com.hostel360.room.RoomDto.Request;
import com.hostel360.room.RoomDto.Response;
import com.hostel360.room.RoomDto.StatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {
    private final RoomRepository repo;

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
        req.applyTo(room);
        return Response.from(repo.save(room));
    }

    @PutMapping("/{id}")
    @Transactional
    public Response updateRoom(@PathVariable Long id, @Valid @RequestBody Request req) {
        var room = find(id);
        req.applyTo(room);
        return Response.from(repo.saveAndFlush(room));
    }

    /** Quick status change from the rooms list (e.g. after cleaning). */
    @PatchMapping("/{id}/status")
    @Transactional
    public Response updateRoomStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req) {
        var room = find(id);
        room.setStatus(req.status());
        return Response.from(repo.saveAndFlush(room));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@PathVariable Long id) {
        repo.delete(find(id));
    }

    private Room find(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Room", id));
    }
}
