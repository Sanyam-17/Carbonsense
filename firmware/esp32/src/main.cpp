// CarbonSense node firmware (UNTESTED on hardware: verify wiring and datasheets first, see docs/hardware/firmware.md).
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_INA219.h>
#include <ArduinoJson.h>
#include "secrets.h"

constexpr uint32_t SAMPLE_MS = 5000;        // 2000-5000 ms
constexpr uint32_t CO2_WARMUP_MS = 180000;  // MH-Z19E preheat; confirm against your variant's datasheet
constexpr uint8_t PIR_PIN = 27;             // confirm the HC-SR501 output is safe for 3.3 V GPIO
constexpr size_t BUF_MAX = 30;              // bounded store-and-forward

Adafruit_AHTX0 aht; Adafruit_INA219 ina;
bool ahtOk = false, inaOk = false;
String buf[BUF_MAX]; size_t bufN = 0;
uint32_t lastSample = 0, lastWifi = 0;

// MH-Z19 UART read: 9-byte frame with checksum. Returns -1 on any failure (never a made-up value).
int readCo2() {
  const uint8_t cmd[9] = {0xFF, 0x01, 0x86, 0, 0, 0, 0, 0, 0x79};
  while (Serial2.available()) Serial2.read();
  Serial2.write(cmd, 9);
  uint8_t r[9]; uint32_t t0 = millis(); size_t n = 0;
  while (n < 9 && millis() - t0 < 500) if (Serial2.available()) r[n++] = Serial2.read();
  if (n < 9 || r[0] != 0xFF || r[1] != 0x86) return -1;
  uint8_t sum = 0; for (int i = 1; i < 8; i++) sum += r[i];
  if ((uint8_t)(0xFF - sum + 1) != r[8]) return -1;
  return r[2] * 256 + r[3];
}

bool isoNow(char* out, size_t n) {
  time_t now = time(nullptr); if (now < 1700000000) return false;  // NTP not synced yet
  struct tm tm; gmtime_r(&now, &tm); strftime(out, n, "%Y-%m-%dT%H:%M:%SZ", &tm); return true;
}

String buildPayload(const char* ts) {
  JsonDocument d; d["version"] = 1; d["nodeId"] = NODE_ID; d["ts"] = ts;
  JsonObject env = d["environment"].to<JsonObject>();
  int co2 = readCo2(); if (co2 > 0) env["co2Ppm"] = co2;
  if (ahtOk) { sensors_event_t h, t; if (aht.getEvent(&h, &t)) { env["temperatureC"] = t.temperature; env["humidityPct"] = h.relative_humidity; } }
  d["occupancy"]["motion"] = digitalRead(PIR_PIN) == HIGH;
  if (inaOk) {
    float v = ina.getBusVoltage_V() + ina.getShuntVoltage_mV() / 1000.0f, a = ina.getCurrent_mA() / 1000.0f, p = ina.getPower_mW() / 1000.0f;
    if (a < 0) a = 0; if (p < 0) p = 0;
    JsonObject en = d["energy"].to<JsonObject>(); en["voltageV"] = v; en["currentA"] = a; en["powerW"] = p;
  }
  d["flags"]["co2Warmup"] = millis() < CO2_WARMUP_MS;
  String s; serializeJson(d, s); return s;
}

// 2xx: delivered. 4xx except 429: drop (retrying cannot help). Anything else: keep for retry.
bool post(const String& body) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http; WiFiClient plain; WiFiClientSecure tls; bool secure = String(INGEST_URL).startsWith("https");
#ifdef ROOT_CA
  tls.setCACert(ROOT_CA);
#endif
  if (!(secure ? http.begin(tls, INGEST_URL) : http.begin(plain, INGEST_URL))) return false;
  http.addHeader("Content-Type", "application/json"); http.addHeader("x-node-key", NODE_KEY);
  int code = http.POST(body); http.end();
  Serial.printf("POST -> %d\n", code);
  return (code >= 200 && code < 300) || (code >= 400 && code < 500 && code != 429);
}

void setup() {
  Serial.begin(115200); pinMode(PIR_PIN, INPUT);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  Wire.begin(21, 22); ahtOk = aht.begin(); inaOk = ina.begin();
  Serial.printf("AHT20 %s, INA219 %s\n", ahtOk ? "ok" : "MISSING", inaOk ? "ok" : "MISSING");
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASS);
  configTime(0, 0, "pool.ntp.org", "time.google.com");
}

void loop() {
  uint32_t now = millis();
  if (WiFi.status() != WL_CONNECTED && now - lastWifi > 10000) { lastWifi = now; WiFi.reconnect(); }
  if (bufN && post(buf[0])) { for (size_t i = 1; i < bufN; i++) buf[i - 1] = buf[i]; bufN--; }  // flush oldest first
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now; char ts[25];
    if (isoNow(ts, sizeof ts)) {
      String p = buildPayload(ts);
      if (bufN || !post(p)) { if (bufN == BUF_MAX) { for (size_t i = 1; i < BUF_MAX; i++) buf[i - 1] = buf[i]; bufN--; } buf[bufN++] = p; }
    } else Serial.println("waiting for NTP");
  }
  delay(20);
}
