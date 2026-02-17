-- Add cash_register_id to sales (nullable FK to cash_registers)
ALTER TABLE sales ADD COLUMN cash_register_id INTEGER REFERENCES cash_registers(id);
