# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# MDM Generator - AI Assistant Instructions

## Project Overview

MDM Generator is an **educational tool** for Emergency Medicine physicians to generate Medical Decision Making (MDM) documentation from natural language input. It transforms physician narratives into compliant, high-complexity MDM drafts using an EM-specific "worst-first" approach.

**CRITICAL CONSTRAINTS:**
- **Educational use only** - No real patient data
- **No PHI (Protected Health Information)** - Ever
- **No long-term storage** of medical content
- All outputs require physician review before use

## Project Architecture

### Frontend (React + Vite + TypeScript)
- **Location**: `/frontend`
- **Stack**: React 19, Vite, TypeScript, React Router, Firebase Auth
- **Key Routes**: Start → Compose → Preflight → Output → Settings
- **State**: Client-side only for medical content

### Backend (Express + Vertex AI)
- **Location**: `/backend`
- **Stack**: Express, TypeScript, Vertex AI (Gemini), Firebase Admin
- **Purpose**: Validate auth, call LLM, return structured MDM
- **No PHI storage** - Metadata logging only

---

## Development Workflow Framework

### Core Workflow Pattern

**Base Execution Pattern (Apply to ALL Tasks):**
```
Understand → Plan (parallelization analysis) → TodoWrite(3+ tasks) → Execute → Track → Validate
```

**Mandatory Rules:**
- Batch operations ALWAYS parallel by default; sequential ONLY for dependencies
- Validation gates: validate before execution, verify after completion
- Quality checks: run `pnpm check` (frontend) or `pnpm build` (backend) before marking tasks complete
- Context retention: maintain ≥90% understanding across operations
- Evidence-based: all claims verifiable through testing or documentation
- Discovery first: complete project-wide analysis before systematic changes

---

### Task Management (TodoWrite)

#### When to Use TodoWrite

| Condition | Action |
|-----------|--------|
| 3+ steps required | TodoWrite mandatory |
| 2+ directories affected (frontend + backend) | TodoWrite mandatory |
| 3+ files modified | TodoWrite mandatory |
| Quality improvement (polish, refine, enhance) | TodoWrite mandatory |
| Simple single-step task | Skip TodoWrite |

#### TodoWrite Format
```
Todo Structure:
├─ content: Imperative form ("Run tests", "Fix auth bug")
├─ activeForm: Present continuous ("Running tests", "Fixing auth bug")
└─ status: pending | in_progress | completed
```

#### Execution Rules
1. **ONE task in_progress at a time** - never multiple
2. **Mark complete IMMEDIATELY** after finishing - no batching
3. **Keep as in_progress** if blocked, errors, or incomplete
4. **Create new task** for blockers that need resolution
5. **Remove irrelevant tasks** entirely from list

#### Completion Requirements (All Must Be True)
- [ ] Feature fully functional
- [ ] All dependencies implemented
- [ ] Tests passing (if applicable)
- [ ] No partial implementations
- [ ] No unresolved errors

---

### Planning Efficiency

#### Pre-Execution Planning Requirements

Before ANY multi-step execution:
1. **Identify parallelizable operations** - which can run concurrently?
2. **Map dependencies** - which must be sequential?
3. **Plan tool combinations** - optimal MCP server selection
4. **Estimate efficiency gains** - "3 parallel ops = 60% time saving"

#### Planning Template
```
Phase 1: [Parallel]
├─ Read frontend/src/routes/*.tsx (simultaneous)
├─ Read backend/src/*.ts
└─ Context7 lookup for React/Express patterns

Phase 2: [Sequential - depends on Phase 1]
├─ Analyze findings
└─ Design transformation strategy

Phase 3: [Parallel]
├─ Edit frontend files (batch or simultaneous)
├─ Edit backend files
└─ Update tests
```

#### Anti-Pattern (NEVER DO THIS)
```
❌ Read file1 → Read file2 → Read file3 → analyze → edit file1 → edit file2
```

---

### Parallelization Strategy

#### Auto-Parallel Triggers

| Condition | Action |
|-----------|--------|
| 3+ files to read | Batch Read calls |
| Independent operations | Run in parallel |
| Multi-directory scope (frontend + backend) | Enable delegation |
| Different tool types | Execute simultaneously |

#### Tool Parallelization Matrix

