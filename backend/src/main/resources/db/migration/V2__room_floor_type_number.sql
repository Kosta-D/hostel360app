-- Rooms: add number, floor and long-term flag; drop price and notes; new status set.
ALTER TABLE room
    ADD COLUMN number    INT,
    ADD COLUMN floor     INT     NOT NULL DEFAULT 1 CHECK (floor IN (1, 2)),
    ADD COLUMN long_term BOOLEAN NOT NULL DEFAULT FALSE,
    DROP COLUMN price_per_night,
    DROP COLUMN notes;

-- Existing rows: take the number from a numeric name, otherwise park them at 900+.
UPDATE room SET number = CASE WHEN name ~ '^[0-9]{1,3}$' THEN name::INT ELSE 900 + id::INT END;
UPDATE room SET status = CASE status WHEN 'AVAILABLE' THEN 'AVAILABLE' ELSE 'NEEDS_CLEANING' END;
UPDATE room SET capacity = LEAST(capacity, 2);

ALTER TABLE room
    ALTER COLUMN number SET NOT NULL,
    ADD CONSTRAINT room_number_key UNIQUE (number),
    ADD CONSTRAINT room_capacity_check2 CHECK (capacity IN (1, 2)),
    ADD CONSTRAINT room_status_check CHECK (status IN ('AVAILABLE', 'NEEDS_CLEANING', 'TAKEN'));

-- The hostel's rooms.
INSERT INTO room (number, name, floor, capacity, long_term, status, created_at, updated_at) VALUES
    (1,  'Ksenija',                   1, 1, TRUE,  'AVAILABLE', now(), now()),
    (2,  'Dejan',                     1, 1, TRUE,  'AVAILABLE', now(), now()),
    (11, 'OneBedBig',                 1, 1, FALSE, 'AVAILABLE', now(), now()),
    (12, 'Bunk',                      1, 2, FALSE, 'AVAILABLE', now(), now()),
    (13, 'DoubleFirstFloor',          1, 2, FALSE, 'AVAILABLE', now(), now()),
    (20, 'MiniSingle',                2, 1, FALSE, 'AVAILABLE', now(), now()),
    (21, 'DoubleSecondFloorBathroom', 2, 2, FALSE, 'AVAILABLE', now(), now()),
    (22, 'DoubleSecondFloorBalcony',  2, 2, FALSE, 'AVAILABLE', now(), now()),
    (23, 'DoubleSecondFloorAndrej',   2, 2, TRUE,  'AVAILABLE', now(), now())
ON CONFLICT DO NOTHING;
