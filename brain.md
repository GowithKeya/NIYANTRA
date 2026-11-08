# 🧠 NIYANTRA PROJECT BRAIN & GOVERNANCE TRACKER
**Project**: NIYANTRA (नियन्त्र) — AI Security Checkpoint & Action Governance Prototype  
**Current Milestone**: Core Prototype & Test Suite 100% Operational  
**Last Updated**: 2026-11-05  

---

## 🎯 Project Mission & Problem Statement
Autonomous AI agents are shifting from read-only conversational assistants to real-world operational actors with tool-calling capabilities. Traditional guardrails focus on text generation rather than runtime execution. 

**NIYANTRA** establishes a strict pre-flight execution boundary:
- Inspecting artifacts before deployment (**0 Uploaded Files Executed Guarantee**).
- Intercepting proposed agent tool calls against **identity, raw user prompt intent, data sensitivity, and network egress destination** before execution (**Allow / Block / Review**).
- Catching **Intent Laundering** where malicious instructions are masked inside benign tool schemas.

---

## 🧭 Architecture & The Five Specialist Agents Matrix

| Specialist Agent | Core Responsibility | Implemented Logic | Status |
| :--- | :--- | :--- | :---: |
| **Cut** | Access Boundaries & RBAC | Enforces least-privilege tool schemas by role (`guest`, `engineer`, `admin`). Prevents unauthorized tool calls and privilege escalation. | ✅ Complete |
| **Hue** | Prompt Checks & Intent Laundering | Detects prompt injection (`DAN mode`, jailbreaks, system prompt overrides). Cross-references raw user intent against tool arguments to catch Intent Laundering. | ✅ Complete |
| **Nova** | Sensitive Data & Secrets DLP | Scans payloads for 7 baseline pattern types (AWS/GCP keys, private keys, JWT/Bearer tokens, PII). Automatically redacts evidence in all reports (`[REDACTED]`). | ✅ Complete |
| **Echo** | Destinations & Network Egress | Validates outbound destinations against allowlists. Deterministically blocks cloud metadata SSRF (`169.254.169.254`) and unauthorized exfiltration tunnels (`webhook.site`, `ngrok.io`). | ✅ Complete |
| **Flow** | Human Review & Approvals | Manages the Human-in-the-Loop (HITL) review queue when actions trigger a `REVIEW` state. Generates tamper-proof cryptographic SHA fingerprints and immutable audit logs. | ✅ Complete |

---

## ✅ Completed Deliverables (What Has Been Done)

### 1. Checkpoint 1: Artifact Review Pipeline
- [x] **File Registry & Safety Limits** ([`src/lib/scanner/file-registry.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/scanner/file-registry.ts)):
  - Registered **21 inspectable file formats** (`.txt`, `.md`, `.json`, `.yaml`, `.py`, `.js`, `.ts`, `.env`, `.sh`, `.sql`, `.csv`, `.xml`, `.html`, `.dockerfile`, `.toml`, `.ini`, `.log`, `.pem`, `.crt`, `.pdf` [exp], `package-lock.json` [exp]).
  - 10MB safety ceiling with strict non-executable in-memory decoding.
  - Explicit coverage status labeling: `FULL`, `PARTIAL`, `EXPERIMENTAL`, `UNSUPPORTED`.
- [x] **7 Deterministic AST Baseline Rules** ([`src/lib/scanner/artifact-engine.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/scanner/artifact-engine.ts)):
  - AWS & GCP API Keys (`AKIA...`, GCP `AIza...`, Secret Key assignments)
  - Cryptographic Private Keys (`BEGIN RSA/OPENSSH/PGP PRIVATE KEY`)
  - Destructive SQL/Shell (`DROP TABLE`, `TRUNCATE`, `rm -rf /`, fork bombs)
  - Prompt Injection markers (`ignore previous instructions`, `DAN mode`, overrides)
  - Hardcoded JWT & Bearer Tokens (`eyJ...`, `Bearer ...`)
  - Internal IP / Cloud Metadata SSRF (`169.254.169.254`, RFC 1918) & Exfiltration webhooks (`webhook.site`, `ngrok.io`)
  - PII Patterns (US SSN `\d{3}-\d{2}-\d{4}`, credit cards, password variables)
