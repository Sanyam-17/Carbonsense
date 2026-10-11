# Hardware readiness checklist (complete by hand)

Tick only what you have physically confirmed. Nothing here is pre-verified.

## Safety (read first)
- [ ] No household 230 V is connected to the breadboard, the ESP32 or the INA219. Only low-voltage DC loads.
- [ ] Fan or motor load uses a proper driver (MOSFET/transistor) with a flyback diode, on its own supply. Never drive it from a GPIO.
- [ ] All supplies share a common ground where the circuit requires it.

## Inventory: record the exact model
- [ ] ESP32 DevKit V1 (board marking: ____ )
- [ ] CO2: MH-Z19E (confirm variant and 5 V supply: ____ )
- [ ] AHT20 breakout (logic level and I2C address: ____ )
- [ ] HC-SR501 PIR (output voltage: ____ ; safe for ESP32 GPIO?)
- [ ] INA219 breakout (shunt value, max range: ____ )
- [ ] Low-voltage load (LED or DC fan, rated V / A: ____ ) and its driver

## Proposed pins (starting point, verify against datasheets before powering)
| Part | Connection |
|---|---|
| AHT20, INA219 | shared I2C: SDA GPIO21, SCL GPIO22, 3.3 V, GND |
| MH-Z19E | 5 V; sensor TX to GPIO16 (RX2), sensor RX to GPIO17 (TX2) |
| HC-SR501 | module supply per its spec; output to GPIO27 only after confirming logic level |
| LED | series resistor roughly 220-470 ohm, sized for your supply |

## Independent bring-up, one at a time
- [ ] AHT20 alone: plausible temp and humidity
- [ ] INA219 alone: voltage and current match a multimeter
- [ ] MH-Z19E alone: warm-up observed, reading plausible
- [ ] PIR alone: triggers on motion
- [ ] All together on the shared bus with no address conflicts

## Environment
- [ ] Wi-Fi is 2.4 GHz and reachable where the node sits
- [ ] NTP reachable (time sync)
- [ ] Laptop: Node 18+, npm, git, PlatformIO or Arduino toolchain

## Assets and decisions
- [ ] A GLB room scan exists (file: ____ , size under 50 MB, source units known: ____ )
- [ ] Emission factor chosen with a citable source, region and validity period (do not use 0.71 until verified)
- [ ] Home timezone decided: ____
