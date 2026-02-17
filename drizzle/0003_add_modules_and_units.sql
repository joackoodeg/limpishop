-- Add module toggles and configurable units to store_config
ALTER TABLE store_config ADD COLUMN enabled_modules TEXT DEFAULT '{"cajaDiaria":false,"empleados":false}';
ALTER TABLE store_config ADD COLUMN allowed_units TEXT DEFAULT '["unidad","kilo","litro"]';
ALTER TABLE store_config ADD COLUMN custom_units TEXT DEFAULT '[]';
