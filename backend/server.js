const express = require('express');
const cors = require('cors');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const axios = require('axios');
// require('dotenv').config();

const app = express();

// Configure CORS to accept requests from any origin
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'HTTP-Referer', 'X-Title']
}));

app.use(express.json());

let mcpClient = null;
let isConnected = false;
let availableTools = [];

// OpenRouter API configuration
const OPENROUTER_API_KEY = 'sk-or-v1-xxxx';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Google Gemini API configuration
const GEMINI_API_KEY = 'AIzxxxx'; // Replace with actual Gemini API key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

// System prompt for the AI
const SYSTEM_PROMPT = `You are now a specialized Python code generator and tool orchestrator for Blender 4.4.
Your sole purpose is to receive user requests and respond **only** with the appropriate tool calls:
- Generate Blender Python scripts via execute_blender_code().
---

General Rules:
- Before performing operations on existing objects, first call:
    get_scene_info()
    to inspect the current scene.
- Never assume objects exist; check their presence using:
    bpy.data.objects.get("ObjectName")
    instead of direct indexing to avoid key errors.
- Always use .get(name) patterns for safe access to collections or data.
- After adding or importing objects, check their world_bounding_box to:
    - Ensure they are not clipping into other objects.
    - Adjust their position, scale, or rotation to fit the scene properly.
- When creating new objects:
    - Use descriptive, unique names (e.g., "GlassSphere", "TopAreaLight").
    - If a name conflict is detected, append suffixes like _1, _2, etc.
- Never assume items are selected; always explicitly select or reference objects as needed.
- Wrap critical operations in try-except blocks when there’s a risk of failure, especially when modifying mesh data or calling external tools.

---

Advanced Code Expectations:
- For advanced mesh editing, use the bmesh module to access, create, or modify mesh elements (vertices, edges, faces) directly.
    - Always update the mesh and free the bmesh to apply changes.
- For calculations involving positions, offsets, or rotations, use the mathutils module (e.g., Vector, Matrix, Quaternion) instead of manual math.
- Use scalar values for scalar inputs; use tuples/lists only for vector inputs.
- Set node inputs by name (e.g., bsdf.inputs["Transmission"]), not by index.
- Handle missing objects gracefully by generating fallback creation code.
- Limit each tool call to one or two focused operations; avoid overloading responses.
- For repeated operations or large datasets, avoid object mode and batch edits using bmesh for better performance.


Undo & Redo:
- Use ed.undo and ed.redo **only when explicitly requested**.

---

For reference here are some of the available bpy operations:
- Object Manipulation:
    object.add, object.duplicate, object.delete, object.select_all,
    object.shade_smooth, object.shade_flat, object.origin_set, object.transform_apply, object.mode_set.
- Primitive Creation:
    mesh.primitive_cube_add, mesh.primitive_uv_sphere_add, mesh.primitive_plane_add, mesh.primitive_cylinder_add, mesh.primitive_torus_add.
- Materials & Shaders:
    material.new, object.material_slot_add, object.material_slot_assign.
- Lighting:
    object.light_add.
- View & Camera:
    view3d.view_selected, view3d.view_all, view3d.view_camera, view3d.snap_cursor_to_selected, view3d.cursor3d, view3d.render_border.
- Animation:
    screen.frame_jump, screen.keyframe_jump, screen.animation_play, screen.animation_cancel, screen.animation_step,
    anim.keyframe_insert, anim.keyframe_delete.
- Transformations:
    transform.translate, transform.rotate, transform.resize.
- Parenting & Grouping:
    object.parent_set, object.join.

---

Summary:
- Always validate scene state.
- Use .get() for safe access.
- Check and adjust bounding boxes.
- Use bmesh for advanced, efficient mesh editing.
- Use mathutils for 3D vector and transformation calculations.
- Free and update bmesh after edits.
- Wrap risky operations in try-except blocks.
- Batch large edits for performance.
- Use descriptive, unique names.
- Keep tool calls focused and clean.
- Provide only tool calls (Python code or external tools) — no explanations or extra text.`;

// Initialize MCP client connection
async function initializeMCPClient() {
  try {
    console.log('🔌 Connecting to Blender MCP server...');
    
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
    
    console.log('✅ Connected to Blender MCP server successfully!');
    
    // List available tools
    const tools = await mcpClient.listTools();
    availableTools = tools.tools;
    console.log(`📦 Available tools: ${tools.tools.map(t => t.name).join(', ')}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MCP server:', error.message);
    isConnected = false;
    return false;
  }
}

// Call a tool on the MCP server
async function callTool(toolName, args = {}) {
  if (!isConnected || !mcpClient) {
    return {
      success: false,
      error: 'MCP client not connected. Please restart the server.'
    };
  }

  try {
    const result = await mcpClient.callTool({
      name: toolName,
      arguments: args
    });
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
}

// Extract Python code from AI response
function extractPythonCode(text) {
  const codeBlockRegex = /```python\n([\s\S]*?)\n```/g;
  const matches = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

// Call OpenRouter API
async function callOpenRouter(messages, model) {
  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: model || 'deepseek/deepseek-chat-v3.1:free', // Use the provided model or default
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Blender MCP Chat'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw new Error(`OpenRouter API failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Call Gemini API
async function callGemini(messages) {
  try {
    // Format messages for Gemini API (remove system prompt and convert to parts)
    const formattedMessages = messages.filter(msg => msg.role !== 'system').map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'user' and 'model' roles
      parts: [{ text: msg.content }]
    }));

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw new Error(`Gemini API failed: ${error.response?.data?.error?.message || error.message}`);
  }
}