| Operation Type | Parallel Approach |
|---------------|-------------------|
| File reads | Single call with multiple paths |
| Grep searches | Batch multiple patterns |
| Multi-file edits | MultiEdit or Morphllm batch |
| Analysis + Documentation | Sequential + Context7 simultaneously |
| UI + API generation | Magic + native Edit simultaneously |

#### Sequential-Only Conditions
- Output of operation A is input to operation B
- State must be verified before proceeding
- Results determine next operation
- Rollback capability required between steps

---

### Tool Selection Framework

#### Selection Hierarchy
```
MCP Servers > Native Tools > Basic Tools
```

#### MCP Server Selection Matrix

| Task Type | Primary Tool | Triggers | Alternative |
|-----------|-------------|----------|-------------|
| UI Components | Magic MCP | /ui, /21, button, form, modal | Manual coding |
| Library Docs | Context7 MCP | import, require, framework questions | Native knowledge |
| Pattern Edits | Morphllm MCP | Multi-file style enforcement, bulk replace | Individual Edits |
| Symbol Operations | Serena MCP | Rename everywhere, find references | Manual search |
| Complex Analysis | Sequential MCP | Root cause, architecture, 3+ components | Native reasoning |
| Browser Testing | Playwright MCP | E2E, user flows, visual validation | Unit tests |

#### Tool Selection Decision Tree
```
What type of task?
│
├─ Code SEARCH/NAVIGATION?
│  ├─ Symbol operations → Serena MCP
│  ├─ Text patterns → Grep tool
│  └─ File patterns → Glob tool
│
├─ Code ANALYSIS/DESIGN?
│  ├─ Simple explanation → Native Claude
│  ├─ Complex/multi-component → Sequential MCP
│  ├─ Architecture/system design → Sequential MCP
│  └─ Need official patterns → Context7 MCP
│
├─ Code GENERATION/EDITING?
│  ├─ UI components → Magic MCP
│  ├─ Multi-file pattern (>3 files) → Morphllm MCP
│  ├─ Single/few files → Native Edit
│  └─ Framework-specific → Context7 first
│
├─ TESTING/VALIDATION?
│  ├─ E2E/browser → Playwright MCP
│  ├─ Unit/integration → pnpm test
│  └─ Visual/accessibility → Playwright MCP
│
└─ SESSION MANAGEMENT?
   ├─ Load/save context → Serena MCP
   └─ Symbol understanding → Serena MCP
```

---

### Implementation Completeness

#### Non-Negotiable Rules

| Rule | Description |
|------|-------------|
| No Partial Features | If you start, you MUST complete to working state |
| No TODO Comments | Never leave TODO for core functionality |
| No Mock Objects | No placeholders, fake data, or stubs |
| No Incomplete Functions | Every function must work as specified |
| Real Code Only | All code must be production-ready |

#### Before Marking Complete Checklist
- [ ] Feature fully functional
- [ ] All edge cases handled
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] No TODO comments in new code
- [ ] Lint/typecheck passing (`pnpm check`)

---

### Scope Discipline

#### Build ONLY What's Asked

| Do | Don't |
|----|-------|
| MVP first, iterate on feedback | Add features beyond requirements |
| Single responsibility per component | Build "just in case" functionality |
| Simple solutions that can evolve | Over-engineer for hypotheticals |
| Match explicit requirements | Add auth, deployment, monitoring unless asked |

#### Scope Decision Flow
```
New feature request?
├─ Scope clear? → NO → Ask clarifying questions first
├─ >3 steps? → YES → TodoWrite required
├─ Patterns exist? → YES → Follow exactly
└─ Build ONLY the requirement, nothing more
```

---

### File Organization

#### Placement Rules

| File Type | Location |
|-----------|----------|
| Frontend tests | `frontend/src/__tests__/` |
| Backend tests | `backend/src/__tests__/` (if created) |
| Test fixtures | `frontend/src/__fixtures__/` |
| Scripts | `scripts/` |
| Documentation | `docs/` |
| Claude reports/analysis | `claudedocs/` |
| Configuration | Project root |

#### Anti-Patterns (NEVER)
- Don't scatter test files randomly in source tree
- Don't create scripts in random locations
- Don't leave temporary files after completion
- Don't mix configuration file types

