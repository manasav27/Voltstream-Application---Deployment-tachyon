# VoltStream

VoltStream is a full-stack energy monitoring and smart-device control application for a prosumer user who consumes grid electricity and also generates solar energy. It uses a React frontend, a FastAPI backend, SQLite-backed mock data, and AI features powered by Gemini 2.5 Flash through Vertex AI.

The app now includes live energy monitoring, usage analytics, billing insights, smart device control, a normal Groot chatbot, a PDF-grounded RAG Q&A bot, Page Insight AI, and a Google ADK smart-device control agent.

## Current Features

- Intro and Explore pages for the app entry experience and feature overview
- Live dashboard for grid draw, solar generation, net usage, solar buffer, carbon impact, and energy independence
- Usage analytics with daily, weekly, and monthly energy history
- Smart Control page with room filters, device cards, custom device creation, delete, and ON/OFF toggles
- Proactive Energy Leak Detector with troubleshooting and service scheduling UI
- Billing and invoices page with projected bill, budget usage, INR conversion, and benchmarking UI
- Floating Groot chat widget with normal bot mode and RAG Q&A mode
- Page Insight AI on app pages for page-specific explanations and suggestions
- Google ADK smart-device agent for natural-language device control
- PDF-based RAG pipeline using ChromaDB and energy guide PDFs
- Vertex AI service-account configuration for Gemini 2.5 Flash

## AI Features

### Normal Groot Bot

The normal Groot bot is available from the floating chat widget. It calls:

```text
POST /api/v1/chat
```

It can answer general questions using Gemini 2.5 Flash through Vertex AI. It also checks simple appliance commands before calling the model, so commands like turning a device on/off or scheduling a delayed action can be handled through `appliance_control.py`.

Example commands:

```text
Give me three energy saving tips
Turn off the bedroom lamp
Turn off fan in 5 minutes
```

### RAG Q&A Bot

The RAG Q&A bot is available from the chat widget's RAG mode. It calls:

```text
POST /api/v1/qa
```

The RAG bot searches loaded energy PDFs from ChromaDB, sends relevant chunks to Gemini 2.5 Flash, and returns a grounded answer. If the information is not in the PDF context, it returns:

```text
I don't have that information
```

### Page Insight AI

Page Insight AI lets Groot inspect current frontend page data and explain what is happening. It calls:

```text
POST /api/v1/page-insight
```

It is used for page-specific explanations on areas such as the Live Dashboard, Smart Control, Analytics, and Billing pages.

### ADK Smart-Device Agent

The smart-device agent is implemented with Google ADK in `backend/agent_routes.py`. It calls:

```text
POST /api/v1/agent
```

The ADK agent uses Gemini 2.5 Flash to understand the user command, select a Python tool, execute the tool, observe the result, and respond with updated device status.

Agent tools:

- `get_device_status`
- `toggle_device`
- `toggle_all_devices`

Example commands:

```text
What is the status of the Living Room AC?
Turn off the Living Room AC
Turn off all devices
Turn on kitchen devices
```

Smart Control also includes frontend command handling for confirmations, undo, scheduled single-device actions, previous-device references like “turn it off”, and warning alerts that can be reviewed by Page Insight AI.

## AI Flow Summary

```text
User
  -> React frontend
  -> Chat widget / Smart Control / Page Insight
  -> FastAPI backend
  -> Gemini 2.5 Flash through Vertex AI
  -> Optional tools, ChromaDB search, or SQLite device update
  -> Backend response
  -> Frontend UI update
```

ADK device-agent loop:

```text
Plan -> Select Tool -> Execute Tool -> Observe -> Respond
```

RAG flow:

```text
Energy PDFs -> rag_loader.py -> chunks -> embeddings -> ChromaDB -> qa.py -> Gemini -> grounded answer
```

## Tech Stack

### Frontend

- React
- React Router DOM
- Axios
- Tailwind CSS
- Recharts
- Lucide React
- React Icons
- Framer Motion
- Create React App / React Scripts
- Firebase Hosting configuration

### Backend

- FastAPI
- Uvicorn
- Pydantic
- SQLite
- Google Gen AI SDK
- Google ADK
- Vertex AI
- Gemini 2.5 Flash
- ChromaDB
- Sentence Transformers
- pypdf
- python-dotenv
- Docker / Cloud Run configuration

## Project Structure