// Store conversation history (in-memory, you might want to use a database)
const conversations = new Map();

// API Routes

// Health check endpoint
app.get('/health', async (req, res) => {
  res.json({
    server_running: true,
    mcp_connected: isConnected,
    openrouter_configured: !!OPENROUTER_API_KEY,
    gemini_configured: !!GEMINI_API_KEY,
    status: isConnected ? 'Connected to Blender MCP' : 'Not connected to MCP server'
  });
});

// List available tools
app.get('/tools', async (req, res) => {
  if (!isConnected) {
    return res.status(503).json({ error: 'MCP client not connected' });
  }

  try {
    const tools = await mcpClient.listTools();
    res.json({
      tools: tools.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint - Main AI interaction
app.post('/chat', async (req, res) => {
  const { message, conversationId = 'default', model } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file' });
  }

  if (!isConnected) {
    return res.status(503).json({ error: 'Blender MCP server not connected' });
  }

  try {
    // Get or create conversation history
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, [
        { role: 'system', content: SYSTEM_PROMPT }
      ]);
    }
    
    const conversationHistory = conversations.get(conversationId);
    
    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });

    console.log(`\n💬 User: ${message}`);
    console.log(`🤖 Using model: ${model || 'default (deepseek/deepseek-chat-v3.1:free)'}`);

    // Demo mode: Check for specific chair request
    let aiResponse;
    if (message.toLowerCase().includes('chair')) {
      console.log('🎯 Demo mode: Detected chair request');
      aiResponse = `Sure! Here's a simple chair for you! 🪑\n\n\`\`\`python\nimport bpy\n\n# Create chair seat\nbpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))\nseat = bpy.context.active_object\nseat.name = "Chair_Seat"\nseat.scale = (1, 1, 0.1)\n\n# Create chair back\nbpy.ops.mesh.primitive_cube_add(size=2, location=(0, -0.9, 2))\nback = bpy.context.active_object\nback.name = "Chair_Back"\nback.scale = (1, 0.1, 1)\n\n# Create leg 1\nbpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=2, location=(0.8, 0.8, 0))\nleg1 = bpy.context.active_object\nleg1.name = "Chair_Leg1"\n\n# Create leg 2\nbpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=2, location=(-0.8, 0.8, 0))\nleg2 = bpy.context.active_object\nleg2.name = "Chair_Leg2"\n\n# Create leg 3\nbpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=2, location=(0.8, -0.8, 0))\nleg3 = bpy.context.active_object\nleg3.name = "Chair_Leg3"\n\n# Create leg 4\nbpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=2, location=(-0.8, -0.8, 0))\nleg4 = bpy.context.active_object\nleg4.name = "Chair_Leg4"\n\nprint("Chair created successfully!")\n\`\`\`\n\nI've created a simple chair with a seat, backrest, and four legs! ✨`;
    } else {
      // Determine which API to use based on the model
      if (model && (model.includes('gemini') || model.includes('Gemini'))) {
        // Check if Gemini API key is configured
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
          return res.status(500).json({ error: 'Gemini API key not configured. Please update the GEMINI_API_KEY in server.js' });
        }
        console.log('🤖 Calling Gemini API...');
        aiResponse = await callGemini(conversationHistory);
      } else {
        console.log('🤖 Calling OpenRouter API...');
        aiResponse = await callOpenRouter(conversationHistory, model);
      }
    }
    
    console.log(`🤖 AI Response: ${aiResponse.substring(0, 200)}...`);

    // Add AI response to history
    conversationHistory.push({ role: 'assistant', content: aiResponse });

    // Extract Python code from response
    const pythonCodes = extractPythonCode(aiResponse);
    
    const executionResults = [];
    
    // Execute each code block in Blender
    if (pythonCodes.length > 0) {
      console.log(`⚡ Executing ${pythonCodes.length} code block(s) in Blender...`);
      
      for (let i = 0; i < pythonCodes.length; i++) {
        const code = pythonCodes[i];
        console.log(`\n📝 Executing code block ${i + 1}:\n${code}\n`);
        
        const result = await callTool('execute_blender_code', { code });
        executionResults.push({
          code: code,
          success: result.success,
          output: result.data,
          error: result.error
        });
        
        if (result.success) {
          console.log(`✅ Code block ${i + 1} executed successfully`);
        } else {
          console.log(`❌ Code block ${i + 1} failed: ${result.error}`);
        }
      }
    } else {
      console.log('ℹ️  No code blocks found in AI response');
    }

    // Return response
    res.json({
      success: true,
      message: aiResponse,
      executionResults: executionResults,
      codesExecuted: pythonCodes.length
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Clear conversation history
app.post('/clear-conversation', (req, res) => {
  const { conversationId = 'default' } = req.body;
  conversations.delete(conversationId);
  res.json({ success: true, message: 'Conversation cleared' });
});

// Get conversation history
app.get('/conversation/:conversationId?', (req, res) => {
  const conversationId = req.params.conversationId || 'default';
  const history = conversations.get(conversationId) || [];
  res.json({ 
    conversationId,
    messages: history.filter(msg => msg.role !== 'system') // Don't return system prompt
  });
});

// Execute a tool directly (bypass AI)
app.post('/execute', async (req, res) => {
  const { tool, args } = req.body;

  if (!tool) {
    return res.status(400).json({ error: 'Tool name is required' });
  }

  const result = await callTool(tool, args || {});
  res.json(result);
});

// Add a cube (direct endpoint)
app.post('/add-cube', async (req, res) => {
  const { size = 2, location = [0, 0, 0] } = req.body;
  
  const code = `import bpy\nbpy.ops.mesh.primitive_cube_add(size=${size}, location=(${location.join(', ')}))`;
  
  const result = await callTool('execute_blender_code', { code });
  res.json(result);
});

// Add a sphere (direct endpoint)
app.post('/add-sphere', async (req, res) => {
  const { radius = 1, location = [0, 0, 0] } = req.body;
  
  const code = `import bpy\nbpy.ops.mesh.primitive_uv_sphere_add(radius=${radius}, location=(${location.join(', ')}))`;
  
  const result = await callTool('execute_blender_code', { code });
  res.json(result);
});

// Add a cylinder (direct endpoint)
app.post('/add-cylinder', async (req, res) => {
  const { radius = 1, depth = 2, location = [0, 0, 0] } = req.body;
  
  const code = `import bpy\nbpy.ops.mesh.primitive_cylinder_add(radius=${radius}, depth=${depth}, location=(${location.join(', ')}))`;
  
  const result = await callTool('execute_blender_code', { code });
  res.json(result);
});

// Get scene info
app.get('/scene-info', async (req, res) => {
  const result = await callTool('get_scene_info');
  res.json(result);
});

// Get object info
app.get('/object-info/:objectName', async (req, res) => {
  const result = await callTool('get_object_info', { 
    object_name: req.params.objectName 
  });
  res.json(result);
});

// Execute arbitrary Blender Python code (direct endpoint)
app.post('/execute-code', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const result = await callTool('execute_blender_code', { code });
  res.json(result);
});

// Get viewport screenshot
app.get('/screenshot', async (req, res) => {
  const result = await callTool('get_viewport_screenshot');
  res.json(result);
});

// Delete object
app.delete('/object/:objectName', async (req, res) => {
  const code = `import bpy
obj = bpy.data.objects.get("${req.params.objectName}")
if obj:
    bpy.data.objects.remove(obj, do_unlink=True)
    print("Object deleted")
else:
    print("Object not found")`;
  
  const result = await callTool('execute_blender_code', { code });
  res.json(result);
});

// List all objects in scene
app.get('/objects', async (req, res) => {
  const code = `import bpy
import json
objects = [{"name": obj.name, "type": obj.type, "location": list(obj.location)} for obj in bpy.data.objects]
print(json.dumps(objects))`;
  
  const result = await callTool('execute_blender_code', { code });
  res.json(result);
});

const PORT = 3000;

// Start server and initialize MCP connection
async function startServer() {
  // Initialize MCP client first
  await initializeMCPClient();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Blender MCP Backend Server running on port ${PORT}`);
    console.log(`📡 MCP Connection Status: ${isConnected ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`🤖 OpenRouter API: ${OPENROUTER_API_KEY ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`🤖 Gemini API: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Not Configured'}`);
    console.log('\n📋 Available endpoints:');
    console.log('  🤖 AI Chat:');
    console.log('    POST /chat                   - Chat with AI to control Blender');
    console.log('    GET  /conversation/:id       - Get conversation history');
    console.log('    POST /clear-conversation     - Clear conversation history');
    console.log('\n  🔧 Direct Control:');
    console.log('    GET  /health                 - Check server status');
    console.log('    GET  /tools                  - List all available tools');
    console.log('    POST /execute                - Execute any tool directly');
    console.log('    POST /add-cube               - Add a cube to the scene');
    console.log('    POST /add-sphere             - Add a sphere to the scene');
    console.log('    POST /add-cylinder           - Add a cylinder to the scene');
    console.log('    GET  /scene-info             - Get scene information');
    console.log('    GET  /objects                - List all objects in scene');
    console.log('    GET  /object-info/:name      - Get specific object information');
    console.log('    DELETE /object/:name         - Delete an object from scene');
    console.log('    POST /execute-code           - Execute custom Python code');
    console.log('    GET  /screenshot             - Get viewport screenshot');
    console.log('\n💡 Try: curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" -d \'{"message": "create a red cube"}\'\n');
  });
}

startServer();
