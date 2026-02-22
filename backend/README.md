# Blender MCP Backend Server - Complete Setup Guide

## 📁 Directory Structure

```
blender-mcp-backend/
│
├── server.js           # Main backend server file
├── test.js            # Test script to verify everything works
├── package.json       # NPM dependencies and scripts
├── .gitignore        # Git ignore file (optional)
└── README.md         # This file (optional)
```

## 📝 File Names and Contents

### 1. `server.js`
Main backend server that communicates with Blender MCP server

### 2. `test.js`
Test script to verify all endpoints are working

### 3. `package.json`
NPM configuration file with dependencies

### 4. `.gitignore` (Optional)
```
node_modules/
.env
*.log
```

## 🚀 Step-by-Step Setup Instructions

### Step 1: Create Project Directory
```bash
mkdir blender-mcp-backend
cd blender-mcp-backend
```

### Step 2: Create All Files

**Create `package.json`:**
```bash
# On Windows (PowerShell)
New-Item package.json

# On Mac/Linux
touch package.json
```

Then paste the package.json content from the artifact.

**Create `server.js`:**
```bash
# On Windows (PowerShell)
New-Item server.js

# On Mac/Linux
touch server.js
```

Then paste the server.js content from the artifact.

**Create `test.js`:**
```bash
# On Windows (PowerShell)
New-Item test.js

# On Mac/Linux
touch test.js
```

Then paste the test.js content from the artifact.

### Step 3: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework
- `axios` - HTTP client
- `@modelcontextprotocol/sdk` - MCP SDK for proper communication
- `nodemon` - Auto-restart server (dev dependency)

### Step 4: Make Sure Blender is Open
**IMPORTANT:** Open Blender before starting the server. The MCP server connects to Blender via stdio.

The server will automatically start the `uvx blender-mcp` connection when it starts.

## ▶️ How to Run

### Option 1: Start the Backend Server
```bash
npm start
```

The server will start on `http://localhost:3000`

You should see:
```
Blender MCP Backend Server running on port 3000
MCP Server URL: http://localhost:9876

Available endpoints:
  GET  /health           - Check MCP server connectivity
  GET  /tools            - List available tools
  POST /execute          - Execute any tool
  POST /add-cube         - Add a cube to the scene
  ...
```

### Option 2: Start in Development Mode (Auto-restart)
```bash
npm run dev
```

This uses `nodemon` to automatically restart the server when you make changes.

### Option 3: Run Tests
**In a NEW terminal window** (keep the server running), run:
```bash
npm test
```

This will test all endpoints and verify everything is working.

## 🧪 Testing the Server

### Method 1: Using the Test Script
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Run tests
npm test
```

### Method 2: Using cURL
```bash
# Check health
curl http://localhost:3000/health

# List available tools
curl http://localhost:3000/tools

# Add a cube
curl -X POST http://localhost:3000/add-cube \
  -H "Content-Type: application/json" \
  -d "{\"size\": 2, \"location\": [0, 0, 0]}"

# Get scene info
curl http://localhost:3000/scene-info

# Execute custom code
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"import bpy\\nbpy.ops.mesh.primitive_cone_add()\"}"
```

### Method 3: Using Postman or Insomnia
1. Import the endpoints
2. Test each endpoint individually

### Method 4: Using Browser (for GET requests)
- Visit: `http://localhost:3000/health`
- Visit: `http://localhost:3000/tools`
- Visit: `http://localhost:3000/scene-info`

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Body Example |
|--------|----------|-------------|--------------|
| GET | `/health` | Check MCP server connectivity | - |
| GET | `/tools` | List available tools | - |
| POST | `/execute` | Execute any tool | `{"tool": "get_scene_info", "params": {}}` |
| POST | `/add-cube` | Add a cube | `{"size": 2, "location": [0, 0, 0]}` |
| POST | `/add-sphere` | Add a sphere | `{"radius": 1, "location": [0, 0, 0]}` |
| GET | `/scene-info` | Get scene information | - |
| GET | `/object-info/:name` | Get object info | - |
| POST | `/execute-code` | Execute Python code | `{"code": "import bpy\nprint('Hello')"}` |
| GET | `/screenshot` | Get viewport screenshot | - |

