-- Three currency slots in settings instead of an open list: a primary one (all totals) and two optional ones,
-- each with "1 primary = rate". Stays and expenses keep their own currency code and saved rate.
ALTER TABLE settings
    ADD COLUMN primary_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    ADD COLUMN second_currency  VARCHAR(3),
    ADD COLUMN second_rate      NUMERIC,
    ADD COLUMN third_currency   VARCHAR(3),
    ADD COLUMN third_rate       NUMERIC;

-- Second = the currency totals were also shown in (or the first other active one); third = the next active one.
UPDATE settings s SET second_currency = c.code, second_rate = c.rate
FROM (SELECT code, rate FROM currency
      WHERE active AND code <> 'EUR'
      ORDER BY code = (SELECT display_currency FROM settings WHERE id = 1) DESC NULLS LAST, code LIMIT 1) c;
UPDATE settings s SET third_currency = c.code, third_rate = c.rate
FROM (SELECT code, rate FROM currency
      WHERE active AND code NOT IN ('EUR', COALESCE((SELECT second_currency FROM settings WHERE id = 1), ''))
      ORDER BY code LIMIT 1) c;

ALTER TABLE settings
    DROP COLUMN display_currency,
    ADD CHECK (primary_currency ~ '^[A-Z]{3}$'),
    ADD CHECK ((second_currency IS NULL) = (second_rate IS NULL)),
    ADD CHECK ((third_currency IS NULL) = (third_rate IS NULL));

-- Records no longer point at a currency row; unlimited precision so switching the primary currency loses nothing.
ALTER TABLE stay DROP CONSTRAINT stay_currency_fkey,
    ADD CHECK (currency ~ '^[A-Z]{3}$'),
    ALTER COLUMN rate TYPE NUMERIC;
ALTER TABLE expense DROP CONSTRAINT expense_currency_fkey,
    ADD CHECK (currency ~ '^[A-Z]{3}$'),
    ALTER COLUMN rate TYPE NUMERIC;

DROP TABLE currency;
