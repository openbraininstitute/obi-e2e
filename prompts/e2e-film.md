# /e2e-film — write a scenario's film from its storyboard

Usage: `/e2e-film scenarios/<section>/<name>`

A film is `video-recording.ts` beside the scenario: one test that walks the
scientist's path in one take, recorded by `bun run test:video`. The storyboard,
`video-recording.md` beside it, is the contract. The spec tests the scenario;
the film shows it. They share steps, never a file.

## 1. Read the storyboard

`video-recording.md` must exist. Without it, stop and ask the author for one;
this is its shape, and `scenarios/workflows/simulate-paired-neurons/video-recording.md`
is a finished one:

```markdown
# <Title>

<Who watches this, and what they should come away knowing. One paragraph.>

Pace: 2 seconds
User: credits
Seed: seed.json

## <Scene>

Steps:

1. <What the user does, in order>

Show:

- <What is on screen before the next scene>
```

| Line                                           | Means                                                                                                                                                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Pace:`                                        | How long every click, fill or keypress is held on screen before it runs. The one timing knob.                                                                                                               |
| `User:`                                        | The tag, as in a scenario: `credits`, `authenticated`, `public`.                                                                                                                                            |
| `Seed:`                                        | The `seed.json` the form is filled from, when there is one.                                                                                                                                                 |
| `## `                                          | A scene. Its title names the `test.step` in the report; nothing is written over the picture.                                                                                                                |
| `Show:`                                        | What the viewer must see before the film moves on. Each line is an assertion: that is what makes the film wait for the page, never a sleep.                                                                 |
| `Point at "<element>" as "<title>": "<words>"` | A step that is a callout: a panel beside the element, with an arrow to it, headed by the title and holding the words, shown for a few seconds, then gone before the next step.                              |
| `Focus on "<element>"`                         | A camera move: in on the element, with room around it so the viewer sees where it sits. `, close` or `, wide` changes how much; `Focus on "<a>" and "<b>"` frames both. The steps that follow happen there. |
| `Pull back`                                    | The camera returns to the whole screen.                                                                                                                                                                     |
| `Scroll to "<element>"`                        | Brings the element into view, smoothly, where the camera is. `Focus on` does this on its own first.                                                                                                         |

A scene may show more than any case checks — a tab the scientist wants seen,
a chart opened, a panel scrolled. That is the point of a film, and why it has a
file of its own.

## 2. Read what exists

- `scenario.md` and the spec beside it: the film walks the same path, so the
  spec says how each step is done and what each page is called.
- `fixtures/steps/`, `fixtures/checks/`, `locators/`: the steps and the
  addresses the spec uses. The film uses the same ones. **Never copy a step
  into the film**; import it.
- `fixtures/recording/`: `film()` and `lastFrame()`, and every step only a
  film takes. A spec cannot import from here (oxlint refuses it), so what goes
  here costs the suite nothing.
- `prompts/e2e-generate.md` §3, for the signed-in Playwright CLI recipe, and
  `CLAUDE.md` for the rules every file keeps.

## 3. Walk the storyboard in the real application

Every scene, with the Playwright CLI, as `e2e-generate` does. A `Show:` line
names words on screen; find them there before writing an assertion. A step the
spec does not already have is written against what you saw, by test id first.

## 4. Write the film

`scenarios/workflows/simulate-paired-neurons/video-recording.ts` is the shape:

- The top says how it is shot: `const PACE = <Pace>; test.use(film({ pace: PACE }))`.
- One `test`, tagged from `User:`, titled `<Title>, in one take`. Its first
  line is `await hideActionLabel(page)`: the film shows the screen, the
  pointer and the callouts, and nothing else of Playwright's.
- One `test.step` per scene, titled exactly as the scene, so the report reads
  like the storyboard. Inside it, the scene's steps, then its `Show:` lines as
  `expect`s.
- `Point at "<element>" as "<title>": "<words>"` is `await callout(page,
<locator>, '<words>', { title, side, align })` from
  `@fixtures/recording/callout`, the title and the words exactly as written;
  `side: 'top'` for an element near the bottom, `align: 'end'` for one near the
  right edge. It resolves once the panel is gone.
  { title, side, align })`from`@fixtures/recording/callout`: the scene's name
as the title, `side: 'top'`for an element near the bottom,`align: 'end'`
  for one near the right edge. It resolves once the panel is gone.
- `Focus on "<element>"` is `await focusOn(page, <locator>)` from
  `@fixtures/recording/camera`, with `{ framing: 'close' }` or `'wide'` when the
  line says so, and a list of locators for `and`; `Pull back` is
  `await pullBack(page)`; `Scroll to` is `await scrollTo(page, <locator>)`.
  Each resolves once the move has settled. One `Focus on` after another is
  one move flowing into the next; `Pull back` only where the whole screen is
  wanted again. A step may
  only act inside the frame: Playwright cannot reach what the camera pushed
  off-screen, and fails with "outside of the viewport". Before a step on
  something the frame does not show, the storyboard pulls back or focuses
  again. A shared step that does several things at once, such as
  `chooseEntities`, is taken apart into steps the camera can move between
  (`openEntityListing`, `searchEntity`, `pickEntity`, `useChosenEntities`),
  and the spec's step composes them, so both keep one behaviour.
- A step that only this film takes goes in the film. A step two films take
  goes in `fixtures/recording/`. A step the spec also takes is already in
  `fixtures/steps/` — call it; if it is not there yet, move it there from the
  spec, so both import it.
- The film ends with `await lastFrame(page, PACE)`, the one hold a film adds:
  Playwright holds before each action, never after the last.
- The clock: the spec's (`campaignTimeout(fixture)` for a campaign) plus the
  holds, a few minutes.

Nothing else sleeps. If a scene cannot be shown as written, say so; do not
invent a step, and do not weaken a `Show:` line.

Never change the spec, `scenario.md` or `seed.json` to make the film work. A
film that needs the product to behave differently has found a bug: report it.

## 5. Shoot, then watch

```bash
bun run test:video scenarios/<section>/<name>                 # test-results/videos/<section>-<name>.mov, 1920x1080
bun run test:video --format=mp4 scenarios/<section>/<name>    # or webm, when the viewer needs one
bun run check
```

Watch the file, not the log: every scene's caption, every `Show:` line on
screen, the pointer on every click, and the last picture held. Report the
film's length, where it is, every scene and the step it became, any
step you added to `fixtures/recording/`, and anything you could not show and why.