---

### Quality Gates

#### Pre-Commit Validation
```bash
# Frontend
cd frontend && pnpm check     # typecheck + lint + test

# Backend
cd backend && pnpm build      # TypeScript compilation

# Review
git diff                      # Review for PHI/security issues
```

#### Before Marking Task Complete
1. All new code linted
2. Type checking passes
3. Relevant tests pass
4. No console.log/debug statements left
5. No TODO comments in new code
6. Error handling in place
7. **No PHI in code, comments, or logs**

---

### Workspace Hygiene

#### Clean After Every Operation
- Remove temporary files, scripts, directories
- Delete build artifacts and logs
- Clean debugging outputs
- Remove unused files before session end

#### Session End Checklist
- [ ] Temporary files removed
- [ ] No debug statements in code
- [ ] Git status clean (or intentionally staged)
- [ ] Session state saved (if using Serena)

---

### Failure Investigation

#### When Errors Occur (CRITICAL)

| Do | Don't |
|----|-------|
| Investigate root cause | Skip to workaround |
| Debug systematically | Disable failing tests |
| Fix underlying issue | Comment out validation |
| Verify fix works | Assume fix worked |

#### Investigation Pattern
```
Error occurs?
├─ Read error message carefully
├─ Understand what failed and why
├─ Identify root cause (not just symptom)
├─ Fix the underlying issue
├─ Verify fix with test
└─ Document if pattern might recur
```

---

### Session Lifecycle

#### Checkpoint Pattern
```
/sc:load → Work → Checkpoint (30min) → /sc:save
```

#### Checkpoint Triggers
- Task completion
- 30-minute intervals
- Before risky operations
- State should be preserved

#### Memory Schema (if using Serena)
```
plan_[timestamp]         : Overall goal statement
phase_[1-5]             : Major milestone descriptions
task_[phase].[number]   : Specific deliverable status
checkpoint_[timestamp]  : Current state snapshot
blockers                : Active impediments
decisions               : Key architectural choices
```

---

### MCP Tool Chaining Workflows

#### UI Feature Implementation
```
1. DESIGN (Sequential) - Analyze requirements, plan components
2. BUILD (Magic) - Generate UI from patterns
3. INTEGRATE (Context7) - Verify React/framework patterns
4. TEST (Playwright) - Validate behavior and accessibility
```

#### Bulk Code Transformation
```
1. ANALYZE (Serena) - Map symbols, track dependencies
2. PLAN (Sequential) - Design transformation strategy
3. EXECUTE (Morphllm) - Apply bulk pattern edits
4. VALIDATE (Sequential) - Verify completeness
```

#### Complex Bug Investigation
```
1. ANALYZE (Sequential) - Decompose, hypothesize, test
2. SEARCH (Serena) - Find implementations, trace paths
3. REFERENCE (Context7) - Check patterns, best practices
4. VALIDATE (Playwright) - Test fix works
```

---

### Resource Management

#### Green Zone (0-75% Context Usage)
- Full MCP access
- Parallel execution (3+ concurrent)
- Deep analysis available
- Large batch operations OK

#### Yellow Zone (75-85%)
- High-priority operations only
- Reduced verbosity
- Defer non-critical tasks
- Focus on critical path

#### Red Zone (85%+)
- Essential operations only
- Minimal output
- Sequential execution
- Checkpoint before continuing

---

### Quick Reference Card

#### Rule Priority

| Priority | Type | Examples |
|----------|------|----------|
| 🔴 CRITICAL | Never compromise | Git safety, root cause analysis, security, **no PHI** |
| 🟡 IMPORTANT | Strong preference | TodoWrite, completeness, scope discipline |
| 🟢 RECOMMENDED | When practical | Parallelization, tool optimization |

#### Common Workflow Triggers

| Condition | Action |
|-----------|--------|
| 3+ steps | TodoWrite + planning |
| 3+ files | Batch operations |
| Pattern across files | Morphllm |
| Symbol operations | Serena |
| UI components | Magic |
| Complex analysis | Sequential |
| Browser testing | Playwright |
| Framework docs | Context7 |

