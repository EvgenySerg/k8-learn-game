# Typed Command Challenge + Prerequisite Flow Plan

## 1. Goal

Define implementation logic (no code yet) for:

1. A separate **Typed Command Challenge** that is launched from its own button (not mixed into main challenge flow).
2. Main challenge command questions that continue to use the current box/click command UI.
3. A dependency mechanism so command questions in the main challenge can appear only after required prior questions.

This plan is written for handoff to another implementation agent.

## 2. Clarified Product Behavior

Based on your clarified requirements:

1. The same command content can be used in both challenge types.
2. Rendering depends on active challenge type:
   - Main challenge: click/select command boxes (current behavior).
   - Typed challenge: user types full command.
3. No `mode` flag is needed on question data for this.
4. No `poolKey` is needed for command selection.
5. If available commands are fewer than target count, use all available commands quietly.

## 3. Current Codebase Baseline

In `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.js` now:

- Question types: `quiz`, `scenario`, `command`.
- Command gameplay today uses token/box click flow.
- No per-question timer exists.
- Wrong answer reduces hearts.
- Ordering uses shuffle + daily hit-ratio reprioritization.
- No prerequisite graph exists.

## 4. Data Model (Updated)

## 4.1 Question-level fields

Keep existing command schema (`tokens`, `answer`) and add only what is needed for prerequisites:

- `id: string` (required for prerequisite mapping)
- `requires?: string[]` (optional prerequisite question IDs)

Meaning of `id`:

- A stable unique identifier for a question (for example: `l1-q-quiz-03`).
- Used by `requires` to point to a specific prior question.
- This avoids dependency logic relying on array index positions.

## 4.2 Level-level config

Add optional config per level:

- `challengeConfig?: {`
  - `typedPickCount: number` (default `20`)
  - `regularCommandPickCount: number` (default `6`)
  - `baseQuestionTimeSec: number` (default `40`)
- `}`

No `poolKey` field is required.

## 5. Entry Points and Session Separation

## 5.1 Main challenge entry

Main challenge keeps existing flow and existing button/entry.

## 5.2 Typed challenge entry

Add a separate button, for example: `Start Typed Command Challenge`.

When this button is used:

1. Launch a separate challenge run state.
2. Build typed command question set for selected level.
3. Render typed input UI + timer logic.
4. Keep score/hearts/timer state scoped to typed run (do not mutate active main run unless explicitly desired later).

## 6. Command Selection Logic (No poolKey)

For each selected level:

1. Command source set = all questions where `type === "command"`.
2. Main challenge command subset:
   - Randomly pick `regularCommandPickCount` (default `6`) from source set.
   - If source count < target, use all source commands.
3. Typed challenge subset:
   - Randomly pick `typedPickCount` (default `20`) from source set.
   - If source count < target, use all source commands.

No warnings needed for short pools.

If target values are changed later, selection always uses:

- `actualPick = min(targetPick, availableCommandCount)`

## 7. Main Challenge Logic (Regular UI)

1. Command questions in main challenge stay in current click-box command builder UI.
2. Command questions are mixed with quiz/scenario per normal level progression.
3. Prerequisites (`requires`) are enforced so command questions unlock only after required prior questions are answered.

## 8. Typed Challenge Logic (Typed UI)

## 8.1 Timer constants

- `base_question_time = 40s` (default via config)

## 8.2 Per-question budget

For each typed question:

- `question_time = base_question_time + carry_from_previous`

## 8.3 Carry rule on correct answer

- `remaining_prev = question_time - elapsed`
- `next_question_time = remaining_prev + base_question_time`

`remaining_prev` may be negative.

Example:

- If answer becomes correct at `-5s`, next question time is `35s`.

## 8.4 Failure rules

1. Wrong typed command submission:
   - `-1 heart`
   - move to next typed question (single-attempt model, aligned with current game behavior)
2. Not enough time:
   - timer can go negative
   - if user eventually submits correct command, negative remainder carries by formula above
3. Timeout alone:
   - reaching `0s` or negative time does **not** remove a heart by itself
   - heart loss happens only on wrong typed command submission

## 9. Prerequisite Logic

