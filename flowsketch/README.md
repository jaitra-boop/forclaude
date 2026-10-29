# FlowSketch

A local tool for ideating UX flows as **low-fidelity, grayscale wireframes**. Pick a persona, describe a task, and get back a flow diagram **and** a storyboard of wireframe screens, with annotations explaining *why*. Both views edit the same model, so a change in one shows up in the other in the same render.

## Setup

```bash
cd flowsketch
npm install
cp .env.example .env        # optional: add ANTHROPIC_API_KEY
npm run dev                 # starts the API (127.0.0.1:8799) and the app at http://localhost:5199 (opens the browser)
```

FlowSketch runs on its **own ports (5199 for the app, 8799 for the API)** so it never collides with another Vite app on the default 5173. If a port is taken, `npm run dev` stops with a clear message instead of silently moving; change `CLIENT_PORT` / `PORT` in `.env`. Set `NO_OPEN=1` to stop the browser opening automatically.

- **No API key? Mock mode.** Generation returns the hand-written sample flow ("Invite a teammate", 6 screens, an error branch and an alternate branch, with annotations), and each refine action returns a small canned patch computed against your current flow. The whole UI works offline. The top bar shows a "Mock mode" badge.
- `.env` settings: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`, the latest Sonnet), `ANTHROPIC_FALLBACKS` (`default` turns on the API's server-side refusal fallback, `off` disables it), `PORT`, `CLIENT_PORT`.
- The key is read only by the Node server (`server/index.ts`). The browser only talks to `/api/*` and never receives it.

Other scripts: `npm test` (Vitest), `npm run typecheck`, `npm run build`.

## Using it

**Ideate (left panel)**
- **New flow**: choose a persona, describe the task/goal, the platform (mobile/desktop), the scope ("Errors & edge cases" or "Happy path only") and any extra context, then click **Generate**. A spinner shows while it runs. If it fails, you get a clear error and the current flow stays untouched.
- **Personas**: create, edit and delete personas (name, role, skill level, context, goals, constraints, pain points). There are two seeds: Priya (agency team lead, mobile, cost-sensitive) and Marcus (novice nonprofit admin).
- **Context folder**: lists the `./context/*.md` files that will go into the prompt (see below).

**Views (top toggle: Flow / Storyboard / Split)**
- **Flow view** (React Flow): each node shows a `<WireframeScreen>` thumbnail. Edges are labelled with their trigger and styled by kind: *solid* = happy, *dashed* = error/alternate, *dotted* = back. Back and leftward edges route under the nodes so their labels don't collide with forward edges. You can drag nodes, drag from a node's dot to another node to create a transition, click an edge label to select it, double-click a node to open the screen editor, and use **+ Screen**, **Auto-layout** (dagre, left to right), **Fit** and **PNG**.
- **Storyboard**: frames follow a path. The default is the happy path from the start screen; the **Path** menu lists the named error/alternate paths. Arrows between frames show the trigger, kind and condition. Where a screen has more than one outgoing transition, an **"or… (n)"** chip expands to show the alternatives; click one to switch the path. Notes are listed under each frame. Screens the path doesn't reach are shown under "Not on this path", and they're editable too.
  - Click an element to select and edit it. Drag elements to reorder them or move them to another frame (a linked button takes its transition with it). Drag or click palette items to add elements.
  - **+ Pin note**, then click an element or a frame, drops a numbered pin; type its text in the side panel.
- **Inspector (right panel)** edits whatever is selected, in both views:
  - Screen: title, purpose, kind, set as start, duplicate, delete.
  - Element: type, label, per-type props, row group.
  - **Link to screen…**: pick an existing or new screen and a kind. This creates or retargets the same transition the flow view draws.
  - Transition: trigger, kind, condition, from/to, firing element.
  - Notes: type, text, pinned element.
- **Refine with AI** tab:
  - Actions: "Add error and empty states", "Simplify this flow", "Suggest missing screens or interactions", "Rewrite annotations to be more specific", plus a free-text instruction.
  - It focuses on the selected screen if there is one (toggle). Otherwise it works on the whole flow.
  - The result is a **patch** shown as a diff summary (added / changed / removed). **Accept** applies it as one undo step; **Reject** discards it.

**Keyboard**:
- Delete/Backspace deletes the selection.
- Cmd/Ctrl+D duplicates the selected screen or element.
- Esc deselects (or closes the screen editor).
- Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z (or Ctrl+Y) redoes.

Shortcuts are ignored while you're typing in a field, so text fields keep their native undo.

**Export (top bar)**:
- JSON: the project model.
- PNG: the whole flow view, not just the visible part.
- Print / PDF: the storyboard path, frames plus notes, grayscale; it opens the browser print dialog.
- Storyboard HTML.
- Markdown: one section per screen with its elements, transitions and annotations.

**Persistence**: the project autosaves (debounced 800 ms) to `./projects/<name>.flow.json`. Files are validated with the same Zod schema on save and on load. The default project is `default`; open `?project=<name>` to use another. On first run, `default` is seeded with the two personas and the sample flow. If the server isn't running, the app still works in memory with the sample and shows "Offline (not saved)".

## How the model and sync work

- `src/model/schema.ts` is the **single source of truth**: `Project → personas[] + flows[] → screens[] + transitions[]`, with elements, annotations and an unused `findings[]`. Everything else is derived from it.
- `src/model/ops.ts` holds **pure mutations**, e.g. `addScreen`, `deleteScreen`, `updateElement`, `moveElement`, `addTransition`, `linkElementToScreen` and `addAnnotation`. Both views call exactly these, through the store.
- `src/store/store.ts` is **one Zustand store**. It holds the `Project`, the shared `selection`, the view mode and the undo history.
  - Every action runs its op inside immer's `produceWithPatches` and records `{patches, inversePatches}`.
  - Undo and redo apply those patches, so they work across both views.
  - Consecutive edits with the same key (dragging one node, typing in one field) merge into a single undo step.
- **Views are pure functions of the store.**
  - The flow view re-derives nodes and edges with `flowToNodes` and `flowToEdges` (`src/views/flow/graph.ts`) on every change. The only view-local data is React Flow's measured node sizes.
  - The storyboard derives its path with `computePath` (`src/model/paths.ts`). Branch choices are UI state; they are not part of the model.
  - Both render screens with the same `<WireframeScreen>` (`src/wireframe/WireframeScreen.tsx`), and so does the print export.
- **Reference integrity** (`src/model/integrity.ts`):
  - `checkIntegrity` reports dangling references; `repairFlow` fixes them.
  - Deleting a screen removes its transitions and clears `linkTo` references to them.
  - Deleting a transition clears its element's `linkTo`.
  - Deleting an element clears `triggerElementId` and annotation pins that pointed at it.
  - An element fires at most one transition; transitions are authoritative and `linkTo` mirrors them.
  - AI output and refine patches go through `repairFlow` before they reach the store.
- **Path computation** follows `choices[screenId]` when set. Otherwise it prefers happy, then alternate, then error edges, and takes back edges only if they are the only option. A visited set ends loops, which are shown as "↩ back to X". `enumeratePaths` is DFS over simple paths with a result cap, so dense cyclic graphs can't hang it.

## AI generation

- `POST /api/generate-flow` (`server/app.ts`):
  1. Loads the context files.
  2. Builds the prompts in `server/prompts.ts`: the senior-UX-designer role, the element vocabulary, layout rules, "no brand styling", a trigger on every transition, explicit states when the scope asks for them, and annotations tied to persona goals and pain points.
  3. Asks Claude for **structured output**, constrained by a JSON schema derived from the Zod "wire" schema (`src/model/aiSchema.ts`).
  4. The response is parsed, validated with Zod, and checked for broken references. If anything fails, the server **retries once**, showing the model its previous output and the validation errors (`generateStructured` in `server/llm.ts`). A second failure returns a 502 with details, and the UI keeps your flow untouched.
  5. The validated wire flow is converted to the model with fresh ids, repaired, and **auto-laid out left to right with dagre**.
- `POST /api/refine` returns a `RefinePatch`: add/update/remove screens and transitions. It never returns a regenerated flow.
  - The patch is validated against the schema and against the current flow's ids, so a bad id triggers the same single retry.
  - It is applied with `applyRefinePatch`. Element ids the model keeps survive, so existing links stay intact.
- The wire schema is "flat and fully required" (nullable instead of optional) to suit structured outputs. Element props travel as `detail` / `items` / `row` and are mapped to typed props.

## Context files

Put Markdown files in `./context/` (top level only; `README.md` is ignored), for example personas, design principles, constraints or tech limits. They are included in every generate and refine prompt. The Ideate panel lists them, and each generated flow records which files were used (`flow.contextFiles`, shown in the Flow inspector). Examples live in `context/examples/`; copy one up a level to use it.

## Adding an element type

1. Add the name to `ELEMENT_TYPES` in `src/model/schema.ts`.
2. Give it a default label and props in `defaultElement` (`src/model/ops.ts`).
3. Add a renderer to `ELEMENT_RENDERERS` and a palette label to `ELEMENT_LABELS` (`src/wireframe/elements.tsx`). Add CSS in `wireframe.css` using only the `--wf-*` gray tokens.
4. Describe it for the model in `ELEMENT_GUIDE` (`server/prompts.ts`). If it uses `detail` differently, update `wireElementToElement` / `flowToWire` (`src/model/aiSchema.ts`).

All four maps are typed `Record<ElementType, …>`, so `npm run typecheck` fails until every step is done. The AI schema picks up the new type automatically.

## Where an audit mode would plug in

`Flow.findings?: Finding[]` (`{id, level: "flow" | "journey", targetId, severity, evidenceLabel, text, suggestion}`) is already in the schema and validated on disk, but nothing produces or renders it yet. An audit pass would:

1. **Server**: add `POST /api/audit` next to `/api/refine` in `server/app.ts`. Reuse `generateStructured` with a `Finding[]` schema, validate that each `targetId` is an existing screen, transition or element id (like `refinePatchProblems`), and pass the context files as evidence.
2. **Model**: add an `ops.setFindings(flowId, findings)` op (undoable like everything else). Extend `repairFlow` to drop findings whose `targetId` no longer exists.
3. **UI**: render findings as severity-labelled pins keyed by `targetId`: in `<WireframeScreen>` (next to annotation pins), on flow edges (`TransitionEdge`) and in an "Audit" tab beside "Refine with AI". Each finding's `suggestion` can be turned into a refine instruction to get a patch.

## Defaults and assumptions

- Lives in its own folder (`flowsketch/`), separate from the other apps in this repo.
- **Express 5** server on `127.0.0.1` only. Vite proxies `/api`.
- **Model**: `claude-sonnet-5-5`, called through the official SDK with streaming and `output_config.format` JSON-schema structured output. Forced tool use isn't supported on current models, so structured output is the mechanism. Server-side refusal fallback (`fallbacks: "default"`) is on by default; set `ANTHROPIC_FALLBACKS=off` to disable it.
- **Wireframe font**: a monospace stack (`Comic Mono`/`Comic Neue` if installed, otherwise the system monospace). The wireframe palette is seven grays in `src/wireframe/tokens.ts`. App chrome uses Tailwind's neutral grays, with all shadows disabled. Screen kinds are shown with outline styles: dashed = state, double = external.
- **Layout**: a vertical stack per screen. Consecutive elements with the same `props.row` render side by side. There's no free-form positioning.
- **Undo**: the history holds up to 200 steps. Loading a project clears it. Persona edits are undoable too.
- **Refine target**: the selected screen when one is selected and "Focus" is ticked; otherwise the whole flow. If you edit the flow while a proposal is pending, it's marked stale, and applying it skips any references that no longer match.
- **Mock refinements** are deliberately simple and labelled "(mock)".

## Tests

`npm test` runs Vitest:
- `schema.test.ts`: schema and AI-output validation, wire↔model conversion.
- `integrity.test.ts`: reference integrity after every kind of delete or move.
- `paths.test.ts`: happy path, branches, choices, self-loops and cycles, dense graphs that must not hang.
- `store.test.ts`: every store action both views use, undo/redo and coalescing.
- `sync.test.tsx`: a storyboard label edit changes the flow node render; a flow-view edge appears in the storyboard; rename, start and delete changes, selection and undo across views.
- `refine.test.ts`: patches apply cleanly, the Markdown and print exports, and the print output is grayscale-only.
- `server.test.ts`: the API with a fake model, the single retry with validation errors, error handling, mock mode, the context loader, and project persistence and validation.