## 🔧 Troubleshooting

### Problem: "Cannot find module 'express'"
**Solution:** Run `npm install`

### Problem: "ECONNREFUSED" or server not reachable
**Solution:** Make sure Blender MCP server is running on port 9876

### Problem: Port 3000 already in use
**Solution:** Change the port in server.js or set environment variable:
```bash
PORT=4000 npm start
```

### Problem: MCP server not responding
**Solution:** 
- Check if Blender is open
- Verify MCP server is running with `uvx blender-mcp`
- Check port 9876 is correct

## 📦 Quick Start (Copy-Paste All Commands)

```bash
# Create directory
mkdir blender-mcp-backend
cd blender-mcp-backend

# Create files (you'll need to paste the content into each file)
touch package.json server.js test.js

# Install dependencies
npm install

# Start server
npm start

# In another terminal, run tests
npm test
```

## 🎯 Next Steps

1. **Start the server**: `npm start`
2. **Test connectivity**: `npm test`
3. **Try adding objects**: Use the `/add-cube` or `/add-sphere` endpoints
4. **Execute custom code**: Use `/execute-code` endpoint
5. **Build your own endpoints**: Modify `server.js` to add more functionality

## 💡 How to Use the API

### Using cURL (Command Line)

#### 1. Check if everything is working
```bash
curl http://localhost:3000/health
```

#### 2. List all available tools
```bash
curl http://localhost:3000/tools
```

#### 3. Add objects to Blender

**Add a Cube:**
```bash
curl -X POST http://localhost:3000/add-cube \
  -H "Content-Type: application/json" \
  -d '{"size": 2, "location": [0, 0, 0]}'
```

**Add a Sphere:**
```bash
curl -X POST http://localhost:3000/add-sphere \
  -H "Content-Type: application/json" \
  -d '{"radius": 1.5, "location": [3, 0, 0]}'
```

**Add a Cylinder:**
```bash
curl -X POST http://localhost:3000/add-cylinder \
  -H "Content-Type: application/json" \
  -d '{"radius": 1, "depth": 3, "location": [-3, 0, 0]}'
```

#### 4. Get scene information
```bash
curl http://localhost:3000/scene-info
```

#### 5. List all objects in the scene
```bash
curl http://localhost:3000/objects
```

#### 6. Get information about a specific object
```bash
curl http://localhost:3000/object-info/Cube
```

#### 7. Execute custom Blender Python code

**Add a colored cube:**
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nbpy.ops.mesh.primitive_cube_add(location=(0,0,0))\nobj = bpy.context.active_object\nmat = bpy.data.materials.new(name=\"Red\")\nmat.diffuse_color = (1, 0, 0, 1)\nobj.data.materials.append(mat)"}'
```

**Create multiple objects:**
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nfor i in range(5):\n    bpy.ops.mesh.primitive_cube_add(location=(i*2, 0, 0))"}'
```

#### 8. Delete an object
```bash
curl -X DELETE http://localhost:3000/object/Cube
```

#### 9. Take a screenshot
```bash
curl http://localhost:3000/screenshot
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Add a cube
async function addCube() {
  const response = await axios.post(`${API_URL}/add-cube`, {
    size: 3,
    location: [5, 0, 0]
  });
  console.log('Cube added:', response.data);
}

// Add a sphere
async function addSphere() {
  const response = await axios.post(`${API_URL}/add-sphere`, {
    radius: 2,
    location: [0, 5, 0]
  });
  console.log('Sphere added:', response.data);
}

// Get all objects
async function listObjects() {
  const response = await axios.get(`${API_URL}/objects`);
  console.log('Objects:', response.data);
}

// Execute custom Blender code
async function customCode() {
  const response = await axios.post(`${API_URL}/execute-code`, {
    code: `
import bpy
# Create a pyramid of cubes
for i in range(3):
    for j in range(3-i):
        bpy.ops.mesh.primitive_cube_add(location=(j*2, i*2, i*2))
