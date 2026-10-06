# 🌱 AgriTech — Smart AI Farming Platform

A modern, full-stack precision agriculture and farm management workspace. **AgriTech** integrates AI agronomic advisory, interactive 3D field digital twins, IoT sensor telemetry, smart irrigation automation, real-time market prices, and hyper-local meteorological forecasts into a unified farmer operating system.

---

## 🌟 Key Features

### 🚜 Interactive 3D Farm Digital Twin
- **3D Field Visualization:** Built with Three.js and React Three Fiber to render farm layouts, crops, soil layers, and irrigation equipment.
- **Plot & Crop Lifecycle Monitoring:** Track crop growth stages, soil moisture states, and plot-specific metrics visually in 3D.

### 🤖 AI Agronomist & Multilingual Chatbot
- **Intelligent Crop & Disease Advisory:** LLM-powered recommendations (via Groq API) for optimal crop selection, disease identification, fertilizer regimens, and yield protection.
- **Multilingual Voice & Speech Pipeline:** Voice input and audio responses supporting multiple regional languages (**English, Hindi, Bengali, Telugu, Tamil, Marathi**).

### 💧 Smart Irrigation Automation
- **Sensor-Driven Irrigation:** Real-time calculation of soil water deficits against crop-specific thresholds.
- **Smart Pump Control & Scheduling:** Automated irrigation triggers, manual override, water conservation analytics, and weather-aware scheduling.

### 📡 Real-Time IoT Sensor Telemetry
- **Field Sensors:** Live streaming of environmental metrics:
  - Soil Moisture (%) & Soil Temperature (°C)
  - Ambient Air Temperature & Relative Humidity
  - Soil pH & NPK (Nitrogen, Phosphorus, Potassium) nutrient levels
- **Configurable Alerts:** Immediate notifications via WebSockets when values breach safe ranges.

### 📈 Market Intelligence & Agmarknet Pricing
- **Live Mandi Prices:** Real-time agricultural commodity prices fetched from the government Agmarknet repository.
- **Price Trend Visualizations:** Interactive historical price charts, volatility metrics, and revenue estimates to optimize market timing.

### ⛅ Hyper-Local Weather Intelligence
- **High-Precision Forecasts:** Powered by Open-Meteo with 7-day hourly outlooks, precipitation chances, wind speed, solar radiation, and frost/heatwave alerts.
- **Farming Action Advisories:** Context-aware recommendations tailored to oncoming rainfall and weather shifts.

### 📅 Crop Planning, Tasks & Calendar
- **Full Crop Lifecycles:** Seed-to-harvest planning with automatic task generation for planting, fertilization, weeding, and harvesting.
- **Interactive Calendar & Autosave:** Real-time draft autosaving for crop planning forms, daily task agendas, and Gantt-style activity timelines.

### 📊 Farm Economics & Yield Analytics
- **Financial Tracking:** Profit & loss analysis, input cost tracking (seeds, fertilizers, fuel, labor), and harvest yields in metric tonnes.
- **Yield Forecasting:** Predictive algorithms forecasting yield based on sensor data and climatic conditions.

### 🔒 Enterprise Auth & Cloud Storage
- **Authentication:** Secure JWT sessions, bcrypt password hashing, and Google OAuth 2.0 single sign-on.
- **Supabase Cloud Storage:** Secure file management for soil test reports, farm land deeds, invoices, and harvest receipts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Shadcn UI / Radix primitives |
| **3D & Visualizations** | Three.js, `@react-three/fiber`, `@react-three/drei`, Recharts |
| **State & Data Fetching** | Zustand, `@tanstack/react-query`, Axios |
| **Backend API** | Node.js, Express.js, TypeScript, REST API, Zod validation |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Realtime & Queue** | Socket.IO (WebSockets), Redis (ioredis), BullMQ background workers |
| **AI / LLM Services** | Groq API (Llama 3 / Mixtral models) |
| **Third-Party APIs** | Open-Meteo API, Agmarknet API, Supabase Storage, Google OAuth |

---

## 📁 Repository Structure

```text
agriTech/
├── backend/                   # Express.js + Prisma TypeScript API server
│   ├── prisma/                # Prisma schema & database migrations
│   ├── src/
│   │   ├── modules/           # Feature controllers, routes & middleware (auth, farm, planning...)
│   │   ├── services/          # Business services (AI, weather, market, cache, queue, storage)
│   │   ├── config.ts          # Server configuration & environment validation
│   │   └── index.ts           # Express & Socket.IO server entrypoint
│   ├── docker-compose.yml     # Local PostgreSQL + Redis development containers
│   └── package.json
│
├── frontend/                  # React 19 + TypeScript + Vite web application
│   ├── src/
│   │   ├── components/        # UI components, layout, and 3D scenes (Three.js)
│   │   ├── features/          # Feature slices (irrigation, weather, voice, auth...)
│   │   ├── pages/             # Route pages (Dashboard, 3D Farm, Market, Analytics, Chat...)
│   │   ├── store/             # Zustand stores (farm, auth, sensors)
│   │   └── lib/               # Utility functions and API clients
│   ├── vite.config.ts         # Vite bundler configuration & path aliases (@/*)
│   ├── tsconfig.app.json      # Client TypeScript compilation settings
│   └── package.json
│
├── scripts/
│   └── dev.mjs                # Monorepo development runner (concurrent backend + frontend)
├── tests/                     # Backend and algorithmic integration test suites
├── package.json               # Root workspace scripts & dependencies
└── README.md                  # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [Docker](https://www.docker.com/) & Docker Compose (optional, for running PostgreSQL & Redis locally)

---

### 1. Clone the Repository
```bash
git clone https://github.com/SARAN006-pro/SmartFarm.git
cd SmartFarm
```

---

### 2. Environment Configuration

#### Backend Environment:
Copy the backend example file:
```bash
cp backend/.env.example backend/.env
```
Ensure the key variables in `backend/.env` are populated:
```env
PORT=3002
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agritech?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:5173"

