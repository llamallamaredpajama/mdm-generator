# MDM Generator Test Flow Results

## Test Date: 2025-08-09

## 1. Server Status
- ✅ Backend running on http://localhost:8080
- ✅ Frontend running on http://localhost:5173
- ✅ Health endpoint responding: /healthz

## 2. Manual Testing Required
Please open http://localhost:5173 in your browser and test:

### Authentication Flow:
1. Click "Sign in with Google" on Start page
2. Complete Google OAuth flow
3. Verify redirect to Compose page

### MDM Generation Flow:
1. On Compose page, enter test narrative:
   ```
   47yo male presents with sudden onset chest pain, SOB, and diaphoresis for 2 hours. 
   PMH: HTN, DM2, former smoker. 
   Vitals: BP 150/90, HR 110, RR 22, O2 sat 94% on RA. 
   ECG shows ST elevation in leads II, III, aVF. 
   Troponin elevated at 2.5.
   Started on ASA, nitro, heparin. Cardiology consulted for emergent cath.
   ```

2. Click "Continue to Preflight"
3. Review checklist items
4. Check "No PHI" confirmation
5. Click "Generate MDM"
6. Verify MDM output displays
7. Test "Copy to Clipboard" functionality

### Expected MDM Output Should Include:
- Problem classification (Critical)
- Differential diagnosis (MI, PE, aortic dissection, etc.)
- Data reviewed section
- Clinical reasoning
- MDM complexity level (High)

## 3. API Endpoints to Test
- POST /v1/whoami - User authentication check
- POST /v1/generate - MDM generation

## 4. Test Sample CURL Commands

### Test whoami (requires valid Firebase ID token):
```bash
curl -X POST http://localhost:8080/v1/whoami \
  -H "Content-Type: application/json" \
  -d '{"userIdToken": "YOUR_FIREBASE_ID_TOKEN"}'
```

### Test generate (requires valid token):
```bash
curl -X POST http://localhost:8080/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "narrative": "Test narrative text",
    "userIdToken": "YOUR_FIREBASE_ID_TOKEN"
  }'
```

## Notes:
- Firebase Auth is configured for Google Sign-In
- Backend expects Firebase ID tokens for authentication
- Vertex AI (Gemini) handles MDM generation
- No PHI should be used in testing