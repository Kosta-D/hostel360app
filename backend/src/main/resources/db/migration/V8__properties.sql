-- Several properties: a hostel has rooms; an apartment is rented whole and has one hidden unit (a room row).
CREATE TABLE property (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(60)  NOT NULL UNIQUE,
    type               VARCHAR(20)  NOT NULL CHECK (type IN ('HOSTEL', 'APARTMENT')),
    address            VARCHAR(200),
    booking_commission NUMERIC(5, 2) NOT NULL CHECK (booking_commission BETWEEN 0 AND 100),
    airbnb_commission  NUMERIC(5, 2) NOT NULL CHECK (airbnb_commission BETWEEN 0 AND 100),
    created_at         TIMESTAMPTZ  NOT NULL,
    updated_at         TIMESTAMPTZ  NOT NULL
);

-- Everything that exists today belongs to the hostel; the commission moves from settings to it.
INSERT INTO property (name, type, booking_commission, airbnb_commission, created_at, updated_at)
SELECT 'Hostel', 'HOSTEL', booking_commission, 3, now(), now() FROM settings WHERE id = 1;
ALTER TABLE settings DROP COLUMN booking_commission;

-- Rooms: numbers and names unique inside a property; any floor (none for an apartment); up to 10 people.
ALTER TABLE room ADD COLUMN property_id BIGINT REFERENCES property (id);
UPDATE room SET property_id = (SELECT min(id) FROM property);
ALTER TABLE room
    ALTER COLUMN property_id SET NOT NULL,
    DROP CONSTRAINT room_name_key,
    DROP CONSTRAINT room_number_key,
    DROP CONSTRAINT room_capacity_check2,
    DROP CONSTRAINT room_floor_check,
    ALTER COLUMN floor DROP NOT NULL,
    ALTER COLUMN floor DROP DEFAULT,
    ADD CONSTRAINT room_property_number_key UNIQUE (property_id, number),
    ADD CONSTRAINT room_property_name_key UNIQUE (property_id, name),
    ADD CONSTRAINT room_capacity_check2 CHECK (capacity BETWEEN 1 AND 10);

-- Stays: Airbnb as a source; groups up to the room's capacity.
ALTER TABLE stay
    DROP CONSTRAINT stay_people_check,
    DROP CONSTRAINT stay_source_check,
    ADD CONSTRAINT stay_people_check CHECK (people BETWEEN 1 AND 10),
    ADD CONSTRAINT stay_source_check CHECK (source IN ('BOOKING', 'AIRBNB', 'DIRECT'));

-- Expenses: one property, or empty for an expense shared by all properties.
ALTER TABLE expense ADD COLUMN property_id BIGINT REFERENCES property (id);
UPDATE expense SET property_id = (SELECT min(id) FROM property);