# Optional / External APIs
REDIS_HOST=localhost
REDIS_PORT=6379
GROQ_API_KEY="your-groq-api-key"
WEATHER_API_KEY=""
AGMARKNET_API_KEY=""
SUPABASE_URL=""
SUPABASE_SERVICE_KEY=""
```

#### Frontend Environment:
Copy the frontend example file (if present) or verify `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_URL="http://localhost:3002/api"
VITE_SOCKET_URL="http://localhost:3002"
```

---

### 3. Start Database Services (Optional via Docker)

If you have Docker installed, start PostgreSQL and Redis with one command:
```bash
docker compose -f backend/docker-compose.yml up -d db redis
```

---

### 4. Initialize Database with Prisma

Generate the Prisma client and push the database schema:
```bash
cd backend
npm install
npm run db:generate
npm run db:push
cd ..
```

---

### 5. Install Dependencies and Run

From the **workspace root**, install dependencies and launch both frontend and backend concurrently:

```bash
# Install root, backend, and frontend packages
npm install
npm --prefix backend install
npm --prefix frontend install

# Start both applications simultaneously
npm run dev
```

Once running:
- 🖥️ **Frontend:** [http://localhost:5173](http://localhost:5173)
- ⚙️ **Backend API:** [http://localhost:3002/api](http://localhost:3002/api)
- 🩺 **Health Check:** [http://localhost:3002/health](http://localhost:3002/health)

---

## 💻 Available Workspace Scripts

| Command | Action |
|---|---|
| `npm run dev` | Runs both backend (`localhost:3002`) and frontend (`localhost:5173`) concurrently |
| `npm run dev:frontend` | Runs only the Vite frontend development server |
| `npm run dev:backend` | Boots the Docker Compose database and backend services |
| `npm run build` | Builds the frontend for production into `frontend/dist` |
| `npm run build:backend` | Compiles the backend TypeScript into `backend/dist` |
| `npm run build:all` | Compiles both backend and frontend applications |
| `npm run preview` | Previews the frontend production bundle locally |

---

## 📡 API Endpoints Overview

### Authentication & User
- `POST /api/auth/register` — Register a new farmer account
- `POST /api/auth/login` — Sign in with email and password
- `GET /api/auth/me` — Retrieve the currently authenticated user
- `PUT /api/auth/profile` — Update account profile details
- `POST /api/auth/change-password` — Change password
- `GET /api/auth/google` / `GET /api/auth/google/callback` — Google OAuth 2.0 flow

### Farm & Field Management
- `GET /api/farms` — List farms belonging to the user
- `POST /api/farms` — Create a new farm
- `GET /api/farms/:id` — Get detailed farm profile, fields, and plots
- `PUT /api/farms/:id` — Update farm details
- `DELETE /api/farms/:id` — Remove farm

### Crop Planning & Task Management
- `GET /api/planning` — List active crop plans
- `POST /api/planning` — Create a crop plan
- `GET /api/planning/:id` — Get full plan details and schedule
- `GET /api/planning/tasks/today` — Retrieve tasks scheduled for today
- `POST /api/planning/autosave` — Persist plan drafts in real-time
- `GET /api/planning/autosave/:entityType/:entityId` — Load saved draft

### Weather & Agronomic Insights
- `GET /api/weather/current?lat=...&lng=...` — Current conditions
- `GET /api/weather/forecast?lat=...&lng=...&days=7` — 7-day forecast
- `POST /api/predict/crop` — AI crop recommendations based on soil NPK, pH, and climate
- `POST /api/irrigation/advice` — Smart irrigation deficit recommendation

### Market Prices
- `GET /api/market/prices` — Fetch live agricultural market commodity prices
- `GET /api/market/prices/:crop` — Specific commodity price history and trends

### Real-Time IoT Sensors
- `GET /api/sensors/readings` — Retrieve recent sensor telemetry
- `POST /api/sensors/data` — Ingest sensor readings from field gateway devices

---

## 🔄 Real-Time WebSockets (Socket.IO)

The backend exposes real-time Socket.IO rooms for zero-latency updates:
- `user:<userId>`: User-specific alerts and background notifications
- `farm:<farmId>`: Collaborative farm updates, task status changes, and sensor telemetry
- `market:updates`: Live commodity price ticker events
- `task:updated`: Emitted when a farm activity is modified or completed

---

## 🤝 Contributing

Contributions are welcomed to make smart farming accessible to everyone:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m "feat: Add AmazingFeature"`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the terms specified in the repository. All rights reserved.