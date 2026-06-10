import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('syncro_red.db');
  await initSchema(db);
  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sync_queue (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo        TEXT NOT NULL,
      datos       TEXT NOT NULL,
      timestamp_dispositivo TEXT NOT NULL,
      intentos    INTEGER DEFAULT 0,
      creado_en   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS turno_cache (
      fecha       TEXT PRIMARY KEY,
      datos       TEXT NOT NULL,
      actualizado TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS servicio_activo_cache (
      id          INTEGER PRIMARY KEY,
      datos       TEXT NOT NULL,
      actualizado TEXT DEFAULT (datetime('now'))
    );
  `);
}

export async function enqueueSyncOp(
  tipo: string,
  datos: Record<string, unknown>,
  timestamp?: string
): Promise<void> {
  const database = await getDB();
  const ts = timestamp ?? new Date().toISOString();
  await database.runAsync(
    'INSERT INTO sync_queue (tipo, datos, timestamp_dispositivo) VALUES (?, ?, ?)',
    [tipo, JSON.stringify(datos), ts]
  );
}

export async function getPendingSyncOps(limit = 50): Promise<SyncOp[]> {
  const database = await getDB();
  const rows = await database.getAllAsync<SyncOpRow>(
    'SELECT * FROM sync_queue WHERE intentos < 5 ORDER BY timestamp_dispositivo ASC LIMIT ?',
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    datos: JSON.parse(r.datos),
    timestamp_dispositivo: r.timestamp_dispositivo,
    intentos: r.intentos,
  }));
}

export async function removeSyncOp(id: number): Promise<void> {
  const database = await getDB();
  await database.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function incrementSyncOpIntentos(id: number): Promise<void> {
  const database = await getDB();
  await database.runAsync('UPDATE sync_queue SET intentos = intentos + 1 WHERE id = ?', [id]);
}

export async function cacheTurno(fecha: string, datos: unknown): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO turno_cache (fecha, datos, actualizado) VALUES (?, ?, datetime('now'))
     ON CONFLICT(fecha) DO UPDATE SET datos = excluded.datos, actualizado = excluded.actualizado`,
    [fecha, JSON.stringify(datos)]
  );
}

export async function getCachedTurno(fecha: string): Promise<unknown | null> {
  const database = await getDB();
  const row = await database.getFirstAsync<{ datos: string }>(
    'SELECT datos FROM turno_cache WHERE fecha = ?',
    [fecha]
  );
  return row ? JSON.parse(row.datos) : null;
}

export async function cacheServicioActivo(id: number, datos: unknown): Promise<void> {
  const database = await getDB();
  await database.runAsync(
    `INSERT INTO servicio_activo_cache (id, datos, actualizado) VALUES (?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET datos = excluded.datos, actualizado = excluded.actualizado`,
    [id, JSON.stringify(datos)]
  );
}

export async function getCachedServicioActivo(id: number): Promise<unknown | null> {
  const database = await getDB();
  const row = await database.getFirstAsync<{ datos: string }>(
    'SELECT datos FROM servicio_activo_cache WHERE id = ?',
    [id]
  );
  return row ? JSON.parse(row.datos) : null;
}

export interface SyncOp {
  id: number;
  tipo: string;
  datos: Record<string, unknown>;
  timestamp_dispositivo: string;
  intentos: number;
}

interface SyncOpRow {
  id: number;
  tipo: string;
  datos: string;
  timestamp_dispositivo: string;
  intentos: number;
}
