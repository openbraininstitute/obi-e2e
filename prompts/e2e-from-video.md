# /e2e-from-video — turn a screen recording into a film

Usage: `/e2e-from-video <video file> [scenarios/<section>/<name>] ["<flags or notes>"]`

A scientist records a demo of a workflow in the app. This command turns it
into the two files that make the same demo again, any time, from the app:
`video-recording.md` (the storyboard) and `video-recording.ts` (the film).
`scenarios/workflows/simulate-whole-brain-male-cns` was made this way, from
the FlyWire demo; read it before starting.

**What is kept is the series of actions and their results, not the look.**
The design will change: buttons move, panels are redrawn, words change. The
film must still do what the scientist did, in the same order, and show the
same results — the same circuit picked, the same values set, the same counts,
files and charts coming out. It does not have to look like the recording.

The storyboard is the source. The film is written from it by `/e2e-film`, and
both are kept in step: a scene added to one is added to the other.

## 1. Ask what the video does not show

Before anything else, ask the scientist, in one message:

- Which feature flags were on when they recorded? A flag changes what the app
  offers, and nothing in the video says it is on. The film turns each one on
  with `enableFeature` from `@fixtures/steps/feature-flags`, by its key: the
  key is in core-web-app, `src/features/feature-flags/flags.ts`, found by the
  flag's description.
- Which deployment was it recorded on (the URL in the video often says)?
- Which parts to leave out. Parts outside the app (a notebook in JupyterHub,
  slides, a title card) are always left out; say which ones you saw.

Skip a question the scientist already answered in the command's notes. The
answers go at the top of the storyboard, in one or two lines.

## 2. Watch the whole video, and list actions and results

Never write a scene from a few frames. Extract a frame every few seconds into
a temporary folder (never the repository), tile them four to a picture, and
read every picture:

```bash
D="$TMPDIR/frames"; mkdir -p "$D"
ffprobe -v error -show_entries format=duration -of csv=p=0 "<video>"
ffmpeg -v error -i "<video>" -vf "fps=1/3,scale=1200:-1" "$D/f_%03d.png"
ffmpeg -v error -pattern_type glob -i "$D/f_*.png" -vf "scale=1000:-1,tile=2x2:padding=6:color=red" "$D/m_%02d.png"
```

Where a lot happens fast — a menu, a drag, a panel opening — go back over that
stretch at one frame a second (`-ss <start> -to <end> -vf fps=1`).

Write down, in order, two things for each moment:

- **The action**, in the scientist's terms: what they picked, typed, filtered,
  named, opened, played. Every value: the circuit, the filter values, the
  amplitudes, the names given.
- **The result**: what came out of it. A count ("71 of 164,606 neurons
  selected"), a name, a file, a status, a chart and what it is drawn against.

Not where things were on the screen, not colours, not layout. That list is the
storyboard's draft. Compare it with the video once more before going on:
missing an action is the mistake this command most often makes.

## 3. The scenario and its seed

The film walks a scenario's path, so it needs one.

- A scenario for this workflow and these settings already exists: use it.
- None does: make the folder, then `scenario.md` (scenarios lead, tests
  follow), then `seed.json` from what the video typed into the form —
  circuit, blocks, values, swept values — then the spec with
  `/e2e-generate`. Run the spec until it passes before the film.

What the form holds goes in the seed. What only the video does to the form,
such as renaming its blocks, belongs to the film: `runCampaign`'s `afterFill`.

## 4. Find today's way to do each action

The app may have changed since the recording. For each action in the draft,
find how the app does it now, with the Playwright CLI, signed in, with the
flags on (`CLAUDE.md` → _Browsing the app_; a flag is a `feature-flags`
cookie, `{"<key>": true}`). A control that moved, was renamed or redrawn is
fine: follow today's app, and check the action still gives the same result.

Address what you find by test id first. When the CLI cannot see an element —
a canvas, a popup, a grab bar — read the component in core-web-app: it says
how the element is labelled. Something reached only by its position (a mark
drawn on a canvas, a bare grab bar) breaks with the next redesign; do it that
way only when nothing else works, say in the file where the numbers come
from, and list it in the report as a test id core-web-app should add.

An action the app can no longer do, or one whose result has changed, is
reported to the scientist. Do not invent a step to stand in for it.

## 5. Write `video-recording.md`

The shape and the lines (`Pace:`, `Point at`, `Focus on`, `Show:`) are in
`prompts/e2e-film.md` §1. On top of that:

- The description under the title: two or three short sentences. What the
  scientist does and why. No list of steps, no dates, no selling.
- Simple, casual, clear English everywhere: "pick", "press", "open", "poke".
  Short sentences. A callout's words are what a scientist would say out loud
  to a colleague beside them, one or two sentences.
- One scene per part of the video, in the video's order, named the way a
  scientist would name it: "The fly circuits", "The 3D player".
- `Steps:` are the actions, said so they stay true after a redesign: "Give
  the 3D player the whole page", not "Drag the line at the left". Quote the
  words of a control only when they are what the scientist reads to find it.
- `Show:` lines are the results: counts, names, statuses, files, what a chart
  plots. Never a position, a colour or a layout.
- The settings a scene needs and the video cannot show (a feature flag) go
  in the description, not in a scene.

## 6. Write and shoot the film

Follow `prompts/e2e-film.md` from §2 for `video-recording.ts`. Then shoot it:

```bash
bun run test:video --format=mp4 scenarios/<section>/<name>
```

Each take writes to a folder of its own, printed at the start
(`test-results/videos/<section>-<name>/<date-time>/`), so earlier takes and
other films being shot at the same time are never deleted. A film that
launches a campaign spends the project's credits on every take; say how many
takes it took.

## 7. Compare with the original

Tile the film the same way as the video in §2. Go through the draft from §2
and check, in order, that the film takes every action and reaches every
result. A screen that looks different is fine; a missing action, a different
order, or a different result is not. Fix the storyboard first, then the film,
and shoot again.

## 8. Finish

```bash
bun run casebook scenarios/<section>/<name>
bun run check
```

Report, in short simple English: the scenes, the film's length and where it
is, the flags it turns on, the credits spent, every action of the original
the film does not take and why, any result that came out different, and every
element reached by position rather than by a test id.
