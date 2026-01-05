#!/bin/bash

# Build and publish script for simple-llm Docker image
# Supports multi-platform build for amd64 and arm64

set -e  # Exit on any error

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running or not accessible."
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Image names
GHCR_IMAGE="ghcr.io/mchen-lab/simple-llm"
DOCKERHUB_IMAGE="xychenmsn/simple-llm"
TAG="dev"

echo "Checking for Docker Buildx..."
if ! docker buildx inspect simple-llm-builder > /dev/null 2>&1; then
    echo "Creating new buildx builder..."
    docker buildx create --name simple-llm-builder --use
    docker buildx inspect --bootstrap
else
    echo "Using existing buildx builder."
    docker buildx use simple-llm-builder
fi

echo "Building and pushing multi-platform image..."
echo "Platforms: linux/amd64, linux/arm64"
echo "Tags:"
echo "  - $GHCR_IMAGE:$TAG"
echo "  - $DOCKERHUB_IMAGE:$TAG"

# Generate build metadata (e.g. -dev-20251228)
BUILD_META="-dev-$(date +%Y%m%d)"
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "Build Metadata: $BUILD_META"
echo "Commit Hash: $COMMIT_HASH"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg BUILD_METADATA="$BUILD_META" \
  --build-arg GIT_COMMIT="$COMMIT_HASH" \
  -t "$GHCR_IMAGE:$TAG" \
  -t "$DOCKERHUB_IMAGE:$TAG" \
  --push \
  .

echo "Build and publish completed successfully!"
