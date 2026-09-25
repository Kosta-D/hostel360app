package com.hostel360.stay;

import com.hostel360.common.BusinessException;
import com.hostel360.common.NotFoundException;
import com.hostel360.guest.Guest;
import com.hostel360.guest.GuestRepository;
import com.hostel360.room.RoomRepository;
import com.hostel360.room.RoomStatus;
import com.hostel360.settings.SettingsRepository;
import com.hostel360.stay.StayEnums.StayStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/** Booking rules: capacity, no double booking, and room status on check-in/out. */
@Service
@Transactional
@RequiredArgsConstructor
public class StayService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d.M.yyyy");

    private final StayRepository stays;
    private final RoomRepository rooms;
    private final GuestRepository guests;
    private final SettingsRepository settings;

    public Stay create(StayDto.Request req) {
        var stay = new Stay();
        apply(stay, req);
        return stays.save(stay);
    }

    public Stay update(Long id, StayDto.Request req) {
        var stay = find(id);
        apply(stay, req);
        return stay;
    }

    public Stay checkIn(Long id) {
        var stay = find(id);
        requireStatus(stay, StayStatus.BOOKED, "check in");
        stay.setStatus(StayStatus.CHECKED_IN);
        stay.getRoom().setStatus(RoomStatus.TAKEN);
        return stay;
    }

    /** Ends the stay today if it was open-ended or planned to end later. */
    public Stay checkOut(Long id) {
        var stay = find(id);
        requireStatus(stay, StayStatus.CHECKED_IN, "check out");
        var today = LocalDate.now();
        if (stay.getCheckOut() == null || stay.getCheckOut().isAfter(today)) {
            stay.setCheckOut(today.isAfter(stay.getCheckIn()) ? today : stay.getCheckIn().plusDays(1));
        }
        stay.setStatus(StayStatus.CHECKED_OUT);
        stay.getRoom().setStatus(RoomStatus.NEEDS_CLEANING);
        return stay;
    }

    public Stay cancel(Long id) {
        var stay = find(id);
        requireStatus(stay, StayStatus.BOOKED, "cancel");
        stay.setStatus(StayStatus.CANCELLED);
        return stay;
    }

    public void delete(Long id) {
        var stay = find(id);
        if (stay.getStatus() == StayStatus.CHECKED_IN) stay.getRoom().setStatus(RoomStatus.NEEDS_CLEANING);
        stays.delete(stay);
    }

    public Stay find(Long id) {
        return stays.findById(id).orElseThrow(() -> new NotFoundException("Stay", id));
    }

    private void apply(Stay stay, StayDto.Request req) {
        var room = rooms.findById(req.roomId()).orElseThrow(() -> new NotFoundException("Room", req.roomId()));
        boolean longTerm = req.longTerm();

        if (req.people() > room.getCapacity())
            throw new BusinessException("Room " + room.getNumber() + " fits only " + room.getCapacity() + " person.");
        if (!longTerm && req.checkOut() == null)
            throw new BusinessException("A short stay needs a departure date.");
        if (!longTerm && req.source() == null)
            throw new BusinessException("Choose where the booking came from (Booking.com or Direct).");
        if (req.checkOut() != null && !req.checkOut().isAfter(req.checkIn()))
            throw new BusinessException("Departure must be after arrival.");

        boolean active = stay.getStatus() == StayStatus.BOOKED || stay.getStatus() == StayStatus.CHECKED_IN;
        if (active) {
            var end = req.checkOut() != null ? req.checkOut() : StayRepository.MAX;
            var excludeId = stay.getId() != null ? stay.getId() : -1L;
            stays.findOverlapping(room.getId(), excludeId, req.checkIn(), end).stream().findFirst().ifPresent(other -> {
                throw new BusinessException("Room " + room.getNumber() + " is already booked for " + other.getGuest().getName()
                        + " from " + DATE.format(other.getCheckIn())
                        + (other.getCheckOut() != null ? " to " + DATE.format(other.getCheckOut()) : " (no end date)") + ".");
            });
        }

        stay.setRoom(room);
        stay.setGuest(resolveGuest(req));
        stay.setPeople(req.people());
        stay.setLongTerm(longTerm);
        stay.setSource(longTerm ? null : req.source());
        stay.setCheckIn(req.checkIn());
        stay.setCheckOut(req.checkOut());
        if (stay.getAmount() == null || stay.getAmount().compareTo(req.amount()) != 0 || stay.getCurrency() != req.currency()) {
            stay.setEurToRsd(settings.eurToRsd());
        }
        stay.setAmount(req.amount());
        stay.setCurrency(req.currency());
        stay.setPaymentStatus(req.paymentStatus());
        stay.setNote(req.note() == null || req.note().isBlank() ? null : req.note().trim());
    }

    private Guest resolveGuest(StayDto.Request req) {
        if (req.guestId() != null)
            return guests.findById(req.guestId()).orElseThrow(() -> new NotFoundException("Guest", req.guestId()));
        if (req.guestName() == null || req.guestName().isBlank())
            throw new BusinessException("Choose a guest or type a new guest's name.");
        var guest = new Guest();
        guest.setName(req.guestName().trim());
        guest.setCountry(req.guestCountry() == null || req.guestCountry().isBlank() ? null : req.guestCountry().trim());
        return guests.save(guest);
    }

    private static void requireStatus(Stay stay, StayStatus expected, String action) {
        if (stay.getStatus() != expected)
            throw new BusinessException("Can't " + action + " a stay that is " + stay.getStatus().name().toLowerCase().replace('_', ' ') + ".");
    }
}
