# VoltStream

VoltStream is a full-stack energy monitoring dashboard for a prosumer user who consumes electricity and also generates solar energy. The application provides live energy readings, usage analytics, smart appliance control, and billing insights through a React frontend and FastAPI backend.

The project uses mock data, but the backend and frontend calculations are designed to make the values feel realistic. Live energy values fluctuate on the backend, while the frontend calculates grid draw, solar generation, appliance load, projected billing, budget usage, and savings based on the current device state.

## Features

- Live dashboard for grid draw, solar generation, net usage, solar buffer, carbon impact, and energy independence
- Usage history page with daily, weekly, and monthly analytics
- Smart appliance control with room-wise filtering and ON/OFF toggles
- Proactive Energy Leak Detector with troubleshooting and service scheduling UI
- Billing and invoices page with projected bill, budget alert, INR conversion, and community benchmarking
- Appliance health and maintenance predictor cards
- Backend API validation using Pydantic models
- FastAPI backend deployed on Google Cloud Platform
- React frontend configured for Firebase Hosting

## Tech Stack

### Frontend

- React 19
- React Router DOM
- Axios
- Tailwind CSS
- Recharts
- Lucide React
- React Icons
- Framer Motion
- Create React App / React Scripts
- Firebase Hosting

### Backend

- FastAPI
- Uvicorn
- Pydantic
- Python
- Docker
- Google Cloud Run

## Project Structure

```text
Voltstream app-tachyon1/
├── backend/
│   ├── main.py
│   ├── mock_data.py
│   ├── models.py
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/
    ├── package.json
    ├── firebase.json
    ├── tailwind.config.js
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   ├── index.css
    │   ├── components/
    │   │   └── Layout.jsx
    │   └── pages/
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
| `/` | LiveDashboard | Shows live grid draw, solar generation, net usage, appliance load, solar goal, and energy independence score. |
| `/analytics` | UsageHistory | Displays energy usage and solar generation analytics with daily, weekly, and monthly views. |
| `/devices` | SmartControl | Provides room-wise smart appliance control with device toggles and power usage details. |
| `/billing` | Invoices | Shows billing summary, projected bill, budget usage, invoice history, and community comparison. |

## API Endpoints

| Method | Endpoint | Response Model | Purpose |
|---|---|---|---|
| GET | `/api/v1/dashboard/live` | `LivePowerStatus` | Returns live grid, solar, and net usage values. |
| GET | `/api/v1/analytics/history?period=daily\|weekly\|monthly` | `List[EnergyDataPoint]` | Returns usage history for the selected period. |
| GET | `/api/v1/devices` | `List[DeviceResponse]` | Returns the smart device list. |
| PATCH | `/api/v1/devices/{device_id}?status=ON/OFF` | `DeviceResponse` | Updates a device ON/OFF state. |
| GET | `/api/v1/billing/summary` | `BillingSummary` | Returns billing summary values. |

## Backend Data Models

The backend uses Pydantic models to validate API responses:

```python
class LivePowerStatus(BaseModel):
    grid_draw_kw: float
    solar_generation_kw: float
    net_usage_kw: float

class EnergyDataPoint(BaseModel):
    timestamp: str
    usage_kwh: float
    solar_kwh: float

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    power_draw_w: int

class BillingSummary(BaseModel):
    current_month_cost: float
    projected_cost: float
    budget_limit: float
```

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend runs locally at:

```text
http://localhost:8000
```

FastAPI Swagger documentation:

```text
http://localhost:8000/docs
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

## Deployment

The backend was deployed on Google Cloud Platform using Cloud Run. After deployment, the backend API URL was:

```text
https://voltstream-api-846651028355.asia-south1.run.app/api/v1
```

This API URL is used in the frontend pages as the `API_BASE` value, allowing React pages to call the deployed FastAPI backend with Axios.

Example:

```javascript
axios.get(`${API_BASE}/billing/summary`)
axios.get(`${API_BASE}/devices`)
axios.get(`${API_BASE}/dashboard/live`)
```

After connecting the frontend to the deployed backend, the frontend was built and deployed using Firebase Hosting.

```bash
cd frontend
npm run build
firebase deploy
```

## Important Implementation Details

### Live Data Simulation

The backend simulates live values in `mock_data.py` by adding small random changes to the base grid and solar values:

```python
grid_draw = max(0.0, round(LIVE_POWER_DATA["grid_draw_kw"] + random.uniform(-0.2, 0.2), 2))
solar_gen = max(0.0, round(LIVE_POWER_DATA["solar_generation_kw"] + random.uniform(-0.3, 0.3), 2))
net_usage = round(grid_draw - solar_gen, 2)
```

### Billing Data Fetching

The Invoices page fetches billing and device data together. It refreshes the data at an interval so billing values and device status stay updated.

```javascript
const [billingRes, devicesRes] = await Promise.all([
  axios.get(`${API_BASE}/billing/summary`),
  axios.get(`${API_BASE}/devices`),
]);

setData(billingRes.data);
setDevices(Array.isArray(devicesRes.data) ? devicesRes.data : []);
```

### Smart Device Control

The SmartControl page updates devices optimistically. The UI changes immediately after a toggle, and then the backend is updated using a PATCH request. If the API call fails, the UI restores the previous state.

## Future Enhancements

- Real smart meter or IoT device integration
- Database support with PostgreSQL or MongoDB
- Authentication and user accounts
- PDF invoice download
- WebSocket-based live updates
- Advanced appliance usage prediction
- Admin dashboard for managing devices
- Mobile app version

## Author

VoltStream project by Manas.
