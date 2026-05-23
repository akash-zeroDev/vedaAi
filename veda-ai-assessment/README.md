# VedaAI - AI Assessment Creator

An AI-powered assessment creator featuring asynchronous generation, real-time UI updates, and print-ready output. VedaAI allows educators to upload materials and define specific question parameters to automatically generate high-quality examination papers.

## Architecture

The project is built as a full-stack JavaScript/TypeScript monorepo, decoupled into a robust frontend client and an asynchronous job-processing backend.

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Real-time Engine:** Socket.io-client

### Backend
- **Framework:** Node.js, Express
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Queue System:** Redis, BullMQ (Background Jobs)
- **Real-time Engine:** Socket.io

### AI Integration
- **Engine:** Google Gemini API
- **Prompting:** Strict structured JSON prompting to ensure consistent data structures for client rendering.

## Core Features
- **Drag & Drop Form:** An intuitive, responsive interface for uploading reference materials and configuring question distributions.
- **Asynchronous Job Queues:** Heavy LLM generation is offloaded to background workers via Redis/BullMQ to keep the API layer lightning-fast.
- **Real-time WebSocket Status:** The UI automatically transitions from queued to processing to success states via live Socket.io events.
- **High-Fidelity PDF Export:** The output exam page is injected with CSS print modifiers to strip UI navigation and backgrounds, creating perfect printed documents.
- **Regeneration Loop:** A persistent action dock allows users to resubmit their exact form criteria to generate a fresh assessment.

## Environment Variables

### `/frontend/.env.local`
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### `/backend/.env`
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/veda-ai
REDIS_URL=redis://127.0.0.1:6379
GEMINI_API_KEY=your_gemini_api_key_here
```

## Local Setup Instructions

### 1. Prerequisites
Ensure you have Node.js and Redis installed on your machine.
- Start your Redis server:
```bash
redis-server
```

### 2. Install Dependencies
Open two terminal windows. Install packages for both the frontend and backend.

```bash
# Terminal 1: Frontend
cd frontend
npm install

# Terminal 2: Backend
cd backend
npm install
```

### 3. Start the Backend
From the `backend` directory, start the development server and worker queue.
```bash
npm run dev
```

### 4. Start the Frontend
From the `frontend` directory, start the Next.js application.
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.
