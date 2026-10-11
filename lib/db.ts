import {createClient} from '@libsql/client'
import {drizzle} from 'drizzle-orm/libsql'
const g = globalThis as any
export const client = (g.__csDb ??= createClient({url: process.env.CARBONSENSE_DB_URL || 'file:local.db'}))
export const db = drizzle(client)
export const ready: Promise<unknown> = (g.__csReady ??= client.executeMultiple(`
CREATE TABLE IF NOT EXISTS telemetry(id INTEGER PRIMARY KEY AUTOINCREMENT,node_id TEXT NOT NULL,room_id TEXT NOT NULL,observed_at TEXT NOT NULL,received_at TEXT NOT NULL,source TEXT NOT NULL,co2_ppm REAL,temperature_c REAL,humidity_pct REAL,motion INTEGER,voltage_v REAL,current_a REAL,power_w REAL,flags TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tel_node_obs ON telemetry(node_id,observed_at);
CREATE INDEX IF NOT EXISTS ix_tel_room ON telemetry(room_id,observed_at);
CREATE TABLE IF NOT EXISTS nodes(id TEXT PRIMARY KEY,room_id TEXT NOT NULL,last_seen TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,room_id TEXT NOT NULL,kind TEXT NOT NULL,name TEXT NOT NULL,rated_power_w REAL,metering_mode TEXT NOT NULL,node_id TEXT,channel TEXT);
CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY,name TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,normalized TEXT,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS room_models(id TEXT PRIMARY KEY,room_id TEXT NOT NULL,sha256 TEXT NOT NULL,bytes INTEGER NOT NULL,source TEXT NOT NULL,status TEXT NOT NULL,meta TEXT NOT NULL,created_at TEXT NOT NULL);
INSERT OR IGNORE INTO rooms(id,name,version,updated_at) VALUES('room-204','Living room',1,'2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO devices VALUES('ac','room-204','ac','AC unit',320,'estimated',NULL,NULL),('light','room-204','light','Ceiling lamp',45,'estimated',NULL,NULL),('tv','room-204','tv','Television',120,'estimated',NULL,NULL),('plug','room-204','plug','Smart plug (measured load)',NULL,'metered','room-node-01','power'),('sensor','room-204','sensor','CO2 / temp sensor',NULL,'metered','room-node-01','environment');
CREATE TABLE IF NOT EXISTS rejections(id INTEGER PRIMARY KEY AUTOINCREMENT,node_id TEXT,reason TEXT NOT NULL,received_at TEXT NOT NULL);`))
