

import os
import json
import requests
import time
from pathlib import Path
from typing import Dict, Any, Optional, Union
from dotenv import load_dotenv
from logger import log_llm_call

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class LLMService:



    def __init__(self):
        self.settings_file = Path("../data/settings.json")
        self.load_settings()

    def load_settings(self):
        """Load settings from JSON file, fallback to env vars if file/key missing."""
        self.settings = {}
        
        # Ensure data directory exists
        self.settings_file.parent.mkdir(parents=True, exist_ok=True)
        
        if self.settings_file.exists():
            try:
                with open(self.settings_file, "r") as f:
                    self.settings = json.load(f)
            except Exception as e:
                print(f"Error loading settings.json: {e}")
        
        # Get providers config (new format)
        self.providers = self.settings.get("providers", {})
        
        # Initialize OpenRouter provider (only needs api_key, base_url is fixed)
        if "openrouter" not in self.providers:
            self.providers["openrouter"] = {}
        if not self.providers["openrouter"].get("api_key"):
            self.providers["openrouter"]["api_key"] = os.getenv("OPENROUTER_API_KEY", "")
        
        # Initialize Ollama provider
        if "ollama" not in self.providers:
            self.providers["ollama"] = {}
        if not self.providers["ollama"].get("base_url"):
            self.providers["ollama"]["base_url"] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        
        self.model_names = self.settings.get("model_names", "")
        
        # Create default settings file if it doesn't exist
        if not self.settings_file.exists():
            self._save_settings()

    def _save_settings(self):
        """Save current settings to JSON file."""
        settings_data = {
            "providers": self.providers,
            "model_names": self.model_names
        }
        with open(self.settings_file, "w") as f:
            json.dump(settings_data, f, indent=2)
        print(f"Created default settings at {self.settings_file}")

    def _get_provider_config(self, model: str):
        """Determine provider and config from model string."""
        if ":" in model:
            provider, actual_model = model.split(":", 1)
        else:
            # Default to OpenRouter if no prefix
            provider = "openrouter"
            actual_model = model
            
        provider = provider.lower()
        
        # Get provider config
        provider_config = self.providers.get(provider, {})
        
        # Only support OpenRouter and Ollama
        if provider == "ollama":
            api_key = None
            base_url = provider_config.get("base_url", self.providers.get("ollama", {}).get("base_url"))
        elif provider == "openrouter" or provider in self.providers:
            provider = "openrouter"
            provider_config = self.providers.get("openrouter", {})
            api_key = provider_config.get("api_key")
            base_url = "https://openrouter.ai/api/v1"  # Fixed URL
        else:
            print(f"Note: Provider '{provider}' not explicitly supported locally, routing via OpenRouter.")
            provider = "openrouter"
            provider_config = self.providers.get("openrouter", {})
            api_key = provider_config.get("api_key")
            base_url = "https://openrouter.ai/api/v1"  # Fixed URL
            actual_model = model 
        
        return provider, api_key, base_url, actual_model

    def _call_provider(self, model: str, messages: list) -> tuple[str, dict]:
        """Generic call to compatible APIs."""
        provider, api_key, base_url, actual_model = self._get_provider_config(model)
        
        headers = {
            "Content-Type": "application/json",
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            

        # OpenRouter specific headers
        if provider == "openrouter":
            headers["HTTP-Referer"] = "http://localhost:31160"
            headers["X-Title"] = "Simple-LLM"
            
        payload = {
            "model": actual_model,
            "messages": messages,
            "temperature": 0.7
        }
        
        endpoint = f"{base_url}/chat/completions"
        
        try:
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                raise RuntimeError(f"API Request failed ({provider}): {response.text}")
                
            data = response.json()
            usage = data.get("usage", {})
            content = ""

            if "choices" in data and data["choices"]:
                 content = data["choices"][0]["message"]["content"]
            elif "message" in data: # Some Ollama versions?
                 content = data["message"]["content"]
            else:
                 raise RuntimeError(f"Invalid API response: {data}")
            
            return content, usage
                 
        except Exception as e:
             raise RuntimeError(f"Provider call failed: {e}")


    def generate(
        self,
        prompt: str,
        model: str,
        response_format: str = "text",
        schema: Optional[str] = None,
        tag: Optional[str] = None
    ) -> Union[str, Dict[str, Any]]:
        """
        Unified generation method.
        """
        start_time = time.time()
        error = None
        result = None
        usage = {}
        
        try:
            # Prepare messages
            system_message = "You are a helpful assistant."
            user_message = prompt
            
            if response_format == "dict" and schema:
                system_message += f"\nYou must respond with a valid JSON object matching this schema: {schema}"
                user_message += "\nRespond ONLY with the JSON."
            
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
            
            
            # Call API
            raw_content, usage = self._call_provider(model, messages)

            
            # Process response
            if response_format == "dict":
                # Clean code blocks if present
                cleaned = raw_content.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[1]
                    if cleaned.endswith("```"):
                        cleaned = cleaned.rsplit("\n", 1)[0]
                
                try:
                    result = json.loads(cleaned)
                    # Validate with string-schema if available?
                    # For now, just trust JSON load or use simple validation
                except json.JSONDecodeError as e:
                    raise RuntimeError(f"Failed to parse JSON response: {cleaned}") from e
            else:
                result = raw_content
                
        except Exception as e:
            error = str(e)
            raise e
        finally:
            log_llm_call(
                model=model,
                prompt=prompt,
                response=result if not error else None,
                start_time=start_time,
                error=error,
                metadata={"format": response_format, "schema": schema, "usage": usage},
                tag=tag
            )
            
        return result

# Singleton instance
llm_service = LLMService()
