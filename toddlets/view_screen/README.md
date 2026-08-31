# View Screen

**One View Screen, many kinds of content — and near-zero load between
interactions.**

## The idea

Every display in my fleet reserves one large central region — the View
Screen. It is deliberately *not* a dashboard of tiny always-updating
tiles. It shows exactly one thing at a time, as big as the panel allows:

- **Idle:** a giant clock and date (a screen on a wall should earn its place
  even when nothing is happening)
- **A voice response:** large response text while the assistant answers
- **A camera view:** an on-demand snapshot (see [SnapView](../snapview/))
- **A data view:** a network map, a chart, a rendered server-side graphic

Content **swaps in on demand and swaps out on a timer** (~12s auto-return
to idle). Nothing streams. Nothing polls. Between interactions the View Screen
costs the microcontroller almost nothing — which is why a $40 board can
"show everything" without choking.

## The rules that make it work

Learned on real hardware, encoded as the pattern:

1. **Content fills the View Screen's actual band.** Know the inner content box
   (minus padding/caption) and size content to it — never a small image
   floating in a dark rectangle.
2. **On-demand over polling, always.** A view is fetched when requested —
   one HTTP GET per view-change. Server-rendered images (Pillow/HA
   composing a finished PNG/JPEG) beat on-device drawing for anything you
   *read*; native LVGL widgets are for anything you *touch*.
3. **Rebind after every fetch.** LVGL's `src:` binding is one-shot;
   `lvgl.image.update` after `on_download_finished` is mandatory or the
   screen silently never changes.
4. **Every state is visible.** Fetching / loaded-with-timestamp /
   failed-tap-to-retry live on a caption inside the View Screen. A glanceable
   surface never fails silently.
5. **The viewer is the proof-of-action surface.** When your system's
   behavior lives server-side (Home Assistant), the View Screen is what makes a
   back-end change *visible* on the device — it isn't decoration.

## What's in this folder

- `view_screen_example.yaml` — a complete, minimal viewer: container + image +
  caption + tap-to-refresh, wired to a server-rendered image URL, plus the
  idle-clock swap scripts. Copy it into your own page and repoint the URL.

## Reference implementations

- A 7″ wall console build (multi-view: cameras, voice, network map):
  [`wp47d2`](https://github.com/toddhdurant-gif/esp32-applied-technology/tree/main/wp47d2)
- Pair with [SnapView](../snapview/) for camera content, and with
  [The Communications Button](../communications_button/) — the View Screen is the
  surface its voice question + answer text renders into.

One more pattern from the working builds: the idle background doesn't have
to be a clock. A plain dark panel is a fine default, and a Settings-page
chooser that swaps between embedded background images gives users
swappable idle art without reflashing.

Clone it, reshape it, tell me what you improved — issues and PRs welcome.
