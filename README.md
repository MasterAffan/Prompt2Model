# AI-Driven Natural Language Interface for 3D Scene Creation

## A Model Context Protocol (MCP) Based Approach for Blender Automation through Large Language Models

---

## Table of Contents

1. [Abstract](#abstract)
2. [System Overview](#system-overview)
3. [Dependencies and System Requirements](#dependencies-and-system-requirements)
4. [Implementation Details of Key Algorithms](#implementation-details-of-key-algorithms)
5. [Setup Instructions](#setup-instructions)
6. [Usage Guidelines for Reproducing Experiments](#usage-guidelines-for-reproducing-experiments)
7. [Instructions for Executing the Evaluation Pipeline](#instructions-for-executing-the-evaluation-pipeline)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)
10. [License](#license)

---

## Abstract

This research presents an AI-driven natural language interface for 3D scene creation using Blender. The system leverages the Model Context Protocol (MCP) to establish bidirectional communication between Large Language Models (LLMs) and Blender's Python API (bpy). By utilizing LLMs for code generation and MCP for standardized tool orchestration, the system enables users to create complex 3D scenes through natural language commands without requiring knowledge of Blender's scripting API.

---

## System Overview

The architecture consists of three primary components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  3D Viewer  │  │ Chat Interface│  │  Shape Gallery     │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API (HTTP)
┌────────────────────────────▼────────────────────────────────────┐
│                   Backend (Node.js/Express)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ AI Router   │  │ MCP Client   │  │  Scene Manager      │   │
│  │ (LLM API)   │  │ (Blender)    │  │  (State)            │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ Stdio Transport (MCP)
┌────────────────────────────▼────────────────────────────────────┐
│                    Blender MCP Server                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Blender Python API (bpy)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components:

1. **Frontend**: React-based web interface with 3D viewport using Three.js/React-Three-Fiber
2. **Backend**: Express.js REST API handling AI communication and MCP tool execution
3. **MCP Client**: Model Context Protocol client connecting to Blender
4. **LLM Integration**: Support for DeepSeek (via OpenRouter) and Google Gemini APIs

---

## Dependencies and System Requirements

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 8 GB | 16 GB |
| GPU | Integrated | Dedicated (NVIDIA with CUDA) |
| Storage | 10 GB free | 20+ GB free |

### Software Requirements

#### Operating System
- **Primary**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **Note**: This guide focuses on Windows/Unix-based systems

#### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥18.0.0 | Runtime environment |
| npm | ≥9.0.0 | Package management |
| Python | ≥3.10 | MCP server dependencies |
| Blender | ≥4.4 | 3D modeling and rendering |
| uv | Latest | Python package installer |

#### Backend Dependencies (package.json)

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@react-three/fiber": "^8.18.0",
    "@react-three/drei": "^9.122.0",
    "three": "^0.171.0",
    "axios": "^1.12.2",
    "zustand": "^5.0.8",
    "lucide-react": "^0.462.0",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}
```

### API Keys Required

1. **OpenRouter API Key** (for DeepSeek models)
   - Sign up at: https://openrouter.ai/
   - Default model: `deepseek/deepseek-chat-v3.1:free`

2. **Google Gemini API Key** (optional, alternative)
   - Sign up at: https://aistudio.google.com/app/apikey
   - Default model: `gemini-2.5-pro`

---

## Implementation Details of Key Algorithms

### 1. MCP Client Initialization Algorithm

The MCP client establishes a stdio-based connection to the Blender MCP server:

```javascript
async function initializeMCPClient() {
  const transport = new StdioClientTransport({
    command: 'uvx',
    args: ['blender-mcp'],
    env: process.env
  });

  mcpClient = new Client({
    name: 'blender-mcp-backend',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await mcpClient.connect(transport);
  isConnected = true;
}
```

**Complexity**: O(n) where n is the number of available MCP tools

### 2. AI-Powered Code Generation Pipeline

The system uses a multi-stage pipeline for converting natural language to Blender Python code:

```
User Input → Context Assembly → LLM Inference → Code Extraction → Execution → Response
```

#### Stage 1: Context Assembly
- Fetches current scene state via `get_scene_info()`
- Constructs system prompt with Blender API constraints
- Maintains conversation history

#### Stage 2: LLM Inference
- Sends formatted messages to LLM API
- Extracts Python code blocks from response
- Handles multi-turn conversations

#### Stage 3: Code Execution
- Validates extracted Python syntax
- Executes via `execute_blender_code` tool
- Returns execution results

### 3. Code Extraction Algorithm

```javascript
function extractPythonCode(text) {
  const codeBlockRegex = /```python\n([\s\S]*?)\n```/g;
  const matches = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}
```

**Complexity**: O(m) where m is the length of the response text

### 4. Conversation State Management

In-memory conversation storage with per-conversation history:

```javascript
const conversations = new Map();

function addMessage(conversationId, role, content) {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, [
      { role: 'system', content: SYSTEM_PROMPT }
    ]);
  }
  conversations.get(conversationId).push({ role, content });
}
```

### 5. Scene Information Retrieval

```javascript
async function getSceneInfo() {
  return await callTool('get_scene_info');
}
```

Returns structured data including:
- Object list with names, types, locations
- Material information
- Camera and lighting state

### 6. Direct Object Manipulation

| Endpoint | Method | Function |
|----------|--------|----------|
| `/add-cube` | POST | Create primitive cube |
| `/add-sphere` | POST | Create UV sphere |
| `/add-cylinder` | POST | Create cylinder |
| `/objects` | GET | List all scene objects |
| `/scene-info` | GET | Get full scene state |
| `/object/:name` | DELETE | Remove object |

---

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "project DAA final"
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 4: Configure API Keys

#### Option A: OpenRouter (Default)

1. Obtain API key from https://openrouter.ai/
2. Edit `backend/server.js`:
```javascript
const OPENROUTER_API_KEY = 'your-api-key-here';
```

#### Option B: Google Gemini

1. Obtain API key from https://aistudio.google.com/app/apikey
2. Edit `backend/server.js`:
```javascript
const GEMINI_API_KEY = 'your-gemini-api-key-here';
```

### Step 5: Install Blender MCP Server

The system uses `uvx` to run the Blender MCP server:

```bash
# Install uv if not already installed
pip install uv

# The MCP server will be launched automatically by the backend
```

### Step 6: Launch Blender

1. Open Blender 4.4 or newer
2. Ensure Blender is running before starting the backend

### Step 7: Start the Backend Server

```bash
cd backend
npm start
```

Expected output:
```
🔌 Connecting to Blender MCP server...
✅ Connected to Blender MCP server successfully!
📦 Available tools: execute_blender_code, get_scene_info, ...
🚀 Blender MCP Backend Server running on port 3000
```

### Step 8: Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

Access the interface at: `http://localhost:5173`

---

## Usage Guidelines for Reproducing Experiments

### Experiment 1: Basic Primitive Creation

**Objective**: Verify natural language to 3D object conversion

**Steps**:
1. Start backend and frontend servers
2. Open web interface at `http://localhost:5173`
3. Enter chat prompt: "Create a red cube"
4. Observe object creation in Blender viewport

**Expected Results**:
- Cube appears at origin (0, 0, 0)
- Red material applied to cube
- Response includes executed Python code

### Experiment 2: Complex Scene Generation

**Objective**: Test multi-object scene creation

**Steps**:
1. Enter prompt: "Create a simple chair with seat, backrest, and four legs"
2. Enter prompt: "Add a wooden table in front of the chair"
3. Enter prompt: "Add a plane floor beneath both objects"

**Expected Results**:
- Multiple objects created with proper positioning
- Materials applied appropriately
- Scene hierarchy maintained

### Experiment 3: AI Model Comparison

**Objective**: Compare code generation quality between models

**Steps**:
1. Test with DeepSeek (default):
   ```bash
   curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "create a torus", "model": "deepseek/deepseek-chat-v3.1:free"}'
   ```

2. Test with Gemini:
   ```bash
   curl -X POST http://localhost:3000/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "create a torus", "model": "gemini"}'
   ```

**Metrics to Compare**:
- Code correctness
- Execution success rate
- Response latency

### Experiment 4: Direct API Testing

**Objective**: Verify direct tool execution without AI

**Test Add Cube**:
```bash
curl -X POST http://localhost:3000/add-cube \
  -H "Content-Type: application/json" \
  -d '{"size": 2, "location": [0, 0, 0]}'
```

**Test Get Scene Info**:
```bash
curl http://localhost:3000/scene-info
```

**Test List Objects**:
```bash
curl http://localhost:3000/objects
```

---

## Instructions for Executing the Evaluation Pipeline

### Automated Test Suite

The project includes an automated test script (`backend/test.js`) that validates core functionality:

```bash
cd backend
npm test
```

### Test Cases

| Test # | Function | Description |
|--------|----------|-------------|
| 1 | Health Check | Verify server and MCP connection |
| 2 | List Tools | Enumerate available MCP tools |
| 3 | Get Scene Info | Retrieve current scene state |
| 4 | List Objects | Enumerate objects in scene |
| 5 | Add Cube | Create cube primitive |
| 6 | Add Sphere | Create sphere primitive |
| 7 | Execute Code | Run custom Python code |
| 8 | Add Cylinder | Create cylinder primitive |

### Performance Evaluation

To measure system performance:

```bash
# Measure response time
time curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "create a cube"}'

# Measure throughput (requests per second)
ab -n 100 -c 10 -p payload.json http://localhost:3000/chat
```

### Evaluation Metrics

1. **Latency**: Time from request to execution completion
2. **Success Rate**: Percentage of successful object creations
3. **Code Accuracy**: Percentage of generated code that executes without errors
4. **User Satisfaction**: Qualitative assessment of output quality

---

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health and connection status |
| `/tools` | GET | List available MCP tools |
| `/chat` | POST | AI-powered chat interaction |
| `/execute` | POST | Execute tool directly |
| `/add-cube` | POST | Create cube primitive |
| `/add-sphere` | POST | Create sphere primitive |
| `/add-cylinder` | POST | Create cylinder primitive |
| `/scene-info` | GET | Get scene information |
| `/objects` | GET | List all objects |
| `/object/:name` | GET | Get object details |
| `/object/:name` | DELETE | Delete object |
| `/execute-code` | POST | Execute custom Python |
| `/screenshot` | GET | Get viewport capture |
| `/conversation/:id` | GET | Get conversation history |
| `/clear-conversation` | POST | Clear conversation |

### Request/Response Examples

#### Health Check
```bash
GET /health
```
```json
{
  "server_running": true,
  "mcp_connected": true,
  "openrouter_configured": true,
  "gemini_configured": false,
  "status": "Connected to Blender MCP"
}
```

#### Chat Request
```bash
POST /chat
Content-Type: application/json

{
  "message": "create a red sphere",
  "conversationId": "session-1",
  "model": "deepseek/deepseek-chat-v3.1:free"
}
```
```json
{
  "success": true,
  "message": "Here's a red sphere...",
  "executionResults": [...],
  "codesExecuted": 1
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| MCP not connecting | Blender not running | Start Blender before backend |
| API key errors | Invalid/missing key | Update server.js with valid key |
| CORS errors | Frontend-backend mismatch | Check CORS configuration |
| Tool execution fails | Python syntax error | Check Blender console for errors |
| Empty scene info | Scene not initialized | Create initial object in Blender |

### Debug Mode

Enable verbose logging:

```bash
# Backend
cd backend
DEBUG=* npm start

# Frontend
cd frontend
npm run dev -- --debug
```

### Checking Logs

Backend logs show:
- MCP connection status
- AI API calls
- Tool execution results
- Error messages

### Manual Blender Connection Test

```bash
# Test MCP server directly
uvx blender-mcp --help
```

---

## System Prompt Engineering

The system uses a carefully engineered prompt that enforces:

1. **Safety**: Validates object existence before manipulation
2. **Error Handling**: Uses `.get()` for safe collection access
3. **Performance**: Leverages `bmesh` for batch operations
4. **Naming**: Enforces descriptive, unique object names
5. **Context Awareness**: Checks scene state before operations

---

## Limitations and Future Work

### Current Limitations
- In-memory conversation storage (not persistent)
- Limited to Blender primitives (no mesh import)
- Single-user (no concurrent session support)
- API keys hardcoded (should use environment variables)

### Future Enhancements
- Persistent storage with database
- Mesh import/export support
- Multi-user collaboration
- Advanced material/shader support
- Animation capabilities

---

## License

This project is for educational and research purposes.

---

## Citation

If you use this system in your research, please cite:

```
AI-Driven Natural Language Interface for 3D Scene Creation
A Model Context Protocol Based Approach for Blender Automation
```

---

## Contact

For questions or issues, please open an issue in the project repository.

---

*Document Version: 1.0*  
*Last Updated: February 2026*
