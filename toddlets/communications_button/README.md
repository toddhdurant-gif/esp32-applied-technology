# The Communications Button

**A voice surface that never lies to you.**

![The Communications button](communications_button.jpg)

## The idea

ESPHome gives you a `voice_assistant:` block; Home Assistant gives you Assist
pipelines. What neither gives you is a *trustworthy surface* — something that
always tells you whether the device heard you, what it thinks you said, and
whether it's still working. That gap is where voice satellites get abandoned:
a tap that silently does nothing, a button stuck on "responding," an answer
you can't hear and can't see.

This package is the tap-to-talk voice button from my wall consoles, extracted
from a hardware-verified build, with every rule it took to make it honest:

1. **State colors for every pipeline stage.** The button border and state
   line change at listening (violet) / processing (amber) / responding /
   ready (cyan) / error (red). You always know where the run is.
2. **A busy guard instead of silent dead taps.** Tapping mid-run shows
   "STILL WORKING…" — it never starts a run over a run, because the mic must
   never fight the speaker.
3. **A delayed "Processing" audio cue** that only plays when the assistant is
   actually slow. The gate (2.5s, armed the moment you stop speaking) came
   from measuring real runs, not guessing — fast commands get clean silence,
   slow queries get feedback.
4. **Text echo.** What it heard ("> your words") and the answer text render
   on screen. A mis-recognition is visible instantly instead of being a
   mystery wrong answer.
5. **A watchdog reset.** A 1-second tick returns the button to ready the
   moment the pipeline truly finishes — a stuck "RESPONDING…" is impossible
   by construction.
6. **It feels like a button.** A 3D press effect (the drop shadow collapses
   and the button translates under your finger) gives tactile confirmation
   on glass — the one press that must never chirp (see the I2S rule in the
   yaml) still visibly *presses*.

**The design thesis: every state reaches you on more than one channel.**
Color is readable across the room, text survives a noisy kitchen and proves
what was actually heard, audio covers the moment you've already looked away —
and the press itself confirms visually because it deliberately can't chirp.
Whatever situation you're in — hands full, TV on, back turned — at least two
of those channels are telling you the same truth at the same time. That
redundancy, not any single feature, is what makes the button trustworthy.

No wake word by design — a press can't mis-hear, can't break in a firmware
update, and can't trigger at 3am. (Hands-free is addable via ESPHome's
`micro_wake_word` without touching anything here.)

## What happens on a tap

```
 TAP
  │   busy guard: run already active? → "STILL WORKING…", do nothing
  ▼
 LISTENING (violet) ── you speak
  ▼
 you stop speaking ──────────────────────────► cue timer armed, 2.5s gate
  │  SPEECH-TO-TEXT (HA STT)   ~1.5–2.0s              │
  ▼                                                   │ answer text not here
 TEXT RECOGNIZED (amber) → "> your words" on screen   │ when the gate expires?
  │  CONVERSATION AGENT        ~0.2–1.9s              │ → play "Processing"
  ▼                                                   │   cue (~1.6s WAV)
 ANSWER TEXT ────────────────────────────────► cancels any pending cue
  │  → rendered on screen
  │  TTS SYNTHESIS + STREAM → speaker
  ▼
 ANSWER AUDIO PLAYS      ← long answers feel "slow" HERE — it's 13–17s of
  │                        speech, not thinking time. The text is already up.
  ▼
 READY (cyan, via the 1s watchdog) → answer text stays 30s, then clears
```

Those stage timings aren't estimates — the config logs a timestamp at each
transition (`va_timing` in the log output), so you can measure *your* pipeline
and see exactly where the seconds go. Measured on mine (Gemini-backed
pipeline): the conversation agent is never the bottleneck (0.2–1.9s even for
hard questions); STT is the biggest slice of the dead air.

## The three lessons that cost real debugging time

- **Run the voice assistant in media_player mode, not speaker mode.** If a
  speaker-mode `voice_assistant` streams raw audio while a named
  `media_player` also owns the speaker, the two consumers fight: pitch shifts
  up ("helium voice"), the UI sticks, the log fills with "buffer is full."
  One audio consumer, period — and you get a real HA media player entity for
  free.
- **`on_end` fires before playback finishes.** Reset the button there and it
  goes "ready" mid-answer. Mark it responding and let the watchdog reset it
  when `is_running` actually drops.
- **Two volume layers stack multiplicatively.** The media player's software
  volume silently restores a saved value at boot and only scales voice
  audio — so answers end up quieter than everything else. Pin it to 1.0 at
  boot and let one knob (the codec DAC) govern loudness.

## What's in this folder

- `communications_button_example.yaml` — the full extract: audio hardware pattern
  (ES8311/ES7210 sample), the state machine, cue script, watchdog, volume
  rules, and the LVGL button + text widgets to drop into your own page.
- `communications_button.jpg` — the button on the working 480×480 build.

Bring your own ~1.6s "Processing" WAV (any TTS or a simple tone) as
`audio/processing.wav` — keep it canonical 16kHz with a 16-byte fmt header
(extended-fmt WAVs fail to parse).

## Reference implementations

- A 7″ wall console carrying the same button (full device config +
  engineering write-up):
  [`wp47d2`](https://github.com/toddhdurant-gif/esp32-applied-technology/tree/main/wp47d2)
- Pairs naturally with the View Screen pattern (one content surface the
  answer text renders into) and SnapView (on-demand camera stills) — both
  running on the same devices.

Clone it, reshape it, tell me what you improved — issues and PRs welcome.
