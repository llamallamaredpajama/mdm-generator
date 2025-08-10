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
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix lint issues
pnpm typecheck    # TypeScript check
pnpm test         # Run tests
pnpm format       # Format with Prettier
pnpm check        # Full validation (typecheck + lint + test)
```

### Backend Commands
```bash
cd backend
pnpm dev          # Start dev server with hot reload
pnpm build        # Build for production
pnpm start        # Run production build
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

### Before Commits
```bash
# Frontend
cd frontend && pnpm check  # Runs typecheck, lint, and tests

# Backend
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

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring

### Commit Messages
```bash
# Good
git commit -m "Add PHI detection to preflight check"
git commit -m "Fix token counting for long narratives"

# Bad
git commit -m "Updates"
git commit -m "Fixed stuff"
```

### Pre-Push Checklist
1. Run `pnpm check` in frontend
2. Run `pnpm build` in backend
3. Review for PHI/security issues
4. Update tests if logic changed

## Deployment Notes

- Frontend: Deploy to Firebase Hosting or similar CDN
- Backend: Cloud Run with proper secrets management
- Use API Gateway for rate limiting and auth
- Enable CORS for production domains only
- Monitor token usage and costs

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