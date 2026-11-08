# NIYANTRA (नियन्त्र)
### Autonomous AI Security Checkpoint & Action Governance Prototype

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D%20Canvas-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1%20Passing%20(20%2F20)-brightgreen?style=for-the-badge&logo=vitest)](https://vitest.dev/)

---

## 🛡️ Executive Overview
**NIYANTRA** is a production-grade AI Security Checkpoint & Action Governance prototype. It acts as an autonomous pre-flight policy barrier, inspecting artifacts before deployment and checking proposed agent tool calls against **identity, raw prompt intent, data sensitivity, and network destination** before execution (**Allow / Block / Review**).

Unlike conversational chatbots that focus on generating text, **NIYANTRA** answers a fundamentally different question:
> *"What is an autonomous agent permitted to do in production?"*

---

## 🏛️ Architecture & The Five Specialist Agents

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                 NIYANTRA SECURITY CORE                  │
                     └─────────────────────────────────────────────────────────┘
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
   [CHECKPOINT 1: ARTIFACT REVIEW]                                 [CHECKPOINT 2: ACTION GATEWAY]
   01 Upload (Check 21 exts, size, payload)                        Input: Identity + Raw Intent + Tool Call
   02 Extract (Read text; label FULL/PARTIAL/EXP)                                 │
   03 Inspect (7 Local Patterns + Opt. Gemini)                     ┌──────────────┼──────────────┐
                  │                                                ▼              ▼              ▼
                  ├──► Nova (Secrets/DLP Redaction)             [Cut]          [Hue]          [Nova]
                  └──► Hue  (Embedded Prompt Injection)      (RBAC/Role) (Intent Launder)  (DLP/Payload)
                  │                                                │              │              │
   04 Report (Risk Index: 85/60/35/15/5)                           └──────────────┼──────────────┘
      Exports: JSON | SARIF | Markdown                                            ▼
      Guarantee: 0 Uploaded Files Executed                                     [Echo] (Egress/Dest Check)
                                                                                  │
                                                                                  ▼
                                                                               [Flow] (Policy Decision)
                                                                       ALLOW  |  BLOCK  |  HUMAN REVIEW
```

### 1. The Five Specialist Agents
1. **Cut (Access Boundaries & RBAC)**:
   - Enforces user/agent identity roles (`guest`, `engineer`, `admin`) and least-privilege tool execution boundaries.
   - Blocks unauthorized tool schemas before invocation (e.g. Guests cannot execute write, delete, or system tools).
2. **Hue (Prompt & Instruction Checks)**:
   - Detects adversarial prompt injection, jailbreaks (`DAN mode`, system prompt overrides).
   - **Catches Intent Laundering**: Even if the tool name is safe (e.g. `document_search`), if the prompt contains destructive intent (`"delete database production_users"`), **Cut** and **Hue** catch the mismatch and block deterministically.
3. **Nova (Sensitive Data & Secrets)**:
   - High-throughput DLP engine scanning for AWS/GCP keys, cryptographic private keys, JWT/Bearer tokens, and PII (SSN, credit cards).
   - Auto-redacts all sensitive evidence in trace outputs (`[REDACTED]`, `[REDACTED_SECRET]`).
4. **Echo (Destinations & Data Egress)**:
   - Validates destination URLs and network egress boundaries against allowlists.
   - Terminates SSRF attempts targeting cloud metadata (`169.254.169.254`) and unauthorized exfiltration tunnels (`webhook.site`, `ngrok.io`, `pipedream.net`).
5. **Flow (Human Review & Approvals)**:
   - Manages the Human-in-the-Loop (HITL) review queue when actions trigger a `REVIEW` state.
   - Generates tamper-proof cryptographic SHA fingerprints and immutable audit records for sign-off.

---

## 🔍 Dual-Checkpoint Pipeline

### Checkpoint 1: Artifact Review Pipeline
- **01 Upload**: Validates payload integrity, 10MB limit, and 21 registered extensions (`.txt`, `.md`, `.json`, `.yaml`, `.py`, `.js`, `.ts`, `.env`, `.sh`, `.sql`, `.csv`, `.xml`, `.html`, `.dockerfile`, `.toml`, `.ini`, `.log`, `.pem`, `.crt`, `.pdf` [experimental], `package-lock.json` [experimental]).
- **02 Extract**: Decodes safe text strictly in memory without executing code (**0 Uploaded Files Executed Guarantee**). Explicitly labels coverage: `FULL`, `PARTIAL`, `EXPERIMENTAL`, `UNSUPPORTED`.
- **03 Inspect**: Executes 7 deterministic local AST baseline rules + Optional Server-Side Gemini API review (fails gracefully to `SKIPPED` or `FAILED` without crashing or mocking fake passes; never sends confidential data unless explicit opt-in toggle is checked).
- **04 Report**: Outputs redacted evidence, prescribed remediations, Risk Index score, and one-click exports in **JSON**, **SARIF (v2.1.0)**, and **Markdown**.

### Checkpoint 2: Action Gateway Simulator
- Interactive simulator taking `Caller Identity (Guest / Engineer / Admin)`, `Raw User Intent`, `Proposed Tool Schema & Arguments (JSON)`, and `Target Destination URL`.
- Intercepts Intent Laundering, metadata SSRF, and credential harvesting in real-time.
- Interactive **Flow Human-in-the-Loop (HITL)** approval modal allowing reviewers to confirm approval or reject actions with reasons.

---

## 📐 Risk Index Mathematical Formula

Base severity weights:
- **Critical** = 85
- **High** = 60
- **Medium** = 35
- **Low** = 15
- **Info** = 5

Each finding is calculated as $w_i = \text{severity}_i \times \text{confidence}_i$ ($0.0 \le \text{confidence} \le 1.0$).
Findings are combined using diminishing returns:
$$\text{RiskIndex} = \text{round}\left(100 \times \left(1 - \prod_{i} \left(1 - \frac{w_i}{100}\right)\right)\right) \quad (\text{capped at 100})$$

> **Mandatory UI Disclaimer**: *"The score prioritizes review. It is not a probability of breach. Skipped or unsupported checks remain unknown."*

---

## 🧪 Test Suite & Verified Build Lessons

All 3 Build Lessons from Page 7 of the specification are tested and verified across **20 automated Vitest unit & E2E tests**:

```bash
# Run the test suite
npm test
```

### Verified Build Lessons:
1. **Build Lesson 01 (Demo file != a real upload)**:
   - Enforces 21 registered formats, size boundaries, safe static decoding, zero executed files count, and `EXPERIMENTAL` tagging for PDFs/lockfiles.
2. **Build Lesson 02 (A key in a local file != a live review)**:
   - Graceful resilience: missing Gemini API key or quota failure returns explicit `SKIPPED` / `FAILED` rather than crashing or faking passes. Evidence is strictly auto-redacted (`AWS_SECRET_ACCESS_KEY=[REDACTED]`).
3. **Build Lesson 03 (A safe tool name can hide a dangerous request)**:
   - Caught **Intent Laundering**: A guest user laundering `"delete database production_users immediately"` through a benign `"document_search"` tool is deterministically BLOCKED by **Cut** and **Hue**.

---

## 🚀 Running the Prototype Locally

```bash
# 1. Install dependencies
npm install

# 2. Run automated tests
npm test

# 3. Build production bundle
npm run build

# 4. Start production server
npm start
# Visit http://localhost:3000
```