- [x] **Automatic Redaction Engine**:
  - Replaces all sensitive strings in findings and clean text output with `[REDACTED]` or `[REDACTED_SECRET]`.
- [x] **Resilient Gemini Inspection** ([`src/lib/scanner/gemini-inspector.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/scanner/gemini-inspector.ts)):
  - Strict opt-in toggle (zero outbound telemetry unless explicitly requested).
  - Handles missing keys, quota limits (429), or network drops by gracefully returning `SKIPPED` or `FAILED` without crashing or mocking fake passes.
- [x] **Compliance & Report Exporter** ([`src/lib/scanner/sarif-builder.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/scanner/sarif-builder.ts)):
  - **SARIF v2.1.0** export schema for GitHub / GitLab Code Scanning.
  - Standardized Markdown ticket export.
  - Clean structured JSON output.

### 2. Risk Index Mathematical Engine
- [x] **Diminishing Returns Formula** ([`src/lib/scanner/risk-calculator.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/scanner/risk-calculator.ts)):
  - Weights: `Critical = 85`, `High = 60`, `Medium = 35`, `Low = 15`, `Info = 5`.
  - Finding weight: $w_i = \text{severity}_i \times \text{confidence}_i$.
  - Formula: $\text{RiskIndex} = \text{round}\left(100 \times \left(1 - \prod_{i} \left(1 - \frac{w_i}{100}\right)\right)\right)$ capped at 100.
  - Mandatory UI disclaimer prominently placed:
    > *"The score prioritizes review. It is not a probability of breach. Skipped or unsupported checks remain unknown."*

### 3. Checkpoint 2: Action Gateway Simulator
- [x] **5-Agent Gateway Orchestration** ([`src/lib/agents/gateway.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/agents/gateway.ts)):
  - Coordinates Cut, Hue, Nova, Echo, and Flow in sequence.
  - Intercepts **Intent Laundering** (e.g. `document_search` laundering `DROP TABLE production_users;`).
- [x] **Flow HITL Review & Audit Queue** ([`src/lib/agents/flow-review.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/agents/flow-review.ts)):
  - Generates immutable cryptographic SHA action fingerprints.
  - Interactive approval/rejection modal with immediate state persistence.
- [x] **Synthetic Threat Scenarios** ([`src/lib/fixtures/synthetic-threats.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/lib/fixtures/synthetic-threats.ts)):
  - 1-click test payloads for Intent Laundering, Shadow AI key exfiltration, Cloud Metadata SSRF, Artifact Prompt Injection, and Legitimate Safe Read actions.

