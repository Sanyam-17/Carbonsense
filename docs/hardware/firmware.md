# ESP32 firmware (Phase 1): written, NOT yet run on hardware

1. `cp firmware/esp32/src/secrets.h.example firmware/esp32/src/secrets.h` and fill it in. Add the node's key to `CARBONSENSE_NODE_KEYS` on the server (generate with `openssl rand -hex 24`).
2. Build and flash with PlatformIO (`pio run -t upload`), open the monitor at 115200.
3. Complete `docs/hardware/readiness-checklist.md` first: exact module models, voltage compatibility and safety. Wiring is the proposed starting point only (I2C 21/22, MH-Z19E UART 16/17, PIR 27). Never connect mains to the breadboard or INA219.

Behaviour: reads each sensor independently and **omits** a value if its sensor fails (never invents one); sets `co2Warmup` for the first 3 minutes (confirm the preheat time for your MH-Z19E); needs NTP before sending (timestamps are required); retries Wi-Fi; keeps up to 30 unsent samples and flushes oldest first; drops payloads the server rejects with 4xx; uses HTTPS if `INGEST_URL` starts with https (set `ROOT_CA`).
Known limits: plain HTTP is for a trusted LAN only; the INA219 default calibration covers roughly 32 V / 2 A, so check range against your load; buffered data is lost if power is cut.
