import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH =
  process.env.NODE_ENV === 'production'
    ? '/data/xrp.db'
    : path.join(process.cwd(), 'data', 'xrp.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  initSchema();

  return db;
}

function initSchema(): void {
  const database = db!;

  // Accounts table - stores all account balances from scan
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      address TEXT PRIMARY KEY,
      balance REAL NOT NULL
    )
  `);

  // Index for fast percentile calculations
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_balance ON accounts(balance DESC)
  `);

  // Scan metadata for progress tracking and resumption
  database.exec(`
    CREATE TABLE IF NOT EXISTS scan_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Calculated thresholds (cached for fast API reads)
  database.exec(`
    CREATE TABLE IF NOT EXISTS thresholds (
      percentile REAL PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      min_xrp REAL NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
}

// Scan metadata helpers
export function getScanMeta(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM scan_meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setScanMeta(key: string, value: string): void {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO scan_meta (key, value) VALUES (?, ?)').run(
    key,
    value
  );
}

export function deleteScanMeta(key: string): void {
  const db = getDb();
  db.prepare('DELETE FROM scan_meta WHERE key = ?').run(key);
}

// Account balance helpers
export function clearAccounts(): void {
  const db = getDb();
  db.exec('DELETE FROM accounts');
}

export function insertAccountsBatch(
  accounts: Array<{ address: string; balance: number }>
): void {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR REPLACE INTO accounts (address, balance) VALUES (?, ?)'
  );

  const insertMany = db.transaction((items: typeof accounts) => {
    for (const item of items) {
      insert.run(item.address, item.balance);
    }
  });

  insertMany(accounts);
}

export function getAccountCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as {
    count: number;
  };
  return row.count;
}

// Threshold helpers
export interface ThresholdRow {
  percentile: number;
  name: string;
  emoji: string;
  min_xrp: number;
  updated_at: number;
}

export function getThresholds(): ThresholdRow[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM thresholds ORDER BY percentile ASC')
    .all() as ThresholdRow[];
}

export function setThresholds(
  thresholds: Array<{
    percentile: number;
    name: string;
    emoji: string;
    minXrp: number;
  }>
): void {
  const db = getDb();
  const now = Date.now();

  const insert = db.prepare(
    'INSERT OR REPLACE INTO thresholds (percentile, name, emoji, min_xrp, updated_at) VALUES (?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction(
    (items: Array<{ percentile: number; name: string; emoji: string; minXrp: number }>) => {
      for (const item of items) {
        insert.run(item.percentile, item.name, item.emoji, item.minXrp, now);
      }
    }
  );

  insertMany(thresholds);
}

// Calculate percentile thresholds from accounts table
export function calculatePercentileThreshold(percentile: number): number {
  const db = getDb();

  // Use ROW_NUMBER to find the balance at the given percentile rank
  // percentile is the top X%, so we want the balance at position (percentile/100 * total)
  const row = db
    .prepare(
      `
    WITH ranked AS (
      SELECT
        balance,
        ROW_NUMBER() OVER (ORDER BY balance DESC) as rank,
        COUNT(*) OVER () as total
      FROM accounts
    )
    SELECT balance
    FROM ranked
    WHERE rank <= CAST(total * ? / 100.0 AS INTEGER) + 1
    ORDER BY rank DESC
    LIMIT 1
  `
    )
    .get(percentile) as { balance: number } | undefined;

  return row?.balance ?? 0;
}

// Get total accounts count for stats
export function getTotalAccounts(): number {
  return getAccountCount();
}

// Close database connection
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
