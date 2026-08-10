#!/bin/bash
set -e
cd /app

# Start vite preview server in background
npx vite preview --host 0.0.0.0 --port 4173 &
VITE_PID=$!
sleep 3

# Run the smoke test
npx playwright test e2e/smoke.spec.ts --reporter=line 2>&1
EXIT_CODE=$?

# Kill the server
kill $VITE_PID 2>/dev/null
exit $EXIT_CODE