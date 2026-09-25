CREATE TABLE guest (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    country    VARCHAR(60),
    note       VARCHAR(500),
    created_at TIMESTAMPTZ  NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL
);

CREATE TABLE stay (
    id             BIGSERIAL PRIMARY KEY,
    room_id        BIGINT         NOT NULL REFERENCES room (id),
    guest_id       BIGINT         NOT NULL REFERENCES guest (id),
    people         INT            NOT NULL CHECK (people IN (1, 2)),
    long_term      BOOLEAN        NOT NULL,
    source         VARCHAR(20)    CHECK (source IN ('BOOKING', 'DIRECT')),
    check_in       DATE           NOT NULL,
    check_out      DATE           CHECK (check_out > check_in),
    amount         NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency       VARCHAR(3)     NOT NULL CHECK (currency IN ('EUR', 'RSD')),
    eur_to_rsd     NUMERIC(12, 4) NOT NULL,
    payment_status VARCHAR(20)    NOT NULL CHECK (payment_status IN ('NOT_PAID', 'PARTLY_PAID', 'PAID')),
    status         VARCHAR(20)    NOT NULL CHECK (status IN ('BOOKED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
    note           VARCHAR(500),
    created_at     TIMESTAMPTZ    NOT NULL,
    updated_at     TIMESTAMPTZ    NOT NULL,
    -- Short stays always have a departure date and a source.
    CHECK (long_term OR (check_out IS NOT NULL AND source IS NOT NULL))
);

CREATE INDEX stay_room_dates ON stay (room_id, check_in);
CREATE INDEX stay_guest ON stay (guest_id);
