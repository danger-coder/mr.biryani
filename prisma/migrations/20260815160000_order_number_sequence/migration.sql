-- Order numbers are human-facing (#MB1024) and must be unique under concurrency.
-- A database sequence is the only race-free source for them.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1024 INCREMENT BY 1;
