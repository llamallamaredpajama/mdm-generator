#!/bin/bash

# Test Stripe Integration Script
echo "🚀 Testing Stripe Integration..."
echo ""

# Check if tsx is installed
if ! command -v tsx &> /dev/null; then
    echo "Installing tsx..."
    npm install -g tsx
fi

# Load environment variables from frontend
if [ -f "./frontend/.env" ]; then
    export $(cat ./frontend/.env | grep -v '^#' | xargs)
fi

# Run the test script
cd "$(dirname "$0")/.." 
tsx ./scripts/test-stripe-integration.ts