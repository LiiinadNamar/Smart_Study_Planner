# Smart Study Planner (SSP)

AI-powered personal learning management system.

## Quick Start

```bash
# 1. Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — add your OpenRouter API key

# 2. Launch everything
docker compose up --build

# 3. Open in browser
# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8000/docs
```

## Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Backend    | Python, FastAPI, SQLAlchemy (async)    |
| Frontend   | React 19, TypeScript, Tailwind CSS v4  |
| Database   | PostgreSQL 16                          |
| AI         | OpenRouter (Gemini, Sonar, etc.)       |
| Storage    | Local filesystem                       |
| Container  | Docker Compose                         |

## Features

- **Smart Planner** — Kanban task board with priority auto-calculation
- **Grade Tracker** — Weighted average + forecast to target grade
- **AI Summarizer** — Upload PDF/TXT, get structured summaries
- **AI Quiz Generator** — Auto-generated MCQ quizzes from materials
- **Roadmap Generator** — AI creates week-by-week study plans

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive Swagger UI.

## Project Structure

```
SSP/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # REST endpoints
│   │   ├── core/     # Config, DB, security
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic + AI
│   │   └── utils/    # PDF extraction, etc.
│   └── alembic/      # Database migrations
├── frontend/         # React + Vite application
│   └── src/
│       ├── components/ # Reusable UI
│       ├── features/   # Feature pages
│       ├── store/      # Zustand state
│       └── types/      # TypeScript interfaces
├── docker-compose.yml # One-command launch
└── uploads/          # Local file storage
```
