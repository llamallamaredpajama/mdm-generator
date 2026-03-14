.PHONY: e2e e2e-quick e2e-setup e2e-smoke e2e-browser e2e-cleanup

e2e: e2e-setup e2e-smoke e2e-browser  ## Full E2E: setup + API + browser

e2e-quick: e2e-setup  ## Quick E2E: setup + core API only (no LLM calls)
	bash scripts/verify-integration.sh --quick

e2e-setup: e2e-cleanup  ## Mint token + create test encounters (runs cleanup first)
	cd backend && NODE_PATH=./node_modules npx tsx ../scripts/e2e-setup.ts

e2e-smoke:  ## API smoke tests (all tiers)
	bash scripts/verify-integration.sh

e2e-browser:  ## Browser smoke tests
	npx playwright test

e2e-cleanup:  ## Remove E2E test data from Firestore
	cd backend && NODE_PATH=./node_modules npx tsx ../scripts/e2e-cleanup.ts
