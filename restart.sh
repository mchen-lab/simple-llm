

# restart.sh - Local development script for simple-llm

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(dirname "$PROJECT_ROOT")"

# Source venv if exists
if [ -f "$WORKSPACE_ROOT/.venv/bin/activate" ]; then
    source "$WORKSPACE_ROOT/.venv/bin/activate"
fi

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local process_name=$2
    local pids=$(lsof -ti :$port -sTCP:LISTEN 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        echo "Found existing $process_name (PIDs:$pids) on port $port. Killing..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
}

echo "🛑 Stopping existing services..."
kill_port 31161 "Backend"
kill_port 31160 "Frontend"

echo "🚀 Starting Simple-LLM (Dev Mode)..."

# Ensure log dir
mkdir -p "$PROJECT_ROOT/logs"

# Start Backend
echo "   Starting Backend (uvicorn)..."
cd "$PROJECT_ROOT"
# Using nohup/background effectively controlled by this script
uvicorn main:app --reload --host 0.0.0.0 --port 31161 > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# Start Frontend
echo "   Starting Frontend (vite)..."
cd "$PROJECT_ROOT/frontend"
npm run dev -- --port 31160 --host > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

echo "✅ Dev environment started!"
echo "   Frontend: http://localhost:31160"
echo "   Backend:  http://localhost:31161"
echo "   Logs:     $PROJECT_ROOT/logs/"

cleanup() {
    echo "🛑 Cleaning up..."
    # We kill the specific PIDs we started
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap exit signals to ensure we kill children
trap cleanup INT TERM EXIT

# Wait for children
wait
