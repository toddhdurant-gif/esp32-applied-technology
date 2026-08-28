# Toddlets — reusable inventions from a working ESP32 fleet

Named, reusable design components invented while building a real production
fleet of ESP32 displays — every one of them runs today in a live smart home
(Home Assistant + Frigate + a dozen ESP32 boards), not on a bench.

The design rule behind all of them:

> **"If you have to give someone instructions, the design isn't done."**

| Toddlet | What it is | Status here |
|---|---|---|
| **[The Communications Button](communications/)** | The tap-to-talk voice surface that never lies to you — state colors, busy guard, measured "Processing" cue, on-screen command + answer text, watchdog reset | Explainer + example + timings |
| **[Display Viewer](display_viewer/)** | One central viewer region, many kinds of content — idle clock, voice responses, cameras, data views — with near-zero load between interactions | Pattern + example |
| **[SnapView](snapview/)** | Near-live security camera views for the cost of ONE HTTP fetch — on-demand snapshots instead of streams, drop-in ESPHome package | Package + example |
| **DisplayShot** | Every screen serves a live capture of its own framebuffer at `/screenshot` — flash verification, thumbnail walls, remote signage checks | Not yet publishable (upstream license pending) |
| **The Freshness Traffic Light** | Category-default shelf lives — the fridge tracker that needs zero data entry | Own repo: [whats-in-the-fridge](https://github.com/toddhdurant-gif/whats-in-the-fridge) |

## Why on-demand beats streaming on small hardware

Most of these share one architectural idea: **the device fetches a finished
view when a human asks for one, and does nothing in between.** No RTSP
decoding, no polling loops, no background load. A $40 board can present
cameras, dashboards, and rendered graphics because each interaction costs one
HTTP GET — and between interactions it costs nothing.

The Communications Button adds the second house idea: **every state reaches
you on more than one channel** — color, text, and audio carrying the same
truth, so the device stays legible whatever you're doing when it answers.

## Take them — seriously

Every folder here is meant to be cloned straight into your own ESPHome
project. If one of these ends up on a screen in your house, that's the whole
point — and I'd love to hear about it. Open an issue with feedback, a fix,
or a better way to do it; improvements are welcome and credited.

## See them running

- YouTube: [ESP32 Applied Technology](https://www.youtube.com/@esp32appliedtechnology)
- Reviews & builds: [toddhdurant.com/reviews](https://www.toddhdurant.com/reviews)
- The full device configs live in this repo — start with [`wp47d2/`](../wp47d2/)

MIT licensed. Built by Todd Durant.
