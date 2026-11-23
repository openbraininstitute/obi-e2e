# Recording a video

How to go from a fresh clone to a finished video. Filming works for any
scenario folder (`site`, `virtual-labs`, `data`, `workflows`, or a new one).

## 1. Set up (once)

```bash
git clone git@github.com:openbraininstitute/obi-e2e && cd obi-e2e
make setup
```

`make setup` installs Bun, the packages, Chromium and ffmpeg, and creates
`.env.staging.local`. It's safe to run again.

Open `.env.staging.local` and fill in the QA user and `LAB_ID`.
Ask a maintainer for these values.

## 2. Sign in

```bash
make auth
```

The sign-in lasts 60 minutes. If the video shows a log-in page, run it again.

## 3. Choose how to make the video

### A. A polished film: one take, pointer shown, set pace

1. Make a folder for it: `scenarios/<section>/<name>/`.
2. Write the storyboard, `video-recording.md`, in that folder. It says what
   happens, scene by scene (the keywords are below).
3. Turn the storyboard into the film script, `video-recording.ts`, by running
   this in Claude Code:
   ```
   /e2e-film scenarios/<section>/<name>
   ```
4. Record it:
   ```bash
   bun run test:video scenarios/<section>/<name>
   ```

## 4. Find the video

`test-results/videos/<name>/<date-time>/`

Every run gets its own folder, so earlier takes are never overwritten.

## Storyboard keywords (`video-recording.md`)

| Keyword                            | What it does                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `# Title` + one paragraph          | Who the video is for and what they should take away.                                           |
| `Pace: 2 seconds`                  | How long each click or keypress stays on screen. The only timing setting.                      |
| `User:`                            | Who is signed in: `public` (signed out), `authenticated`, or `credits` (can launch paid runs). |
| `Seed: seed.json`                  | The file the form is filled from, if there is one.                                             |
| `## Scene name`                    | Starts a new scene. Only the report shows the name; the video doesn't.                         |
| `Steps:`                           | The actions in this scene, in order.                                                           |
| `Show:`                            | What must be on screen before the film moves on. The film waits for it.                        |
| `Point at "X" as "Title": "words"` | A popup with an arrow to X, shown for a few seconds.                                           |
| `Focus on "X"`                     | Zooms in on X. Add `, close` or `, wide` to change how much. `"A" and "B"` frames both.        |
| `Pull back`                        | Zooms back out to the whole screen.                                                            |
| `Scroll to "X"`                    | Scrolls X smoothly into view.                                                                  |

## Examples

### Record a film that already exists

```bash
bun run test:video scenarios/workflows/simulate-paired-neurons
bun run test:video scenarios/workflows/simulate-microcircuit-layer-4
bun run test:video scenarios/workflows/simulate-whole-brain-male-cns
```

Each storyboard (`video-recording.md`) in those folders is a finished example
to copy.

### A small storyboard

A sample shape for a new film in `scenarios/site/pricing/`. It hasn't been
run, so check the words against the real page before you use it.

```markdown
# Pricing page

A short tour of the pricing page for a new visitor: the plans, and where to
sign up.

Pace: 2 seconds
User: public

## The plans

Steps:

1. Open the pricing page
2. Focus on the plans
3. Point at "Free" as "Start free": "Every new account starts on this plan."
4. Pull back

Show:

- The plan cards
```

Then:

```bash
/e2e-film scenarios/site/pricing                  # in Claude Code: writes video-recording.ts
bun run test:video scenarios/site/pricing         # records it
```

### Record existing tests (no storyboard)

```bash
bun run test:video --project=public scenarios/site/footer/footer.spec.ts
bun run test:video --project=public --format=mp4 scenarios/site/pricing
E2E_VIDEO_SIZE=2560x1440 bun run test:video scenarios/workflows/simulate-paired-neurons
```

## Command options

| Option                                          | What it does                                                 |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `--format=mp4`                                  | Makes an mp4 instead of a `.mov`.                            |
| `--format=webm`                                 | Keeps Playwright's raw file (1512x850). Doesn't need ffmpeg. |
| `E2E_VIDEO_SIZE=2560x1440 bun run test:video …` | Changes the picture size for one run (default 1920x1080).    |
| `--project=public` / `private` / `credits`      | Records existing tests instead of a film (option B).         |
| `bun scripts/video.ts --join`                   | Joins the latest run's clips again without re-recording.     |
| `E2E_ENV=production bun run test:video …`       | Records on production instead of staging.                    |
