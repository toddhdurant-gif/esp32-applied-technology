# DisplayShot

**Every screen in the fleet can show you its own picture — over the network,
from wherever you are, with no camera pointed at it.**

## The problem it solves

You flash a display. The build succeeds. The device comes back online. And you
still do not know what is on the glass. Walking over to look works for one
screen in one room. It does not work for a dozen screens, for a device in
another building, or for a change you pushed at midnight.

DisplayShot answers "what is on the screen right now?" with one URL:

```
http://<device-ip>:8082/screenshot
```

Open it in a browser and you get a JPEG of the frame the device is drawing at
that instant. Same port, same path, on every display in the fleet.

## The pattern

| Rule | Why |
|---|---|
| One endpoint per device, always `:8082/screenshot` | Nobody memorises a port list. If you know the device address, you know where its picture is. |
| The capture is on demand, never a stream | A frame is taken only when somebody asks. An idle device spends nothing on this. |
| Same path fleet-wide | Tools written for one screen work for all of them — a thumbnail wall is just a list of addresses. |
| The device's Home Port links to it | The page at the device's plain address carries a DISPLAYSHOT card, so the endpoint is discoverable, not documented. See [Home Port](../homeport/). |

The fleet standard treats this as seriously as over-the-air updates: a build
that cannot be seen remotely is "flashed", not "verified". Every display build
carries the endpoint, and any device that runs it also raises its socket budget
(`CONFIG_LWIP_MAX_SOCKETS: "18"`) so the picture page can be popular without
the web server dropping connections — a real regression that hit one device
the week the button appeared.

## Frame versus glass — the verification method

A DisplayShot frame and a photo of the panel prove **different things**:

- **The frame** proves what the renderer drew. It is read from the display
  buffer, so it is the truth about the software.
- **A photo of the glass** proves what the panel is showing. It is the truth
  about the hardware path: panel init, backlight, cable, timing.

When they agree, the build is verified end to end. When they disagree, the
disagreement *localises the fault*:

| Frame | Glass | Where the problem is |
|---|---|---|
| correct | blank or wrong | panel / backlight / init path — the software drew it, the hardware did not show it |
| blank or wrong | blank or wrong | render path — LVGL never produced the frame |
| correct | correct | verified |

This split was proven on a 4" SmartBox build, and it is what finally moved a
4.3" CrowPanel off "unverified": that board's glass had been dark for a week.
The boot log showed LVGL failing to allocate its draw buffer (PSRAM had been
eaten by code placed there). The moment the memory fix landed, the first
DisplayShot frame ever taken from that board came back correct — the renderer
was proven good from the desk, and only the glass itself remained to be
checked by eye. One capture replaced a trip and a guess.

## "Show me" — the voice path

The fleet's displays take a `show_view` service call from Home Assistant, so a
spoken request drives a screen and DisplayShot proves it landed:

1. You say *"show me the network map"* to a Home Assistant voice satellite.
2. The HA automation calls the device's `show_view` action with `view: network`
   (routed to whichever device you spoke to).
3. The device swaps its View Screen to that content.
4. You — or a script — fetch `:8082/screenshot` and look at the frame.

Steps 2–4 are also how every build stage gets checked: call the service, wait
a couple of seconds, pull the frame, compare. About ten seconds per view, no
phone photos, and the evidence is a file you can keep next to the build log.

The `show_view` action is a plain ESPHome `api: actions:` entry with one
`view` variable and an `if:` branch per view. The fleet rule is that **every**
view is reachable this way, so nothing on the glass can only be found by touch.

## The live page (hosted by Home Assistant)

`displayshot_live.html` in this folder turns the single frame into a slow live
view: it fetches `/screenshot` on a timer with **one request in flight at a
time** (so a slow frame never piles requests onto the panel), and a failed
fetch leaves the last good frame up instead of going blank. Measured on an
800×480 board a frame takes about 1.3 s, so 2 s is the floor and 3 s is a
comfortable rate for filming.

To host it from Home Assistant:

1. Copy `displayshot_live.html` into your HA `config/www/` folder (make a
   subfolder if you like, e.g. `www/fleet/`).
2. Open `http://<ha-ip>:8123/local/fleet/displayshot_live.html`.
3. Type the device address (`<device-ip>:8082`) into the box, pick a rate,
   and the frames start.

Nothing else is needed — no add-on, no card, no integration. The page is plain
HTML with no outside dependencies, so it also works on a LAN with no internet.
The same polling logic is built into the Home Port's LIVE SCREEN card, which
opens the viewer in-page and deep-links at `http://<device-ip>/#live`.

## Honest limits

- **It is not video.** Expect one to three seconds per frame. It answers "what
  is showing", not "how smooth is the animation".
- **One viewer at a time is the safe assumption.** Each open page holds a
  socket on a small device. Two people watching is fine; a wall of tabs is not.
- **The capture takes the main loop for a moment** while it converts and
  encodes the frame. On big panels that is around a second, which is why it is
  on demand and never on a timer inside the device.
- **A frame proves the renderer, not the glass.** That is a feature (see
  above), but it means a green DisplayShot is not permission to skip the last
  look at the panel on a brand-new board.

## The permission caveat — why the capture component is not here

The piece of firmware that reads the frame and serves the JPEG is a small
ESPHome external component by dcgrove,
[esphome-lvgl-screenshot](https://github.com/dcgrove/esphome-lvgl-screenshot).
The upstream repository has **no licence file**. I asked the author on
2026-08-26 to add one ([issue #2](https://github.com/dcgrove/esphome-lvgl-screenshot/issues/2))
and have had no reply.

So this folder contains everything that is mine — the pattern, the standard,
the verification method, the live page — and **not the capture component**.
If you want DisplayShot today, pull the component from the author's repository
yourself and wire it as an `external_components:` source with
`lvgl_screenshot: port: 8082` in your yaml.

My fleet copies carry two changes for LVGL 9 on the ESP32-P4 (the draw-buffer
API and a rotation fix) plus a variant that reads the RGB panel's own frame
buffer so no full-size LVGL buffer is required. Those cannot ship either while
they sit on unlicensed code. **A clean-room MIT component is planned** so the
whole recipe can live in one folder; the day the licence question is settled,
or the rewrite lands, this section changes.

---

Part of [Toddlets](../) — reusable inventions from a working ESP32 fleet.
MIT licensed (everything in this folder). Running today on five displays:
two 7" ESP32-P4 panels, a 4" and a 4.3" ESP32-S3, and a 4.3" ESP32-P4.
