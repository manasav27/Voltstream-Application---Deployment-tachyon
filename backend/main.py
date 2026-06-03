from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import initialize_database
from routes.agent_routes import router as agent_router
from routes.chat_routes import router as chat_router
from routes.dashboard_routes import router as dashboard_router
from routes.orchestrator_routes import router as orchestrator_router
from routes.qa import router as qa_router


app = FastAPI(title="VoltStream API")
initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(chat_router)
app.include_router(qa_router)
app.include_router(orchestrator_router)
app.include_router(agent_router)
