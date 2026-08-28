# SnapView

**Near-live security camera views on a $40 ESP32 display — for the cost of
one HTTP fetch per look.**

## The problem it solves

Small displays can't afford video. RTSP streaming means continuous decode,
continuous WiFi traffic, continuous heat — on a microcontroller that's also
running your touchscreen, your voice assistant, and your UI. Most projects
either give up on cameras or dedicate the whole board to being a bad video
player.

SnapView takes the other road: **when you tap, it fetches the current frame.
One JPEG, one HTTP GET, done.** Between taps the camera costs the device
literally nothing. For "who's at the door?" — which is a one-frame question —
this is indistinguishable from live, and the board stays free to do
everything else.

## What's in the package

- One shared `online_image` buffer retargeted between any number of camera
  URLs (`set_url`) — N cameras, one buffer's worth of RAM
- On-demand only (`update_interval: never`) — nothing polls, ever
- The `lvgl.image.update` re-bind on every fetch (the one-shot `src:`
  binding is a real trap — the fetch succeeds in the log while the screen
  never changes; this package carries the fix)
- Honest states on the caption: FETCHING / named view / FAILED — TAP TO RETRY
- A fetch timeout tuned to stay inside the task watchdog — a stalled camera
  fails visibly instead of rebooting your display

## Quick start

1. Copy `snapview.yaml` next to your device yaml.
2. Copy the `substitutions:` and `packages:` blocks from
   `example_snippet.yaml`, point the URLs at your snapshot source
   (Frigate shown; any JPEG URL works — HA camera proxy, rendered
   dashboards, server-composed graphics).
3. Add the image + caption widgets to your page (snippet in the example),
   and wire taps to `sv_show_cam1` / `sv_show_cam2` / `sv_refresh`.

Pairs naturally with the [Display Viewer](../display_viewer/) (the content
surface the snapshots land in) and [The Communications Button](../communications/)
(same on-demand philosophy, applied to voice).

Runs in production in my house (Home Assistant + Frigate + ESP32-S3 and
ESP32-P4 panels). Clone it, use it, improve it — feedback and PRs welcome.
