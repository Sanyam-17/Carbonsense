# Target architecture

## Flow
Initial: `ESP32 -> HTTPS POST -> /api/ingest -> shared ingest(telemetry) -> Drizzle/SQLite -> SSE -> browser store -> 3D + panels`

Later: `ESP32 -> MQTT -> services/iot -> shared ingest(telemetry) -> Postgres + rollups -> LISTEN/NOTIFY -> web SSE -> browser`

The simulator and MQTT consumer call the same `ingest(telemetry)`. The browser never talks to MQTT or the database.

## Layout (adapt, do not force)
`apps/web` UI, CRUD, SSE · `services/iot` MQTT consumer · `packages/shared` Zod schemas, types, NormalizedRoom, energy/carbon maths · `firmware/esp32` PlatformIO · `ios/RoomPlan` later.

## Telemetry contract v1
```json
{"version":1,"nodeId":"room-node-01","ts":"2026-10-07T14:25:30Z",
 "environment":{"co2Ppm":642,"temperatureC":24.2,"humidityPct":56.0},
 "occupancy":{"motion":true},
 "energy":{"voltageV":5.01,"currentA":0.21,"powerW":1.05},
 "flags":{"co2Warmup":false}}
```
Example values only. Limits to verify per sensor: CO2 300-5000 ppm, temp -20..60 C, RH 0-100 %, V 0-30, I 0-3.2 A. Freshness: ~30 s environment, ~10 s power. Clock skew over 5 min is flagged.

## Correctness rules (summary)
CO2 ppm is not carbon footprint. PIR is motion, not a head count. Never show stale as live, estimated as measured, or simulated as physical. Carbon = energy kWh x documented, time-valid emission factor (verify the 0.71 default). Energy = trapezoidal integration; no interpolation across gaps over 3x the sample interval. "Today" uses the home timezone.

## Spatial model
`NormalizedRoom` (metres, right-handed, Y-up, origin at the floor bounding-box minimum corner, CCW floor). Device and sensor identity are persistent IDs, never array index or label.

## Data (long term)
users, sessions, homes (timezone), rooms, room_models, nodes, sensors, devices (metering mode: metered / estimated / simulated / unavailable), telemetry (one wide table), rollups_1m, rollups_1h, emission_factors. Retention: raw 7 days, 1-minute 90 days, hourly long term.

## Phases
0 audit · 1 ESP32 · 2 ingestion · 3 live-to-3D (first milestone) · 4 GLB · 5 data-driven twin · 6 calculations · 7 analytics · 8 auth · 9 MQTT + Postgres · 10 multi-room and deploy.
