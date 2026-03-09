# KubeCraft App Research Document

Repository snapshot analyzed on March 9, 2026 from the current workspace state.

## 1) Executive Summary
KubeCraft is a static, browser-based Kubernetes learning app built with plain HTML, CSS, and JavaScript. It is no longer just a small 6-level prototype. The repository now contains a 21-level campaign structure, with 8 playable levels implemented and 13 future levels defined as roadmap placeholders.

The current product is best described as a:
- Single-player learning game
- Kubernetes skills trainer with mixed interaction modes
- Lightweight learning engine with local persistence

It is not yet a full LMS. There is still no backend, identity layer, cohort management, or instructor analytics.

## 2) What Was Already Done
The following is already implemented in the codebase:

- A static SPA shell in `k8s-game.html`
- A custom visual UI and responsive layout in `k8s-game.css`
- A central game runtime in `k8s-game.js`
- A modular content structure split across `data/levels/*.js`
- A main challenge mode that mixes quiz, scenario, and command-builder items
- A separate typed command mode with its own timer, score, streak, and hearts
- Local run history persistence via `localStorage`
- Daily weak-question tracking that reprioritizes low hit-ratio questions
- Failed-review screens for both main and typed runs
- Level selector / jump navigation
- Runtime-generated question tags, short IDs, and metadata chips
- Direct-question deep linking through URL hash short IDs
- Support in the engine for prerequisites and per-level challenge configuration

This means the app has moved beyond a simple quiz deck. It now has meaningful training-loop features and a clearer campaign architecture.

## 3) What Is Only Partially Done
Several capabilities exist in the engine but are not yet meaningfully adopted in the content:

- Prerequisite flow is supported in code, but no current question authoring uses `requires`
- Runtime supports question IDs and short IDs, but source content mostly relies on generated IDs rather than explicit authored IDs
- Per-level `challengeConfig` is supported, but current level files do not override defaults
- Journey/fantasy-style gamification assets exist, but `ENABLE_JOURNEY_GAMIFICATION` is disabled
- The level roadmap is broad, but content coverage is still uneven inside the active campaign

Important nuance:
- Levels 0-4 are content-complete against their current `targetQuestionCount`
- Levels 5-7 are marked `active` but are underfilled relative to their stated targets

## 4) What Is Not Done Yet
These items are still absent from the repository:

- User accounts or authentication
- Cross-device persistence or cloud sync
- True save/resume for an in-progress campaign run
- Instructor dashboard or cohort analytics
- SCORM, xAPI, or LTI integration
- Authoring UI for SMEs or instructors
- Schema validation pipeline for content
- Automated tests
- CI-visible quality checks inside this repo
- Complete authored content for levels 8-20
- A true adaptive mastery model beyond simple daily weak-question reprioritization

## 5) Current Content Footprint

### Implemented campaign totals
- 21 level definition files
- 8 active playable levels
- 13 planned placeholder levels
- 137 authored questions currently in the repo
- Question mix:
  - 71 quiz
  - 32 scenario
  - 34 command

### Active level inventory

| Level | Difficulty | Status | Questions | Target | Notes |
| --- | --- | --- | ---: | ---: | --- |
| Level 0 · Mission Briefing | Absolute Beginner | Active | 21 | 21 | New beginner onboarding track |
| Level 1 · Cluster Rookie | Beginner | Active | 21 | 21 | Complete vs current target |
| Level 2 · Runtime Defender | Beginner+ | Active | 20 | 20 | Complete vs current target |
| Level 3 · Availability Engineer | Intermediate | Active | 20 | 20 | Complete vs current target |
| Level 4 · Control Plane Specialist | Intermediate+ | Active | 24 | 24 | Complete vs current target |
| Level 5 · Platform Operator | Advanced | Active | 5 | 24 | Large content gap |
| Level 6 · Kubernetes Mastermind | Expert | Active | 9 | 24 | Large content gap |
| Level 7 · CKA Core Foundations | Expert Foundations | Active | 17 | 28 | Partial implementation |

### Active campaign gap
- Active levels currently contain 137 questions
- Their combined target count is 182
- Current shortfall inside already-active levels: 45 questions

### Planned roadmap levels
Levels 8-20 already exist as metadata shells with title, badge, description, focus areas, and target counts, but `questions: []` today.

Planned themes include:
- Workload engineering
- Networking internals and CNI
- Storage and stateful platforms
- Security baselines
- RBAC, identity, and policy
- Observability engineering
- Performance and cost optimization
- CI/CD and release engineering
- GitOps at scale
- Multi-cluster operations
- Disaster recovery
- Service mesh and zero trust
- Kubernetes war games

## 6) Audience and Positioning
The earlier framing of "Go developer edition" is directionally true, but too narrow for the current repo.

More accurate audience definition:
- Kubernetes beginners who need strong conceptual onboarding
- Go developers moving into platform or operations work
- SRE / DevOps / platform engineering learners
- CKA-adjacent learners for core operational drills

Why the Go angle still matters:
- Many questions include "Go tip" sections
- Incidents frequently reference Go services, client-go, controllers, and operator workflows
- The content is Kubernetes-first, but developer ergonomics are clearly tuned toward Go practitioners

