# Home Port

**Every device fully inspectable and operable from its IP alone — no port
list, no app, no manual. One page that links to every service the device
exposes.**

## The problem it solves

You know one thing about a device: its address. You browse to it. What you get
from ESPHome out of the box is a bare entity table and a log. The screenshot
service is on another port. The firmware upload is on another port. The wiring
drawing is in a folder somewhere. Home Assistant talks to it on a port you have
never heard of. To *use* the device you need a document, and a document nobody
can find from the device has not shipped.

Home Port is a **policy, not a button**: the page at the device's plain address
must reach everything the device can do. If someone who knows nothing but the
IP can get to the live screen, the logs, the controls, the update path, the
wiring and the integration link, the device passes. If they need to ask, it
does not.

**Why the name.** *Port* is the network word AND the place a ship comes back to
that has everything aboard. "Every device has a Home Port" is a sentence an IT
administrator understands with no explanation, which is the test a name has to
pass.

## What's in the package

- `home_port.js` — the whole page, one file, injected through ESPHome's
  `web_server: js_include:`. Self-contained on purpose: system fonts, inline
  SVG icons, no CDN, no web fonts, no outside calls.
- `homeport_snippet.yaml` — the two yaml blocks it needs.

## What the page shows

| Card | What it does |
|---|---|
| **Masthead** | Device name, its address, the current **build stage** (read live from the device), and a health line that turns amber while the page is reconnecting. |
| **Live screen** | Opens an in-page live view — a frame every few seconds from the [DisplayShot](../displayshot/) endpoint on `:8082`. Deep link: `http://<device-ip>/#live`. Has FULLSCREEN with an auto-hiding bar, for filming. |
| **DisplayShot** | One still frame of the panel as a JPEG you can save. |
| **Logs** | Jumps to the device's own streaming log, flipped **newest-on-top**. Each row carries a hover legend (E · ERROR — something failed …, D · DEBUG — ordinary chatter …) so the colour says worse/better and the hover says exactly what. |
| **Controls** | The stock entity table, kept as the working surface. Button glyphs are changed from ESPHome's hollow square (reads as STOP) to a play triangle ▶. The chip counts entities as they arrive. |
| **Update** | The OTA card. Its badge and chip are driven by the device's own `update` entity — up to date / update available / installing — never hardcoded. A status colour is a claim. |
| **Wiring** | Links to the device's As-Wired drawing, hosted on Home Assistant's `www/` share so the drawing can change without a reflash. |
| **Home Assistant** | Names the native API port so the integration path is visible too. |
| **Health tiles** | Wi-Fi signal, battery, uptime, mic level, build — live from the device's event stream, with a state badge on each icon (Domotz-style density: the badge colour reads before any word does). |

The stock ESPHome app is not hidden. It becomes the "All controls" section
under the cards — honest, because it is the surface that actually does things.

## How to wire it

```yaml
web_server:
  version: 3
  js_include: "web/home_port.js"
```

Put `home_port.js` in a `web/` folder next to your device yaml, add a template
`text_sensor` whose name contains **Build Stage** (see the snippet), and
flash. That is the whole install. Then edit **the one line you change** near
the top of the script:

```js
var WIRING_URL = 'http://<ha-ip>:8123/local/<device>/aswired.html';
```

Two rules learned the hard way, both in the script's comments:

- **`js_include:` takes exactly ONE file.** If your device already injects a
  script, the new file must carry the old behaviour forward or you will lose it
  silently — a successful build and flash will not tell you.
- **Raise the socket budget** on any device that serves this page and also
  runs DisplayShot: `CONFIG_LWIP_MAX_SOCKETS: "18"` under `esp32: framework:
  sdkconfig_options:`. Every open tab holds a socket; the default pool drains
  and the server resets every connection the day the page gets popular.

## What the script does, section by section

1. **Constants.** `HOST` is `location.hostname`, so the same file works on
   every device; `SHOT_URL` is `HOST:8082/screenshot`; `WIRING_URL` is the one
   line you edit.
2. **Palette and layout (CSS).** Dark ground, condensed uppercase labels for
   names, tabular monospace for values; cards with a state-coloured badge on
   the icon; a fixed full-screen layer for the live viewer; reduced-motion
   respected.
3. **Icons and helpers.** A dozen inline SVG paths, `card()` for a service
   card, `tile()` for a health tile. No icon font — offline means offline.
4. **`build()`.** Assembles the masthead, the promise line, the seven service
   cards, the health tiles, the "All controls" header and the footer, then
   inserts all of it **above** the stock `esp-app` element.
5. **Live viewer.** `liveOpen` / `liveTick` / `liveClose`: one `Image()`
   request in flight at a time, the last good frame stays up on a miss, the
   timer dies when the viewer closes so a closed viewer costs the device
   nothing; `#live` in the URL opens it; FULLSCREEN hides the bar after 2.5 s
   and brings it back on mouse movement; Esc leaves.
6. **`wire()`.** Opens **one** `EventSource` on `/events`. `ping` carries
   uptime; `state` events fill Wi-Fi, battery, mic level and build stage by
   matching the entity **name**, and the `update` domain drives the OTA card;
   `error` / `open` flip the health line between Reconnecting and All systems
   normal.
7. **Log rows.** Reverses the existing rows once, then a `MutationObserver`
   inserts each new row at the top and stamps the level legend into its
   `title`.
8. **Button glyphs.** A second observer inside the entity table's shadow root
   swaps ☐ for ▶ and titles it "Press".
9. **Load.** Each stage runs in its own `try` so a styling failure can never
   take the stock page down with it.

## Honest limits

- **One admin at a time on the live view is the safe assumption.** The viewer
  polls the panel and the page holds an event-stream socket. It is built for
  the person fixing the device, not for a wall of tabs.
- **About one second of latency per frame,** more on big panels (measured
  ~1.3 s at 800×480). The rate menu starts at 2 s for that reason.
- **The stock UI still loads from `oi.esphome.io`** unless you set
  `web_server: local: true`, which bundles it into flash. The footer says
  "Offline: not yet" until that is set — never print "works offline" before it
  is true.
- **Entity matching is by name.** The tiles look for *WiFi Signal*, *Battery
  Level*, *Mic Level Baseline* and *Build Stage* in the entity names. Rename
  yours to match, or edit the four regexes in `wire()`.
- **The device name and three port numbers are literals** in the script
  (`Display 2`, `:3232`, `:6053`, `:8082`). Change them for your board.
- A capability the hardware lacks should get **no card at all**, not a greyed
  one — drop the Live screen and DisplayShot cards on a device with no screen.

---

Part of [Toddlets](../) — reusable inventions from a working ESP32 fleet.
MIT licensed. Running today, in full, on a 7" ESP32-P4 wall display, a 4" and
a 4.3" ESP32-S3, and a 4.3" ESP32-P4 panel.
