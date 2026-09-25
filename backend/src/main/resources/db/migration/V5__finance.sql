-- Booking.com commission in percent; each Booking.com stay keeps the rate that applied when it was saved.
ALTER TABLE settings ADD COLUMN booking_commission NUMERIC(5, 2) NOT NULL DEFAULT 15;
ALTER TABLE stay ADD COLUMN commission_pct NUMERIC(5, 2);
UPDATE stay SET commission_pct = 15 WHERE source = 'BOOKING';

CREATE TABLE expense (
    id             BIGSERIAL PRIMARY KEY,
    date           DATE           NOT NULL,
    category       VARCHAR(30)    NOT NULL,
    amount         NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency       VARCHAR(3)     NOT NULL CHECK (currency IN ('EUR', 'RSD')),
    eur_to_rsd     NUMERIC(12, 4) NOT NULL,
    note           VARCHAR(500),
    -- A repeating expense counts every month from its date until repeat_until (first day of the last month).
    repeat_monthly BOOLEAN        NOT NULL DEFAULT FALSE,
    repeat_until   DATE,
    created_at     TIMESTAMPTZ    NOT NULL,
    updated_at     TIMESTAMPTZ    NOT NULL
);
CREATE INDEX expense_date ON expense (date);

-- Months a long-term tenant has paid (month = first day of the month).
CREATE TABLE rent_payment (
    id         BIGSERIAL PRIMARY KEY,
    stay_id    BIGINT      NOT NULL REFERENCES stay (id) ON DELETE CASCADE,
    month      DATE        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (stay_id, month)
);
