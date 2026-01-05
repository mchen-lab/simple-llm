
from fastapi import FastAPI, HTTPException, Request

from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

from service import llm_service
from logger import get_logs, init_db, count_logs, purge_logs, purge_logs_by_count


from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path

# ... (imports) ...

app = FastAPI(title="Simple LLM Service")

@app.on_event("startup")
async def startup_event():
    init_db()

# Allow CORS for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class Settings(BaseModel):
    api_keys: Dict[str, str]
    base_urls: Dict[str, str]

@app.get("/api/settings")
async def get_settings():
    # Helper to return current merged settings
    return {
        "api_keys": llm_service.api_keys,
        "base_urls": llm_service.base_urls
    }

@app.post("/api/settings")
async def update_settings(settings: Settings):
    try:
        # Save to file
        with open("data/settings.json", "w") as f:
            json.dump(settings.dict(), f, indent=2)
        
        # Reload service
        llm_service.load_settings()
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GenerateRequest(BaseModel):
    model: str
    prompt: str
    response_format: str = "text"  # text or dict
    schema: Optional[str] = None
    tag: Optional[str] = None

@app.get("/")
async def read_root():
    return {"message": "Simple LLM API"}


@app.post("/api/generate")
async def generate(req: GenerateRequest):
    try:
        if req.response_format == "dict" and not req.schema:
            raise HTTPException(status_code=400, detail="Schema is required for dict format")
            
        result = llm_service.generate(
            prompt=req.prompt,
            model=req.model,
            response_format=req.response_format,
            schema=req.schema,
            tag=req.tag
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from logger import get_logs, init_db, count_logs, purge_logs, toggle_log_lock, purge_logs_by_count

# ...

class LogLockRequest(BaseModel):
    locked: bool

@app.patch("/api/logs/{log_id}")
async def toggle_log(log_id: int, req: LogLockRequest):
    success = toggle_log_lock(log_id, req.locked)
    if not success:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"status": "success", "locked": req.locked}

@app.get("/api/logs")
async def read_logs(
    page: int = 1, 
    limit: int = 50,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    tag: Optional[str] = None
):
    offset = (page - 1) * limit
    logs = get_logs(limit=limit, offset=offset, start_date=start_date, end_date=end_date, tag=tag)
    total = count_logs(start_date=start_date, end_date=end_date, tag=tag)
    
    return {
        "data": logs,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@app.get("/api/logs/tags")
async def read_tags():
    from logger import get_unique_tags
    return get_unique_tags()

@app.delete("/api/logs")
async def purge_logs_endpoint(days_to_keep: Optional[int] = None, count_to_keep: Optional[int] = None):
    try:
        if count_to_keep is not None:
            count = purge_logs_by_count(count_to_keep)
        elif days_to_keep is not None:
            count = purge_logs(days_to_keep)
        else:
            raise HTTPException(status_code=400, detail="Either days_to_keep or count_to_keep must be provided")
            
        return {"status": "success", "deleted": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
