#!/bin/bash
# Install dependencies
npm install

# Compile TypeScript
npx tsc

# Start server (compiled JS)
node dist/server.js