#### Pre-Action Checklist
- [ ] Git status checked
- [ ] Branch is feature/* (not main)
- [ ] Scope is clear
- [ ] TodoWrite created (if 3+ steps)
- [ ] Parallelization planned
- [ ] Tools selected
- [ ] **PHI check: no patient data**

---

## Development Setup

### Prerequisites
- Node.js 18+ and pnpm
- Firebase project configured
- Google Cloud project with Vertex AI enabled

### Quick Start
```bash
# Install dependencies
cd frontend && pnpm install
cd ../backend && pnpm install

# Run development servers
cd frontend && pnpm dev    # Frontend on :5173
cd backend && pnpm dev     # Backend on :8080
```

## Key Commands

### Frontend Commands
```bash
cd frontend
pnpm dev          # Start dev server on :5173
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix lint issues automatically
pnpm typecheck    # TypeScript type checking
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm format       # Format code with Prettier
pnpm check        # Full validation (typecheck + lint + test)
pnpm preview      # Preview production build locally
```

### Backend Commands
```bash
cd backend
pnpm dev          # Start dev server with hot reload (tsx watch)
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run production build from dist/
```

## Critical Files & Patterns

### Medical Logic
- **Dictation Guide**: `docs/mdm-gen-guide.md` - Core prompting logic
- **PRD**: `docs/prd.md` - Product requirements and constraints
- **Prompt Builder**: `backend/src/promptBuilder.ts` - LLM prompt construction
- **Output Schema**: `backend/src/outputSchema.ts` - MDM structure validation

### Components
- **DictationGuide**: Shows inline guidance for physicians
- **Checklist**: Pre-submission PHI verification
- **Output**: Formatted MDM display with copy functionality

### Security Patterns
```typescript
// Always validate auth tokens
const idToken = req.headers.authorization?.split('Bearer ')[1];
const decodedToken = await admin.auth().verifyIdToken(idToken);

// Never log medical content
console.log('Request processed', { userId, timestamp }); // OK
console.log('MDM content', mdmText); // NEVER DO THIS

// Environment variables only
const API_KEY = process.env.VERTEX_API_KEY; // Never hardcode
```

### API Route Pattern (Security-First Template)

Every Express API route MUST follow this 6-step pattern:

```typescript
router.post('/v1/endpoint', async (req: Request, res: Response) => {
  try {
    // 1. AUTHENTICATE - Require valid Firebase token
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // 2. VALIDATE - Parse and validate request body
    const { narrative } = req.body;
    if (!narrative || typeof narrative !== 'string') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // 3. AUTHORIZE - Verify user permissions/subscription
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(403).json({ error: 'User not found' });

    // 4. EXECUTE - Perform the core operation
    const result = await performOperation(narrative);

    // 5. AUDIT - Log action (NEVER log PHI/medical content!)
    console.log({ userId, timestamp: new Date().toISOString(), action: 'operation' });

    // 6. RESPOND - Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('API error', { error: error.message, timestamp: new Date().toISOString() });
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### Error Handling Matrix

| Error Type | HTTP Status | When to Use |
|-----------|-------------|------------|
| AuthError | 401 | Missing or invalid Firebase token |
| ForbiddenError | 403 | User lacks permission or subscription |
| NotFoundError | 404 | Resource doesn't exist |
| ValidationError | 400 | Invalid request data |
| RateLimitError | 429 | Too many requests |

#### Error Message Rules (🔴 CRITICAL)

Error messages must NEVER include:
- Stack traces in production
- Database query details
- Medical/PHI content
- Internal system paths

## MDM-Specific Requirements

### Differential Diagnosis Approach
- **Worst-first mentality**: Always consider life-threatening conditions first
- **EM-specific**: Tailored to Emergency Medicine practice patterns
- **Classification system**: Use proper problem classification (see guide)

### Output Format
- Must be **copy-pastable** without formatting issues
- Include all required MDM sections
- Explicit defaults for missing information
- Clear review warnings

### Input Handling
```typescript
// Pre-submission checks
- Confirm no PHI checkbox
- Token estimation
- Subscription validation
- Size/rate limiting
```

## Testing & Validation

### Running Tests
```bash
# Frontend - Run all tests
cd frontend && pnpm test

# Frontend - Run tests in watch mode
cd frontend && pnpm test:watch

# Frontend - Run a single test file
cd frontend && pnpm test src/__tests__/app.test.tsx
```

### Before Commits
```bash
# Frontend - Full validation suite
cd frontend && pnpm check  # Runs typecheck, lint, and tests

# Backend - TypeScript compilation
cd backend && pnpm build   # Ensures TypeScript compilation

# Both
git diff  # Review all changes for PHI/security issues
```

### Test Patterns
- Component tests in `frontend/src/__tests__/`
- Use existing test patterns (React Testing Library)
- Mock Firebase services in tests
- Never use real medical data in tests

## Common Tasks

### Adding a New Route
1. Create component in `frontend/src/routes/`
2. Add to router configuration
3. Follow existing route patterns (Layout wrapper)

### Modifying MDM Output
1. Update `backend/src/outputSchema.ts` for structure
2. Modify `backend/src/promptBuilder.ts` for generation
3. Update frontend display in `Output.tsx`

### Updating Dependencies
```bash
# Use pnpm for consistency
cd frontend && pnpm update
cd backend && pnpm update
```

## Environment Variables

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_API_BASE_URL=http://localhost:8080  # Backend URL
```

### Backend (.env)
```env
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=  # Service account key path
PROJECT_ID=                      # GCP project ID
VERTEX_LOCATION=us-central1      # Vertex AI location
```

### Stripe Configuration (.envrc - using direnv)
This project uses [direnv](https://direnv.net/) for managing Stripe credentials securely:
```env
export STRIPE_SECRET_KEY="sk_test_..."      # Stripe secret key (test mode)
export STRIPE_PUBLISHABLE_KEY="pk_test_..." # Stripe publishable key (test mode)
export STRIPE_WEBHOOK_SECRET="whsec_..."    # Webhook endpoint secret
```

**Note**: The `.envrc` file is loaded automatically when entering the project directory if direnv is installed and allowed (`direnv allow`)

### Production Secrets Management

**IMPORTANT**: Never commit real credentials to the repository. Use the following approaches:

#### Local Development
1. Copy `backend/.env.example` to `backend/.env`
2. Fill in your actual credentials
3. Use `direnv` for Stripe keys (`.envrc`)
4. Both files are in `.gitignore`

#### Cloud Run Deployment
Use GCP Secret Manager for production secrets:
```bash
# Create secrets
gcloud secrets create firebase-sa-key --data-file=service-account.json
gcloud secrets create stripe-secret-key --data-file=-  # paste key, Ctrl+D

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding firebase-sa-key \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Deploy with secrets mounted as environment variables
gcloud run deploy mdm-backend \
  --set-secrets="GOOGLE_APPLICATION_CREDENTIALS_JSON=firebase-sa-key:latest" \
  --set-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest"
```

#### Required Production Environment Variables
| Variable | Description | Source |
|----------|-------------|--------|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Firebase SA key (JSON string) | Secret Manager |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Secret Manager |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Secret Manager |
| `PROJECT_ID` | GCP project ID | Cloud Run automatic |
| `FRONTEND_URL` | Production frontend URL for CORS | Environment variable |
| `PORT` | Server port (default 8080) | Cloud Run automatic |

## Security Checklist

- [ ] No PHI in code, comments, or logs
- [ ] All API keys in environment variables
- [ ] Firebase Auth token validation on all API calls
- [ ] Input sanitization and size limits
- [ ] No medical content persistence
- [ ] HTTPS only in production
- [ ] Rate limiting implemented

## Error Handling

### User-Facing Errors
```typescript
// Provide helpful, non-technical messages
throw new Error('Unable to generate MDM. Please try again.');
// Not: "Vertex AI API call failed with 503"
```

### Logging
```typescript
// Log technical details for debugging
console.error('Vertex API error', { 
  error: error.message,
  userId,
  timestamp,
  // Never include: patientData, mdmContent, narrative
});
```

## Git Workflow

### Session Start (ALWAYS - First Command Every Session)
```bash
git status && git branch
```

### Git Safety Rules (🔴 CRITICAL)
1. **NEVER** work directly on main/master
2. **ALWAYS** `git diff` before committing
3. **CREATE** restore points before risky operations
4. **VERIFY** `.gitignore` includes sensitive patterns
5. **CHECK** `git status` before every commit
6. **ASK** if unsure whether file is safe to commit (especially for PHI concerns)

### Branch Strategy
```
main                    # Production - never work directly here
└── feature/*           # All development work
    └── fix/*           # Bug fixes
    └── docs/*          # Documentation only
    └── refactor/*      # Code refactoring
```

### Feature Branch Workflow
```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Code, commit, test

# 4. Merge back (solo developer)
git checkout main
git merge feature/my-feature
git push origin main

# 5. Cleanup
git branch -d feature/my-feature
```

### Commit Messages
```bash
# Good - descriptive, references context
git commit -m "Add PHI detection to preflight check"
git commit -m "Fix token counting for long narratives"

# Bad - vague, no context
git commit -m "Updates"
git commit -m "Fixed stuff"
```

### Pre-Push Checklist
1. Run `pnpm check` in frontend
2. Run `pnpm build` in backend
3. Review for PHI/security issues (`git diff`)
4. Update tests if logic changed
5. Verify no sensitive data in commits

## API Endpoints

### Backend Endpoints
- **GET /healthz** - Health check endpoint
- **POST /v1/whoami** - Validate user authentication and get user info
  - Requires: `userIdToken` (Firebase ID token)
- **POST /v1/generate** - Generate MDM from narrative
  - Requires: `narrative` (string), `userIdToken` (Firebase ID token)
  - Returns: Structured MDM response

### API Response Structure
The `/v1/generate` endpoint returns MDM data structured according to `backend/src/outputSchema.ts`, including:
- Problem classifications
- Differential diagnoses
- Data reviewed
- Clinical reasoning
- MDM complexity level

## Router Configuration

### Frontend Routes (React Router)
All routes are wrapped in the `Layout` component and require authentication:
- `/` - Start page (landing/login)
- `/compose` - Narrative input
- `/preflight` - Pre-submission checklist
- `/output` - MDM display and copy
- `/settings` - User settings and subscription

## Stripe Payment Integration

### Overview
The project uses Firebase Stripe Extension for subscription management. This provides secure payment processing without handling sensitive payment data directly.

### Architecture
1. **Firebase Stripe Extension** - Installed in Firebase project (test mode)
2. **Firestore Collections** - Managed by extension:
   - `customers/{uid}` - Customer records linked to Stripe
   - `customers/{uid}/checkout_sessions` - Payment session management
   - `customers/{uid}/subscriptions` - Active subscriptions
   - `products` - Stripe products synced from dashboard
   - `prices` - Pricing information for products
3. **No Direct API Calls** - Frontend only writes to Firestore; extension handles Stripe API

### Subscription Tiers
- **Free**: 10 MDMs/month, basic features
- **Pro**: 250 MDMs/month, priority processing, export formats
- **Enterprise**: 1000 MDMs/month, API access, team features

### Payment Flow
1. User selects plan → Creates checkout session document
2. Extension generates Stripe checkout URL
3. User redirected to Stripe-hosted payment page
4. Stripe webhooks update subscription status
5. Backend enforces usage limits based on plan

### Key Files
- `frontend/src/lib/stripe.ts` - Stripe helper functions
- `frontend/src/hooks/useSubscription.ts` - Subscription state management
- `frontend/src/components/PricingPlans.tsx` - Plan selection UI
- `backend/src/services/userService.ts` - Usage tracking and plan features

## Deployment Notes

- Frontend: Deploy to Firebase Hosting or similar CDN
- Backend: Cloud Run with proper secrets management
- Use API Gateway for rate limiting and auth
- Enable CORS for production domains only
- Monitor token usage and costs
- Firebase configuration in `firebase.json` for Firestore rules and indexes

## Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Firebase Auth Setup](https://firebase.google.com/docs/auth)
- [EM Documentation Standards](docs/mdm-gen-guide.md)
- [Product Requirements](docs/prd.md)

## Important Reminders

1. **This is a medical tool** - Accuracy and safety are paramount
2. **No PHI ever** - This is non-negotiable
3. **Educational only** - Always display appropriate disclaimers
4. **Physician review required** - Never suggest automated clinical decisions
5. **EM-specific** - Maintain worst-first differential approach

## Support & Questions

For questions about:
- Medical logic: Review `docs/mdm-gen-guide.md`
- Product features: Check `docs/prd.md`
- Technical implementation: Follow existing patterns in codebase