-- Booking.com room type each room is sold as (several rooms can share one type).
ALTER TABLE room ADD COLUMN booking_type VARCHAR(150);

UPDATE room SET booking_type = 'Jednokrevetna Soba sa klima uredjajem sa Zajednickim Kupatilom' WHERE number = 11;
UPDATE room SET booking_type = 'Twin Room with Bunk Bed and Shared Bathroom' WHERE number = 12;
UPDATE room SET booking_type = 'Single Room with Shared Bathroom' WHERE number = 20;
UPDATE room SET booking_type = 'Double or Twin Room with Shared Bathroom' WHERE number IN (13, 21, 22, 23);

-- Booking.com reservation number, so re-importing the same export skips known stays.
ALTER TABLE stay ADD COLUMN booking_ref VARCHAR(40);
CREATE UNIQUE INDEX stay_booking_ref ON stay (booking_ref);
