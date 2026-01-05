# Simple LLM

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

A minimal, self-hosted LLM request logger and testing dashboard. Designed to provide transparent monitoring of your AI interactions with support for structured JSON generation.

## why Simple LLM?

1.  **Observability & Debugging**: Keep a persistent history of every prompt, response, and metadata (token usage, duration) in a local SQLite database.
2.  **Structured Output Testing**: Easily test and verify `gen_dict` (structured JSON) outputs with custom JSON schemas directly from the UI.
3.  **Local First**: Your API keys and logs are stored locally, giving you full control over your data.
4.  **Multi-Provider**: Unified interface for OpenRouter (cloud) and Ollama (local) with easy provider-based configuration.

## Quick Start

Run the application using Docker:

```bash
docker run -d \
  --name simple-llm \
  -p 31160:31160 \
  -v simple_llm_data:/app/data \
  ghcr.io/mchen-lab/simple-llm:latest
```

> **Note:** You can also use the Docker Hub image: `docker.io/xychenmsn/simple-llm:latest`

Navigate to [http://localhost:31160](http://localhost:31160) to access the dashboard.

## Features

### Core Functionality
- 📝 **Request Logging**: Automatically capture prompts, responses, and token stats.
- 🧪 **Chat Test**: Interactive playground to test prompts with different models and formats.
- 📊 **Structured JSON**: Support for `gen_dict` mode with schema validation.
- 🏷️ **Smart Tagging**: Organize logs with custom tags for post-run analysis.
- 🧹 **Log Management**: Built-in tools to purge old logs or lock important entries.

### Configuration
- 🔐 **Provider Management**: Organize API keys and base URLs by provider (OpenRouter, Ollama).
- 👁️ **API Key Visibility**: Securely manage keys with toggleable password visibility.
- 🔄 **Dynamic Models**: Configure your favorite models in the settings to populate the chat dropdown.

### UI/UX
- 🌙 **Modern Design**: Clean, dark-themed dashboard built with Tailwind CSS.
- 📱 **Responsive**: Mobile-friendly layout for viewing logs on the go.
- ⚡ **Auto-Reload**: Real-time log list updates after test generations.

## API Usage

The backend API is designed to be simple and easy to use.

### Text Generation (Default)

Send a POST request to `/api/generate` with a prompt. The response format defaults to "text".

```bash
curl -X POST http://localhost:31161/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "prompt": "say hi"}'
```

### JSON Generation (Auto-Dict)

To generate structured JSON, simply provide a `schema` parameter. The backend will automatically switch to dictionary mode.

```bash
curl -X POST http://localhost:31161/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "prompt": "generate person",
    "schema": "{\"type\": \"object\", \"properties\": {\"name\": {\"type\": \"string\"}}}"
  }'
```

## Project Structure

```bash
simple-llm/
├── backend/            # FastAPI, Pydantic & SQLite logic
├── frontend/           # React (Vite) dashboard
├── data/               # Persistent storage (settings.json, logs.db)
└── logs/               # Application logs (llm.jsonl fallback)
```

## Local Development

If you prefer to run the app locally for development:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mchen-lab/simple-llm.git
    cd simple-llm
    ```

2.  **Start Development Services**:
    ```bash
    ./restart.sh
    ```
    This script starts the FastAPI backend (31161) and Vite frontend (31160) concurrently.

## Deployment & Release

The project includes specialized scripts for maintenance:
- `build_and_publish.sh`: Builds multi-platform Docker images and pushes to GHCR/DockerHub.
- `docker_relaunch.sh`: Cleanly restarts the Docker container with optional volume clearing.
- `release.sh`: Handles version bumping and Git tagging for CI/CD.

## License

MIT License. See [LICENSE](LICENSE) for details.
