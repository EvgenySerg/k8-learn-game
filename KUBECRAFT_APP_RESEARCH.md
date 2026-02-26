# KubeCraft App Research Document

## 1) What this app is
KubeCraft is a **single-page, browser-based educational game** for learning Kubernetes in a practical, operator-style format.

It combines:
- Multiple-choice quizzes
- Incident-response scenarios
- Command-building exercises (`kubectl` token assembly)

The app is branded as **"Kubernetes Mission Control"** and explicitly positioned as a **Go developer edition** of Kubernetes learning.

## 2) Who this app is for
Primary audience:
- Go backend developers moving into Kubernetes operations
- Junior-to-mid platform engineers
- DevOps/SRE learners preparing for real cluster troubleshooting

Secondary audience:
- Team leads who want an internal onboarding mini-course
- Bootcamp/instructor-led training programs that need interactive drills

Skill span:
- Beginner to Expert (6 levels of increasing difficulty)

## 3) Product type and LMS positioning
Current form:
- A **self-contained learning game**, not a full LMS

What it already does well:
- Structured curriculum progression
- Immediate formative feedback
- Gamification (score, lives, streaks, badges, rank)
- Applied operational context (incidents, rollbacks, RBAC checks, networking diagnosis)

What it does **not** currently include (typical LMS capabilities):
- User accounts/authentication
- Progress persistence across sessions/devices
- Instructor dashboard/analytics
- Assignments/cohorts/certificates
- SCORM/xAPI/LTI integration

Conclusion:
- This is best categorized as a **learning module/engine** that could be embedded into an LMS ecosystem.

## 4) Curriculum and learning design
Total content:
- 44 challenges
- 12 topic sections
- 6 levels
- Question types: 27 quiz, 7 scenario, 10 command-builder

Topic coverage:
- Pods & Workloads
- Services & Networking
- Storage & Config
- Deployments & Rollouts
- Scheduling & Policy
- Autoscaling
- RBAC & Security
- Operators & CRDs
- Observability
- Advanced Topics
- Helm & GitOps
- Ingress & TLS

Pedagogical pattern per challenge:
- Prompt/question
- Operational context snippet
- Learner response
- Immediate correctness feedback
- Why-answer-explanation
- "Go tip" applied engineering advice
- "Deep Dive" extension material

This is a strong **microlearning + deliberate practice** model with realistic production-oriented framing.

## 5) Game progression structure
Level model:
1. Level 1: Cluster Rookie (Beginner) - 9 challenges
2. Level 2: Runtime Defender (Beginner+) - 7 challenges
3. Level 3: Availability Engineer (Intermediate) - 5 challenges
4. Level 4: Control Plane Specialist (Intermediate+) - 9 challenges
5. Level 5: Platform Operator (Advanced) - 5 challenges
6. Level 6: Kubernetes Mastermind (Expert) - 9 challenges

Mechanics:
- 3 lives system
- Streak-based bonus scoring
- Boss challenge in each level
- Badge unlocked per completed level
- End-of-run rank based on score bands

Progress UX:
- HUD: score, lives, streak, level, question counter, badges
- Global progress bar
- Level completion screens
- End-of-mission summary + suggested learning path

## 6) Technical architecture
Architecture style:
- **Static frontend app** (no backend)
- Vanilla HTML/CSS/JavaScript
- Data-driven content via in-browser question dataset

Codebase structure:
- `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.html`
  - App shell + HUD + container for dynamic rendering
- `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.css`
  - UI system, responsive layout, gamified visual language
- `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game.js`
  - Runtime engine, state management, rendering, scoring, progression logic
- `/Users/evgenysergienko/Downloads/k8s-game-app/k8s-game-data.js`
  - Curriculum content (question bank with explanation layers)

Runtime flow:
1. Load question dataset from `window.KUBECRAFT_QUESTIONS`
2. Enrich questions with grouping and dynamic tags
3. Build level objects from blueprint + question indexes
4. Render challenge UI by question type
5. Evaluate answer, compute score/life/streak changes
6. Show pedagogical feedback
7. Advance challenge/level/end state

## 7) Data model and content engineering
Question schema includes:
- `type` (`quiz`, `scenario`, `command`)
- `q` (prompt)
- `context` (code/incident snippet)
- `options` (for quiz/scenario)
- `tokens` (for command-builder)
- `answer`
- `explain`
- `wrongReasons` (targeted misconception feedback)
- `tip` (Go-specific practical tip)
- `deepDive` (extended instruction)

Strengths of this schema:
- Supports both assessment and teaching in a single interaction
- Encodes remediation paths for wrong answers
- Keeps content authoring extensible without engine changes

## 8) UX and interaction design
Notable UX qualities:
- Clear mission-control visual identity
- Good information density in HUD without clutter
- Distinct visual treatment for each challenge type
- Immediate, rich feedback blocks improve retention
- Mobile adaptation for scenario options

Potential UX risks:
- Long feedback blocks may feel heavy on small screens
- Single-run flow with no save/resume may reduce completion rate for longer sessions

## 9) Strengths from software architecture and learning strategy lens
- Clean separation of concerns: view shell, style system, engine logic, content data
- Fully portable deployment (can host on any static web server/CDN)
- Fast startup and low runtime complexity
- High educational signal via incident-driven scenarios
- Strong bridge between conceptual Kubernetes and real command-line operations

## 10) Key limitations and scale risks
Product limitations:
- No identity, persistence, cohort management, or analytics
- No adaptive learning path per learner profile/performance
- No authoring UI (content edited directly in JS file)

Engineering limitations:
- Global mutable state in one script can become hard to maintain at larger scale
- Inline `onclick` handlers limit component reuse and testability
- No automated tests or CI-visible quality guardrails in current package

## 11) Recommended evolution roadmap (toward LMS-ready platform)
Phase 1: Stabilize learning engine
- Extract state + scoring logic into testable modules
- Add local persistence (`localStorage`) for resume and progress memory
- Introduce basic telemetry events (question answered, fail reason, time-to-answer)

Phase 2: Content operations
- Move question bank to JSON with schema validation
- Build a lightweight authoring pipeline for SMEs/instructors
- Add metadata tags for role-based playlists (Dev, SRE, Security)

Phase 3: LMS integration
- Add authentication and learner profiles
- Add instructor/admin dashboard
- Export progress and outcomes via xAPI/SCORM/LTI-compatible adapters
- Introduce certificates and cohort assignments

Phase 4: Adaptive intelligence
- Difficulty adaptation based on mistake clusters
- Recommendation engine for next learning modules
- Role-specific paths (Go developer, SRE, platform engineer)

## 12) Final assessment
KubeCraft is a **high-quality interactive Kubernetes learning game** with strong applied pedagogy and clear technical structure.

As-is, it is best treated as:
- A standalone training module
- Or a reusable assessment/learning component inside a broader LMS

With persistence, analytics, and integration layers added, it can evolve into a robust enterprise-grade Kubernetes learning product.

