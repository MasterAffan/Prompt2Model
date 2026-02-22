# README

This project provides a fast way to interact with a local 3D scene via a web UI and a lightweight Node.js backend. The frontend offers an intuitive interface, and the backend exposes clean HTTP endpoints for scene actions and a chat that generates Python for operations.

## Setup Steps
- Install Node.js and npm
- Backend: `cd backend && npm i && npm start`
- Frontend: `cd frontend && npm i && npm run dev`
- Keep any API keys in environment variables (e.g., `.env`) and never commit them

## Dependencies
- Frontend: React, Vite, TypeScript, Tailwind
- Backend: Node.js, Express, Axios

## Example Commands
- Check health: `curl http://localhost:3000/health`
- List tools: `curl http://localhost:3000/tools`
- Add cube: `curl -X POST http://localhost:3000/add-cube -H "Content-Type: application/json" -d "{\"size\":2,\"location\":[0,0,0]}"`
- Scene info: `curl http://localhost:3000/scene-info`