`
  });
  console.log('Custom code executed:', response.data);
}

// Run examples
async function runExamples() {
  await addCube();
  await addSphere();
  await listObjects();
  await customCode();
}

runExamples();
```

### Using Python

```python
import requests
import json

API_URL = "http://localhost:3000"

# Add a cube
def add_cube():
    response = requests.post(f"{API_URL}/add-cube", 
        json={"size": 2, "location": [0, 0, 0]})
    print("Cube added:", response.json())

# Add a sphere
def add_sphere():
    response = requests.post(f"{API_URL}/add-sphere",
        json={"radius": 1.5, "location": [3, 0, 0]})
    print("Sphere added:", response.json())

# Get scene info
def get_scene_info():
    response = requests.get(f"{API_URL}/scene-info")
    print("Scene info:", response.json())

# Execute custom code
def execute_custom_code():
    code = """
import bpy
# Add a material to active object
obj = bpy.context.active_object
if obj:
    mat = bpy.data.materials.new(name="BlueMaterial")
    mat.diffuse_color = (0, 0, 1, 1)
    obj.data.materials.append(mat)
"""
    response = requests.post(f"{API_URL}/execute-code", 
        json={"code": code})
    print("Code executed:", response.json())

# Run examples
if __name__ == "__main__":
    add_cube()
    add_sphere()
    get_scene_info()
    execute_custom_code()
```

### Using Postman or Thunder Client

1. **Import these endpoints:**
   - Method: `POST`
   - URL: `http://localhost:3000/add-cube`
   - Body (JSON):
     ```json
     {
       "size": 2,
       "location": [0, 0, 0]
     }
     ```

2. **For custom code:**
   - Method: `POST`
   - URL: `http://localhost:3000/execute-code`
   - Body (JSON):
     ```json
     {
       "code": "import bpy\nbpy.ops.mesh.primitive_cone_add()"
     }
     ```

## 🎨 Cool Examples to Try

### 1. Create a Grid of Cubes
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nfor x in range(-5, 6, 2):\n    for y in range(-5, 6, 2):\n        bpy.ops.mesh.primitive_cube_add(location=(x, y, 0))"}'
```

### 2. Create a Spiral
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nimport math\nfor i in range(20):\n    angle = i * 0.5\n    x = math.cos(angle) * i * 0.5\n    y = math.sin(angle) * i * 0.5\n    bpy.ops.mesh.primitive_cube_add(location=(x, y, i * 0.5))"}'
```

### 3. Add a Colored Sphere with Animation
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nbpy.ops.mesh.primitive_uv_sphere_add(location=(0, 0, 0))\nobj = bpy.context.active_object\nmat = bpy.data.materials.new(name=\"GreenMat\")\nmat.diffuse_color = (0, 1, 0, 1)\nobj.data.materials.append(mat)"}'
```

### 4. Create a Random Scene
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nimport random\nfor i in range(10):\n    x = random.uniform(-5, 5)\n    y = random.uniform(-5, 5)\n    z = random.uniform(0, 5)\n    choice = random.choice([\"cube\", \"sphere\", \"cylinder\"])\n    if choice == \"cube\":\n        bpy.ops.mesh.primitive_cube_add(location=(x, y, z))\n    elif choice == \"sphere\":\n        bpy.ops.mesh.primitive_uv_sphere_add(location=(x, y, z))\n    else:\n        bpy.ops.mesh.primitive_cylinder_add(location=(x, y, z))"}'
```

### 5. Clear All Objects
```bash
curl -X POST http://localhost:3000/execute-code \
  -H "Content-Type: application/json" \
  -d '{"code": "import bpy\nbpy.ops.object.select_all(action=\"SELECT\")\nbpy.ops.object.delete()"}'
```

## 📞 Support

If you encounter any issues:
1. Check that Blender MCP server is running
2. Verify all files are created correctly
3. Make sure all dependencies are installed
4. Check the console for error messages

---

**That's it! You're ready to control Blender from your backend server! 🎉**