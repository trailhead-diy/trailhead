#!/bin/bash
# Run theme persistence tests for rwsdk

echo "Running theme persistence tests..."
cd ../../../
./node_modules/.bin/vitest --run "apps/demos/rwsdk/src/app/components/theme/__tests__"