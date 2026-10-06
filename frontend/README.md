# 🌱 AgriTech — Frontend Client

The web client for the AgriTech Smart AI Farming Platform, built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Three.js**.

---

## 🚀 Features

- **Interactive 3D Field Scenes**: Plot digital twins built using Three.js and `@react-three/fiber`.
- **Multilingual AI Agronomist**: Voice-enabled conversational chatbot supporting multiple Indian regional languages (Hindi, Bengali, Telugu, Tamil, Marathi) & English.
- **Precision Irrigation Dashboard**: Dynamic water deficit monitoring, pump controls, and schedules.
- **Live Mandi & Market Analytics**: Agmarknet commodity prices, charts, and trends using Recharts.
- **Sensors & Real-time Telemetry**: Real-time WebSocket connection to backend sensor streams.
- **Farm Planning & Calendar**: Interactive calendar, task boards, and draft autosaving.
- **Authentication**: JWT authentication with local login/register and Google OAuth 2.0 flow.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/) & [@react-three/fiber](https://r3f.docs.pmnd.rs/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/)
- **Server State**: [@tanstack/react-query](https://tanstack.com/query)
- **HTTP & Sockets**: Axios & Socket.IO Client

---

## 💻 Development

### Setup

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Available Scripts

```bash
# Start development server at http://localhost:5173
npm run dev

# Type check and build for production into dist/
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

---

## 🌐 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL for backend REST API | `http://localhost:3002/api` |
| `VITE_SOCKET_URL` | WebSocket URL for Socket.IO | `http://localhost:3002` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID for Google OAuth | `""` |
