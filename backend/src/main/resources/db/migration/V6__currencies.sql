-- Currencies the manager adds in Settings. EUR is the base: every rate says how many units one EUR buys.
CREATE TABLE currency (
    code   VARCHAR(3)     PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
    name   VARCHAR(40)    NOT NULL,
    rate   NUMERIC(14, 6) NOT NULL CHECK (rate > 0),
    active BOOLEAN        NOT NULL DEFAULT TRUE
);
INSERT INTO currency (code, name, rate) VALUES ('EUR', 'Euro', 1);
INSERT INTO currency (code, name, rate) SELECT 'RSD', 'Serbian dinar', eur_to_rsd FROM settings WHERE id = 1;

-- Totals are also shown in this currency (empty = EUR only).
ALTER TABLE settings ADD COLUMN display_currency VARCHAR(3) REFERENCES currency (code);
UPDATE settings SET display_currency = 'RSD';
ALTER TABLE settings DROP COLUMN eur_to_rsd;

-- Stays and expenses keep the rate they were saved with; EUR amounts have rate 1.
ALTER TABLE stay RENAME COLUMN eur_to_rsd TO rate;
ALTER TABLE stay ALTER COLUMN rate TYPE NUMERIC(14, 6);
ALTER TABLE stay DROP CONSTRAINT stay_currency_check;
ALTER TABLE stay ADD FOREIGN KEY (currency) REFERENCES currency (code);
UPDATE stay SET rate = 1 WHERE currency = 'EUR';

ALTER TABLE expense RENAME COLUMN eur_to_rsd TO rate;
ALTER TABLE expense ALTER COLUMN rate TYPE NUMERIC(14, 6);
ALTER TABLE expense DROP CONSTRAINT expense_currency_check;
ALTER TABLE expense ADD FOREIGN KEY (currency) REFERENCES currency (code);
UPDATE expense SET rate = 1 WHERE currency = 'EUR';
