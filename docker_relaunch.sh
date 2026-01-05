#!/bin/bash
set -e

TAG="dev"
DELETE_VOLUME=false
CONTAINER_NAME="simple-llm"
UI_PORT=31160
BACKEND_PORT=31161
VOLUME="simple_llm_data"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --delete-volume)
      DELETE_VOLUME=true
      shift
      ;;
    *)
      TAG="$1"
      shift
      ;;
  esac
done

IMAGE="ghcr.io/mchen-lab/simple-llm:$TAG"

echo "=== 🐳 Relaunching Docker Container ($TAG) ==="
echo "Image: $IMAGE"

if [ "$DELETE_VOLUME" = true ]; then
    echo "⚠️  WARNING: You have requested to delete the data volume '$VOLUME'."
    echo "   This will PERMANENTLY ERASE all settings and logs in the container."
    read -p "   Are you sure you want to continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user."
        exit 1
    fi
fi

echo "⬇️  Pulling image..."
docker pull "$IMAGE"

echo "🛑 Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || echo "   (No running container found)"

echo "🗑️  Removing existing container..."
docker rm "$CONTAINER_NAME" 2>/dev/null || echo "   (No container to remove)"

if [ "$DELETE_VOLUME" = true ]; then
    echo "🔥 Deleting volume '$VOLUME'..."
    docker volume rm "$VOLUME" 2>/dev/null || echo "   (Volume did not exist)"
fi

echo "▶️  Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "$UI_PORT:31160" \
  -p "$BACKEND_PORT:31161" \
  -v "$VOLUME:/app/data" \
  "$IMAGE"

echo "✅ Container started!"
echo "   - Web UI: http://localhost:$UI_PORT"
echo "   - API:    http://localhost:$BACKEND_PORT"
echo "   - Tag:    $TAG"
echo "   - Logs:   docker logs -f $CONTAINER_NAME"
