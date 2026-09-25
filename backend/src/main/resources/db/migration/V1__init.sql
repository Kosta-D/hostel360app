CREATE TABLE settings (
    id          BIGINT PRIMARY KEY,
    hostel_name VARCHAR(100)   NOT NULL,
    eur_to_rsd  NUMERIC(12, 4) NOT NULL
);
INSERT INTO settings (id, hostel_name, eur_to_rsd) VALUES (1, 'My Hostel', 117.4);

CREATE TABLE room (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50)    NOT NULL UNIQUE,
    capacity        INT            NOT NULL CHECK (capacity > 0),
    price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
    status          VARCHAR(20)    NOT NULL,
    notes           VARCHAR(500),
    created_at      TIMESTAMPTZ    NOT NULL,
    updated_at      TIMESTAMPTZ    NOT NULL
);
