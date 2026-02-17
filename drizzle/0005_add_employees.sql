-- Employees module + employee tracking in sales
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add employee reference to sales
ALTER TABLE sales ADD COLUMN employee_id INTEGER;
ALTER TABLE sales ADD COLUMN employee_name TEXT;
