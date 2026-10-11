import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core'
export const telemetry = sqliteTable('telemetry', {
  id: integer('id').primaryKey({autoIncrement: true}),
  nodeId: text('node_id').notNull(), roomId: text('room_id').notNull(),
  observedAt: text('observed_at').notNull(), receivedAt: text('received_at').notNull(), source: text('source').notNull(),
  co2Ppm: real('co2_ppm'), temperatureC: real('temperature_c'), humidityPct: real('humidity_pct'), motion: integer('motion', {mode: 'boolean'}),
  voltageV: real('voltage_v'), currentA: real('current_a'), powerW: real('power_w'), flags: text('flags').notNull(),
})
export const nodes = sqliteTable('nodes', {id: text('id').primaryKey(), roomId: text('room_id').notNull(), lastSeen: text('last_seen').notNull()})
export const rejections = sqliteTable('rejections', {id: integer('id').primaryKey({autoIncrement: true}), nodeId: text('node_id'), reason: text('reason').notNull(), receivedAt: text('received_at').notNull()})
export const devices = sqliteTable('devices', {id: text('id').primaryKey(), roomId: text('room_id').notNull(), kind: text('kind').notNull(), name: text('name').notNull(), ratedPowerW: real('rated_power_w'), meteringMode: text('metering_mode').notNull(), nodeId: text('node_id'), channel: text('channel')})
