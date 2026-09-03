# ESP32 Applied Technology — a documented smart-home device fleet

> **The fridge app:** [whats-in-the-fridge](https://github.com/toddhdurant-gif/whats-in-the-fridge) · **Builds on video:** [ESP32 Applied Technology](https://www.youtube.com/@esp32appliedtechnology) · **Plain-language reviews and home help:** [@ToddHDurant](https://www.youtube.com/@ToddHDurant) · **Written reviews:** [toddhdurant.com/reviews](https://toddhdurant.com/reviews)

Wall panels, voice assistants, e-ink dashboards and cameras — a fleet of
ESP32 devices running a real house on Home Assistant, documented like an
engineering project: every version, every verification log, every dead end.

> **If you have to give someone instructions, the design isn't done.**

A smart home is a small business wearing house clothes — an average
three-bedroom house has more connected devices than a donut shop, with the
same monitoring stakes (cameras, leak sensors, power). Everything here is
built on that premise: real-world solutions on infrastructure you already
own, usable with zero training, resilient when the internet isn't.

## What's in this repo

| Folder | What it is |
|--------|-----------|
| `wp47d2/` | **The 7" wall panel** — complete ESPHome config (3,000+ lines) for a Waveshare ESP32-P4 touchscreen status board: live Home Assistant callouts on a ship-schematic idle screen, on-demand camera snapshots, voice assist, arc gauges. Compiles as shipped; credentials externalized; every asset original. |
| `wp47d2/ENGINEERING_DEEP_DIVE.md` | Low-level details for the Waveshare product team and developers who want the nitty-gritty — including the root cause of a deterministic ESP32-P4 boot-loop (a toolchain stack-sanity assert mis-firing on TCM-placed stacks) that took real days to isolate. |
| `toddlets/` | **The Toddlets** — the fleet's reusable widgets as standalone explainer + example packages: [The Communications Button](toddlets/communications_button/) (tap-to-talk voice surface: state colors, busy guard, measured "Processing" cue, on-screen command + answer text, watchdog reset), [View Screen](toddlets/view_screen/) (one content region, many content kinds, near-zero idle load), and [SnapView](toddlets/snapview/) (security cameras for the cost of one HTTP fetch per look — a drop-in ESPHome package). |

*Coming next: **What's In The Fridge** — a Home Assistant–native
fridge-inventory system ("speak your groceries, the display shows what to
eat first") with zero per-item data entry and zero custom firmware. It
launches as its own repo soon — but impatient crew members may notice the
galley is already aboard this ship, locked. **Hint: the registry number of
a certain Galaxy-class starship opens it.** Find it, use it, and keep the
secret until launch day.*

## The named components (the ideas that repeat across devices)

The reusable widgets are packaged individually as **Toddlets** —
self-contained explainer + example-code bundles under
[`toddlets/`](toddlets/): [The Communications Button](toddlets/communications_button/),
the [View Screen](toddlets/view_screen/), and
[SnapView](toddlets/snapview/).

- **Interface Engine** — the reusable voice-interaction component. A pure
  UI-logic ESPHome package (IDLE → LISTENING → PROCESSING → RESPONDING state
  machine) with strict hardware separation: any board wires a talk button
  with one line, and every hard-won fix (the works-once race, I2S bus
  contention) rides along for free.
- **View Screen** — one central content region, many kinds of content:
  clock at idle, voice responses, camera snapshots, tab detail views. The
  point is what it *doesn't* do: nothing streams, nothing polls. Content
  arrives as a single on-demand fetch per interaction, so a $9 processor
  displays a whole house's data while doing almost nothing between taps.
- **The four-section config structure** — every device YAML is ordered
  chip layer → board-gotcha layer → fleet UI standard → device personality.
  Any two devices diff cleanly, and when something breaks, sections that are
  byte-identical between a working and failing build eliminate themselves
  as suspects. This structure is how the boot-loop above got isolated to
  the toolchain rather than the config.
- **The root-URL rule** — every device serves its full status page at the
  plain root of its IP. No ports to remember, no paths, no per-device
  differences. Type the address, get the device.
- **The Staging Dashboard** — Home Assistant dashboards as the fleet's data
  core *and* test bench: new controls are built and proven on a dashboard
  first, then promoted to physical screens. The entire fridge-inventory
  system was built, tested and live before its display device was unboxed —
  zero flashes, zero risk to production hardware. (Factory translation:
  change the andon board without stopping the line.)

## The engineering discipline

Every flash on this fleet runs a four-rung verification ladder — byte-exact
backup, config-hash gate, full safe-mode-window boot capture, and a live
Home Assistant entity check — because "it compiled" and "it works" are
different claims. The known-issues doc explains each rung and why it exists.

## Credits

Built on [ESPHome](https://esphome.io), [LVGL](https://lvgl.io), and
[Home Assistant](https://www.home-assistant.io). Icons: [Material Design
Icons](https://github.com/Templarian/MaterialDesign) (Apache 2.0). Gauge
inspiration: [gauge-card-pro](https://github.com/benjamin-dcs/gauge-card-pro)
by benjamin-dcs. All artwork original.

---

*Todd Durant — [toddhdurant.com](https://www.toddhdurant.com) ·
[YouTube: ESP32 Applied Technology](https://youtube.com/@esp32appliedtechnology)*