```text
Voltstream app-tachyon1/
├── README.md
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── chat_routes.py
│   ├── agent_routes.py
│   ├── appliance_control.py
│   ├── qa.py
│   ├── rag_loader.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── energy_pdfs/
│   └── chroma_db/
└── frontend/
    ├── package.json
    ├── firebase.json
    ├── tailwind.config.js
    ├── src/
    │   ├── App.js
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── ChatWidget.jsx
    │   │   ├── PageGrootInsight.jsx
    │   │   ├── chat/
    │   │   └── smart-control/
    │   │       ├── DeviceWidgets.jsx
    │   │       └── deviceAgentUtils.js
    │   └── pages/
    │       ├── IntroPage.jsx
    │       ├── ExplorePage.jsx
    │       ├── LiveDashboard.jsx
    │       ├── UsageHistory.jsx
    │       ├── SmartControl.jsx
    │       ├── Invoices.jsx
    │       └── Notfound.jsx
    └── public/
```

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | IntroPage | Introductory entry page for VoltStream |
| `/explore` | ExplorePage | Feature overview and product exploration page |
| `/live` | LiveDashboard | Live grid, solar, net usage, and energy independence dashboard |
| `/analytics` | UsageHistory | Daily, weekly, and monthly usage analytics |
| `/devices` | SmartControl | Smart-device management, AI command bar, and energy leak detector |
| `/billing` | Invoices | Billing summary, projected bill, budget usage, and invoice insights |

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/dashboard/live` | Returns live grid, solar, and net usage values |
| `GET` | `/api/v1/analytics/history?period=daily\|weekly\|monthly` | Returns energy usage history |
| `GET` | `/api/v1/devices` | Returns smart devices |
| `PATCH` | `/api/v1/devices/{device_id}?status=ON/OFF` | Updates device ON/OFF state |
| `POST` | `/api/v1/devices` | Adds a custom smart device |
| `DELETE` | `/api/v1/devices/{device_id}` | Deletes a smart device |
| `GET` | `/api/v1/billing/summary` | Returns billing summary |
| `POST` | `/api/v1/chat` | Normal Groot chatbot |
| `POST` | `/api/v1/qa` | PDF-grounded RAG Q&A bot |
| `POST` | `/api/v1/page-insight` | Page-specific AI insight |
| `POST` | `/api/v1/agent` | Google ADK smart-device control agent |

## Backend Data Models

The backend uses Pydantic models for validation. Main models include:

- `LivePowerStatus`
- `EnergyDataPoint`
- `DeviceResponse`
- `DeviceCreateRequest`
- `BillingSummary`
- `ChatRequest`
- `ChatResponse`
- `PageInsightRequest`
- `PageInsightResponse`

## Vertex AI Configuration

The backend expects Vertex AI configuration in `backend/.env`.

Example:

```env
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS="C:/path/to/service-account.json"
GEMINI_MODEL=gemini-2.5-flash
ADK_MODEL=gemini-2.5-flash
```

Notes:

- Do not commit `.env` or service-account JSON files.
- The service account JSON is used through `GOOGLE_APPLICATION_CREDENTIALS`.
- `GEMINI_MODEL` is used by `/chat`, `/qa`, and `/page-insight`.
- `ADK_MODEL` is used by `/agent`.

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs locally at:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend runs locally at:

```text
http://localhost:3000
```

To override the frontend API base:

```env
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## RAG Setup

Energy PDFs are stored in:

```text
backend/energy_pdfs/
```

The RAG loader reads those PDFs and stores searchable chunks in:

```text
backend/chroma_db/
```

Run the loader after adding or changing PDF files:

```bash
cd backend
python rag_loader.py
```

## Testing Examples

Normal chat:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"Give me three energy saving tips\"}"
```

RAG Q&A:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/qa \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"What is renewable energy?\"}"
```

ADK smart-device agent:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/agent \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Turn off the Living Room AC\"}"
```

Page Insight:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/page-insight \
  -H "Content-Type: application/json" \
  -d "{\"page\":\"Live Dashboard\",\"question\":\"What is happening here?\",\"data\":{\"net_usage_kw\":1.2}}"
```

## Deployment

The backend is configured for Google Cloud Run deployment. The frontend is configured for Firebase Hosting.

Build frontend:

```bash
cd frontend
npm run build
```

Deploy frontend:

```bash
firebase deploy
```

## Important Implementation Details

### Live Data Simulation

Live dashboard values fluctuate on the backend so the dashboard feels active while still using local mock data.

### Smart Device Updates

Smart device toggles update optimistically in the frontend and then persist through the backend. If the request fails, the UI restores the previous state.

### Smart Control Refactor

The Smart Control page has been partially split for maintainability:

- `DeviceWidgets.jsx` contains repeated device UI widgets.
- `deviceAgentUtils.js` contains command parsing, matching, default power, room detection, and bulk command helper logic.

### AI Safety and Scope

- RAG answers are restricted to loaded PDF context.
- The normal bot removes repeated self-introductions.
- The smart-device agent returns trace data for the agent loop.
- Bulk device commands require frontend confirmation.

## Security Notes

Do not commit:

```text
backend/.env
backend/*.json
backend/voltstream.db
backend/__pycache__/
```

Service account JSON files contain private credentials.

## Future Enhancements

- Authentication and user accounts
- Real smart meter or IoT integration
- PostgreSQL or managed database support
- WebSocket-based live updates
- More advanced appliance usage prediction
- PDF invoice download
- Admin dashboard
- Mobile app version

## Author

VoltStream project by Manas.
