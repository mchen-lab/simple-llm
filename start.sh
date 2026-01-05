#!/bin/bash
# Start both frontend and backend services

# Start backend API on port 31161
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 31161 &

# Start frontend static server on port 31160
cd /app/frontend/dist
npx serve -s . -l 31160 &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
