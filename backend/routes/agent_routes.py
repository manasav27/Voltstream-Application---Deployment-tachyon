from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from agents.device import device_agent_events
from models import AgentRequest


router = APIRouter(prefix="/api/v1")


@router.post("/agent")
async def run_device_agent(request: AgentRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    return StreamingResponse(
        device_agent_events(message),
        media_type="application/x-ndjson",
    )