## 7) Learning Design Assessment

### What the learning design does well
- Uses varied practice modes instead of only multiple-choice recall
- Combines conceptual questions, incident-response decisions, and command fluency drills
- Gives immediate corrective feedback with explanation, wrong-answer reasoning, tip, and deep-dive layers
- Uses boss challenges to create milestone moments at the level boundary
- Adds typed command practice, which is closer to real terminal recall than token clicking
- Stores failed items for post-run review, which improves remediation value
- Uses focus areas and generated tags to make each question feel anchored in a skill domain

From an e-learning perspective, this is a good blend of:
- Retrieval practice
- Immediate feedback
- Scenario-based learning
- Progressive challenge
- Procedural fluency training

### Where the learning design is still weak
- No explicit learning objectives per level or per question
- No authored prerequisite map in actual content
- No spaced repetition system across days beyond weak-question reprioritization
- Typed mode is useful, but it is still a side drill rather than part of a broader mastery path
- No learner profile, diagnostic pretest, or role-based pathway
- No assessment reporting beyond local history tables

## 8) Technical Architecture

### Architecture style
- Static frontend only
- No build system
- No module bundler
- No backend API
- All state handled client-side in one main script

### File structure
- `k8s-game.html`
  - Shell, HUD, level selector, challenge-mode controls, game container
- `k8s-game.css`
  - Styling for the mission-control interface, typed mode, history tables, review screens
- `k8s-game.js`
  - Runtime normalization, sampling, scoring, rendering, persistence, history, typed-mode logic
- `k8s-game-data.js`
  - Group catalog and topic taxonomy
- `data/levels/*.js`
  - Per-level authored content and metadata

### Runtime behavior
The app now does more than render a fixed question list. It:

1. Loads a level roadmap from many `data/levels/*.js` files
2. Normalizes level metadata and question metadata at runtime
3. Generates tags from content text
4. Builds a playable main campaign run
5. Samples command questions for a separate typed drill mode
6. Tracks score, lives, streak, badges, and run outcomes
7. Saves run history and daily question hit ratios locally
8. Supports direct review of a single question via hash-based short IDs

## 9) Data Model and Content Engineering
The old document described a single question bank. That is now outdated.

### Actual content model today
Question authoring includes:
- `type`
- `q`
- `context`
- `options` for quiz/scenario
- `tokens` for command builder
- `answer`
- `explain`
- `wrongReasons`
- `tip`
- `deepDive`
- `groupId`
- optional boss flag

### Runtime-enriched fields
During normalization, the engine adds or derives:
- `id`
- `shortId`
- `tags`
- `groupLabel`
- `levelId`
- `levelTitle`
- `levelDifficulty`
- optional prerequisite handling support

### Important content-authoring observation
The runtime is ahead of the data model:
- The engine is ready for authored IDs and prerequisites
- The actual authored level content is not using them yet

This is important for documentation accuracy. The feature exists as platform capability, not as an active curriculum design pattern.

## 10) UX and Interaction Design

### Current strengths
- Strong mission-control / training-console visual language
- HUD makes score, lives, streak, level, and progress visible
- Fast flow with low friction because there is no account/login step
- Good separation between main mixed-mode play and typed command drills
- Run history is easy to access from the quick menu
- Failed-review screens convert mistakes into study material

### Current risks
- Main script remains large and highly stateful
- Inline `onclick` handlers are still widely used
- Very large feedback blocks may feel dense on smaller screens
- Direct-question deep links are useful, but there is no teacher-facing share workflow around them
- Planned levels are visible in the codebase but not actually playable, so roadmap expectations need to stay explicit

## 11) Repository-Accurate Product Assessment
KubeCraft is now better understood as a staged learning platform prototype, not just a quiz game.

Its current maturity looks like this:
- Strong interactive learning prototype
- Good static-delivery architecture
- Good content framework for expansion
- Moderate gameplay and remediation sophistication
- Weak operational platform maturity
- Incomplete advanced curriculum execution

In short:
- The engine is ahead of the authored curriculum in several places
- The curriculum roadmap is ahead of the currently shipped content
- The product pedagogy is ahead of its LMS/platform capabilities

## 12) Recommended Next Documentation Focus
If this document is expanded again later, the highest-value additions would be:

- A per-level completion tracker table for active vs target content
- A question-authoring schema reference for contributors
- A section mapping engine capabilities to actual curriculum usage
- A learning-outcomes matrix by level
- A product roadmap split into content, pedagogy, and platform tracks

## 13) Final Assessment
KubeCraft is a promising Kubernetes training application with stronger instructional design and runtime capability than the previous document reflected.

Today it is:
- A static, single-player learning app
- A mixed-mode Kubernetes practice engine
- A partially implemented long-form campaign

It is not yet:
- A complete expert curriculum
- A multi-user LMS
- A production-grade learning platform with analytics and authoring operations

That distinction matters. The repository already contains meaningful progress that the old document missed, but it also contains roadmap scaffolding that should not be described as finished product.