### 4. Interactive 3D Landing Page (Three.js)
- [x] **Three.js Orbital Gate Canvas** ([`src/components/canvas/NiyantraCheckpoint3D.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/components/canvas/NiyantraCheckpoint3D.tsx)):
  - `#130924` obsidian cybersecurity aesthetic.
  - Left emitter: 3 geometric streams (`PROMPT` cyan octahedrons, `FILE` violet cubes, `USER` white spheres) moving along Catmull-Rom splines.
  - Center gate: 5 counter-rotating orbital torus rings with live raycasting click-to-isolate agent telemetry.
  - Right splitter: Dynamic particle sorting into **ALLOW** (emerald green), **BLOCK** (deflected red sparks into containment shield), and **REVIEW** (amber holding orbit).
  - Graceful WebGL canvas fallback.
- [x] **Field Evidence Timeline** ([`src/components/landing/FieldEvidenceTimeline.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/components/landing/FieldEvidenceTimeline.tsx)):
  - Real-world milestones: Nov 2025 (OpenAI/Mixpanel), Mar 2026 (Meta internal agent), Jul 2026 (OpenAI evaluation models), Aug 2026 (302.ai 17.6M files bucket).
  - 2026 Survey stats: **54%** AI incident rate, **41%** shadow AI, **37%** AI in attack, **32%** sensitive data leaked.
- [x] **"Different Jobs" Comparison Matrix** ([`src/components/landing/ChatbotVsNiyantra.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/components/landing/ChatbotVsNiyantra.tsx)):
  - Highlighting architectural contrast between general chatbots (*"Help me think"*) and Niyantra (*"Check what an agent may do"*).

### 5. Dual-Checkpoint Workspace UI
- [x] **Dashboard Workspace** ([`src/app/dashboard/page.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/app/dashboard/page.tsx)):
  - Checkpoint 1 (Artifact Scanner) & Checkpoint 2 (Action Gateway Simulator) tab switching.
  - Risk Index radial visualizer ([`RiskIndexGauge.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/components/workbench/RiskIndexGauge.tsx)).
  - Real-time 5-Agent trace breakdown ([`FiveAgentsTrace.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/components/workbench/FiveAgentsTrace.tsx)).
  - Full export previews and downloads ([`ReportExporter.tsx`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/src/components/workbench/ReportExporter.tsx)).

### 6. Full Automated Test Suite (20/20 Passing)
- [x] [`tests/unit/niyantra-core.test.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/tests/unit/niyantra-core.test.ts) (Encoding Build Lessons 01, 02, and 03)
- [x] [`tests/unit/risk-calculator.test.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/tests/unit/risk-calculator.test.ts) (Math & boundary tests)
- [x] [`tests/unit/artifact-coverage.test.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/tests/unit/artifact-coverage.test.ts) (21 extensions & size limits)
- [x] [`tests/unit/intent-laundering.test.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/tests/unit/intent-laundering.test.ts) (Laundering & SSRF vectors)
- [x] [`tests/e2e/niyantra-workflow.spec.ts`](file:///c:/Users/Kartik/OneDrive/Documents/Desktop/JU/NYt/tests/e2e/niyantra-workflow.spec.ts) (End-to-end artifact & gateway flow)

---

## 📋 What Left (Future Production Roadmap)

While the prototype satisfies 100% of the core specification requirements, the following enhancements represent the production rollout phase:

### Phase 1: High-Priority Enterprise Hardening
1. **Persistent Database & KMS Signatures for Audit Ledger**:
   - *Current State*: In-memory store during prototype session.
   - *Next Step*: Connect to PostgreSQL / DynamoDB with AWS KMS or HashiCorp Vault digital signatures for cryptographic non-repudiation.
2. **Deep Layout-Aware PDF Parser**:
   - *Current State*: Experimental safe stream ASCII / printable extraction (zero-execution).
   - *Next Step*: Integrate native PDF AST tokenization with font extraction to detect prompt injections hidden in white-on-white text or PDF annotations.
3. **Dynamic Enterprise Allowlist Manager**:
   - *Current State*: Hardcoded corporate domains (`internal://`, `api.internal.company.com`, etc.).
   - *Next Step*: Settings UI enabling SecOps to dynamically configure CIDR blocks, approved S3 buckets, and authorized webhook hosts.

### Phase 2: Live Agent Runtime Integrations
4. **Proxy & Sidecar Middleware Mode (MCP Gateway)**:
   - Wrap Niyantra as a transparent HTTP / SSE / gRPC reverse proxy sitting in front of Model Context Protocol (MCP) servers, LangChain, or CrewAI runtimes.
5. **Streaming Gemini 1.5 Live Telemetry**:
   - Add streaming token-by-token verification for real-time model interaction loops.
6. **Enterprise SSO & OIDC Tokens**:
   - Validate signed JWTs from Okta, Azure AD, or Google Workspace in Cut for verified user roles.

---

## ⚡ Quick Reference Commands

```bash
# Run unit & e2e test suite (20 tests)
npm test

# Build production Next.js bundle
npm run build

# Start live server on port 3000
npm start

# Test raw endpoints directly
curl -X POST http://localhost:3000/api/evaluate-action \
  -H "Content-Type: application/json" \
  -d '{"identity":{"userId":"guest_1","role":"guest"},"originalIntent":"delete db","proposedTool":{"name":"document_search","arguments":{"query":"DROP TABLE users;"}}}'
```

