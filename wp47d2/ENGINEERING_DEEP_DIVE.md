# Engineering Deep Dive — ESP32-P4 7" Touch Display (Waveshare ESP32-P4-WIFI6-Touch-LCD-X)

**Low-level details for the Waveshare product team, and for developers who
want the nitty-gritty.** Field notes from bringing this board up under
ESPHome with a large LVGL UI. Everything here was confirmed on real
hardware — serial captures, register dumps, or vendor source — not
guessed. Shared so you don't have to rediscover any of it.

---

## 1. The big one: deterministic boot-loop from a stack-sanity assert (TCM placement)

**Symptom:** after a flash, the device crash-loops within ~1 second of
`Disabling RNG early entropy source...`, before any application code runs:

```
assert failed: spi_flash_disable_interrupts_caches_and_other_cpu
cache_utils.c:127 (esp_task_stack_is_sane_cache_disabled())
```

Because it fires before the app starts, the device just looks "unavailable"
from the network — only a real serial capture shows it. ESPHome's OTA
safe-mode window then rolls back to the previous partition, so you can also
see "the flash succeeded but nothing changed."

**What it is NOT:** content size. Tiny, surgical single-line changes can
trigger it while large additions compile and boot fine.

**Root cause (confirmed via register dump):** the crashing stack pointer sits
at `0x30100xxx` — the ESP32-P4's TCM region. Older ESP-IDF releases'
stack-sanity check only accepts DRAM pointers, so whenever the link layout
happens to place the startup task's stack in TCM (a lottery decided by the
overall binary layout — hence "any change can tip it"), the assert
false-fires. Upstream ESP-IDF master already guards this assert correctly.

**Fix:**
- Patch the guard from upstream master into your local toolchain's
  `framework-espidf/components/spi_flash/cache_utils.c` (keep a backup —
  note that a framework package update silently reverts the patch), and
- keep both PSRAM-stack options off, as this config does:
  ```yaml
  sdkconfig_options:
    CONFIG_SPIRAM_ALLOW_STACK_EXTERNAL_MEMORY: "n"
    CONFIG_FREERTOS_TASK_CREATE_ALLOW_EXT_MEM: "n"
  ```
  **Verify the options in the final generated `sdkconfig.<name>` after the
  compile** — setting them in YAML and checking the merged output are two
  different things.

Previously-deterministic crash content boots clean with the patch applied
(verified across 78 consecutive boots).

## 2. Verification ladder — "it compiled" and "it booted" are different claims

The discipline that made this build stable. After every flash, in order:

1. **Backup before edit** — copy the exact last-known-good YAML byte-for-byte
   *before* changing anything. Recovery is then a one-command restore, not an
   archaeology project. (ESPHome's `config_hash` is a fingerprint to confirm
   you got back to the right state — it is not a substitute for the bytes.)
2. **Hash gate** — if the new build's `config_hash` equals the previous one,
   your change didn't apply. Stop.
3. **Boot capture** — watch serial through the **full 60-second safe-mode
   window** until `Boot seems successful; resetting boot loop counter`.
   A ping or a brief reconnect can happily show you the OLD firmware after a
   silent rollback.
4. **Service check** — one Home Assistant REST query confirming the device's
   entities are actually available. A build can boot cleanly and still drop
   every API client (seen here in practice).

## 3. Audio: three separate silent-audio causes on this board family

- **Speaker power-amp enable pin.** These boards gate the amp behind
  **GPIO53, active-high**. ESPHome's `es8311` component has no `pa_pin`
  option, so the codec reports success while the speaker stays silent.
  Fix: a plain GPIO output on 53, turned on at boot.
- **ES7210 mic ADC must be initialized.** The dual mics record through a
  separate ES7210 chip (the ES8311 is speaker-side). Without an `audio_adc:`
  block for it, the I2S line carries silence and every voice pipeline run
  ends in "no text recognized" with a suspiciously constant VAD window.
- **Keep the ES8311 DAC at 0 dB and do volume in software.** Pushing codec
  analog gain to compensate for low volume distorts; the clean chain is a
  fixed 0 dB ceiling with the media player's own volume doing the work.

## 4. Touch (GT911) under LVGL rotation: don't transform twice

The panel is portrait-native under a landscape LVGL rotation. LVGL already
remaps coordinates for the configured rotation — if you also set
`swap_xy: true` on the touchscreen (which axis-range intuition suggests),
the transform is applied twice and taps land in the wrong widgets. The
vendor's own BSP default is `swap_xy: false`; start from the vendor default,
and when diagnosing, log coordinates **after** LVGL's remapping (the stage
that does hit-testing), not the raw sensor stage.

## 5. WiFi is on a co-processor — expect a second MAC

The P4 has no native WiFi; it routes through the onboard ESP32-C6 over
`esp_hosted`. Consequences:

- The MAC that `esptool` reports over USB (P4) and the MAC on your network
  (C6) are **different chips' MACs**. A mismatch is normal, not a cloned or
  wrong board.
- Post-flash boots take noticeably longer to become network-ready (the C6
  handshake renegotiates) — allow minutes after a flash before concluding
  anything, even though normal power-ups reconnect in seconds.

## 6. Serial port opens pulse a reset (CH343)

Merely opening the USB-serial port resets the board — there is no confirmed
non-destructive way to peek at a running device over serial with this chip.
Poll the device's HTTP/API side when you need "is it alive right now";
reserve serial for boot capture (when you *want* the reset) or for a device
already crash-looping.

## 7. LVGL font/glyph gotchas

- **Compiled Montserrat has no emoji.** A literal emoji in a label renders as
  a tofu box. Use plain text or icon-font glyphs.
- This config uses **Material Design Icons** via the web-font TTF (Apache
  2.0, `Templarian/MaterialDesign`) with `\U000FXXXX` codepoints — the
  8-digit escape form is required for Plane-15/16 PUA codepoints.
- Watch for characters outside the compiled glyph set arriving from Home
  Assistant templates (middle dots, en dashes) — normalize to ASCII on the
  HA side or add the glyphs.
- After any edit touching glyphs, **verify the bytes in the generated
  `main.cpp`**, not just the YAML — escape sequences are easy to corrupt
  invisibly in tooling.

## 8. ESPHome YAML details that cost time

- Top-level `globals:`, `script:`, `wifi:`, `api:`, `text_sensor:` do **not**
  merge across duplicate blocks (load-time error); `sensor:`, `microphone:`,
  `interval:` do.
- `16MB` `flash_size` is what boots on this 32 MB-flash board — leave it.
- On a config this size (3,000+ lines), make edits with exact-literal
  matches and assert the occurrence count; a slightly-misanchored wildcard
  regex can silently delete hundreds of lines.

---

*Board: Waveshare ESP32-P4-WIFI6-Touch-LCD-X (720×1280 ILI9881C, GT911
touch, ES8311 + ES7210 audio, ESP32-C6 WiFi). ESPHome 2026.6.x, ESP-IDF
framework. All findings current as of 2026-08-14.*