## 9.1 Eligibility

A question is eligible if every `requires` ID has already been answered in current run.

## 9.2 Runtime progression

When moving to next question:

1. Select next unanswered eligible question.
2. If multiple are eligible, randomize among eligible while preserving prerequisite constraints.

## 9.3 Missing/invalid prerequisite IDs

- Ignore missing IDs silently (no warnings).
- Dependency check continues with the valid IDs only.

## 9.4 Circular dependencies

- Content authoring must avoid cycles.
- Runtime should fail safely for the affected level/challenge if a hard cycle is detected.

## 10. Validation Rules

## 10.1 Main challenge command validation

- Keep current strict token sequence comparison.

## 10.2 Typed challenge validation

Canonicalize typed string before compare:

1. Trim leading/trailing spaces.
2. Collapse repeated spaces.
3. Compare with canonical answer text (derived from answer tokens).

## 11. UI/UX Requirements

1. Add separate button for typed challenge launch.
2. Typed challenge question card needs:
   - text input for command
   - live signed timer display (`12s`, `0s`, `-5s`)
   - check/submit action
3. Main challenge remains visually unchanged for regular command questions.
4. Typed feedback shows:
   - entered command
   - correct command
   - resulting next-question time budget

## 12. Implementation Phases

1. Add challenge config and question IDs/requires support.
2. Add separate typed challenge entry + isolated state container.
3. Implement command sampling for both challenge types (no poolKey).
4. Implement typed timer/carry/heart logic.
5. Implement prerequisite gating in main challenge progression.
6. Add regression checks for existing quiz/scenario/command behavior.

## 13. Where To Change Files

Use this as implementation checklist by file.

1. `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.html`
   - Add separate button to launch typed challenge (for example in header/HUD controls).
   - Add any required container hooks for typed challenge controls if needed.
2. `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.css`
   - Add styles for typed challenge button.
   - Add styles for typed command input area.
   - Add timer styles for positive/zero/negative states.
   - Keep existing main challenge command-box styles unchanged.
3. `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.js`
   - Add separate typed challenge entry handler and state.
   - Add command sampling for:
     - main challenge (up to 6 random command questions)
     - typed challenge (up to 20 random command questions)
   - Add typed timer state and carry calculation:
     - `next = remaining + base`
   - Enforce heart rule:
     - only wrong typed submission removes heart
     - timeout alone does not remove heart
   - Add prerequisite resolver using `id` and `requires`.
   - Update progression logic to choose next eligible question only.
4. `/Users/evgenysergienko/Downloads/k8s-game-app/data/levels/*.js`
   - Add `id` to each question (if missing).
   - Add `requires` arrays only where dependency is needed.
   - Optionally add per-level `challengeConfig` overrides (if defaults must differ).
5. `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game-data.js` (optional)
   - Only if you want central default config constants stored in data layer.
   - If not, keep defaults in `k8s-game.js`.

## 14. Acceptance Criteria

1. Typed challenge is launched from a separate button and runs as separate flow.
2. Main challenge still uses command box/click UI.
3. Typed challenge uses base `40s` and exact carry formula:
   - `next = remaining + 40`
4. Negative time carry is supported.
5. Wrong typed submission removes 1 heart.
6. Main challenge randomly uses up to 6 commands from level command source.
7. Typed challenge randomly uses up to 20 commands from same source.
8. If pool has fewer commands than target, all available commands are used quietly.
9. Prerequisite-linked command questions do not appear before required prior questions.

## 15. Test Matrix (Logic-level)

Timer/carry:

- Correct at `+15s` -> next `55s`.
- Correct at `0s` -> next `40s`.
- Correct at `-5s` -> next `35s`.
- Time reaches `-10s` with no wrong submission -> hearts unchanged.

Sampling:

- Available `3`, regular target `6` -> regular uses `3`.
- Available `3`, typed target `20` -> typed uses `3`.
- Targets changed by config -> picks use `min(target, available)`.

Prerequisites:

- Command with `requires=["q1"]` appears only after `q1` answered.
- Multiple prerequisites require all listed IDs answered.
- Missing prerequisite ID is ignored silently.
