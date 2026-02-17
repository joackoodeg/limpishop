-- Cash Register module tables
CREATE TABLE IF NOT EXISTS cash_registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  opening_amount REAL NOT NULL DEFAULT 0,
  closing_amount REAL,
  expected_amount REAL,
  difference REAL,
  status TEXT NOT NULL DEFAULT 'open',
  note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cash_register_id INTEGER NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'otro',
  reference_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
