const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

// Utility function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testBackend() {
  console.log(' Testing Blender MCP Backend Server\n');
  
  // Wait a bit for server to fully initialize
  console.log(' Waiting for server to initialize...\n');
  await sleep(2000);

  try {
    // Test 1: Health Check
    console.log(' Testing health check...');
    const health = await axios.get(`${BACKEND_URL}/health`);
    console.log(' Health check response:');
    console.log('   Server running:', health.data.server_running);
    console.log('   MCP connected:', health.data.mcp_connected);
    console.log('   Status:', health.data.status);
    console.log();

    if (!health.data.mcp_connected) {
      console.log(' MCP not connected. Please check:');
      console.log('   1. Blender is open');
      console.log('   2. uvx blender-mcp is installed');
      console.log('   3. Server logs for errors\n');
      return;
    }

    // Test 2: List available tools
    console.log('2️ Testing list tools...');
    const tools = await axios.get(`${BACKEND_URL}/tools`);
    console.log(' Available tools:');
    tools.data.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test 3: Get scene info
    console.log('3️ Testing get scene info...');
    const sceneInfo = await axios.get(`${BACKEND_URL}/scene-info`);
    if (sceneInfo.data.success) {
      console.log(' Scene info retrieved successfully');
      console.log('   Response:', JSON.stringify(sceneInfo.data.data, null, 2).substring(0, 200) + '...');
    } else {
      console.log(' Failed:', sceneInfo.data.error);
    }
    console.log();

    // Test 4: List objects
    console.log(' Testing list objects...');
    const objects = await axios.get(`${BACKEND_URL}/objects`);
    if (objects.data.success) {
      console.log(' Objects retrieved successfully');
      console.log('   Response:', JSON.stringify(objects.data.data, null, 2).substring(0, 200) + '...');
    } else {
      console.log(' Failed:', objects.data.error);
    }
    console.log();

    // Test 5: Add a cube
    console.log(' Testing add cube...');
    const cube = await axios.post(`${BACKEND_URL}/add-cube`, {
      size: 2,
      location: [0, 0, 0]
    });
    if (cube.data.success) {
      console.log(' Cube added successfully!');
    } else {
      console.log(' Failed to add cube:', cube.data.error);
    }
    console.log();

    // Test 6: Add a sphere
    console.log(' Testing add sphere...');
    const sphere = await axios.post(`${BACKEND_URL}/add-sphere`, {
      radius: 1.5,
      location: [3, 0, 0]
    });
    if (sphere.data.success) {
      console.log(' Sphere added successfully!');
    } else {
      console.log(' Failed to add sphere:', sphere.data.error);
    }
    console.log();

    // Test 7: Execute custom code
    console.log(' Testing execute custom code...');
    const customCode = await axios.post(`${BACKEND_URL}/execute-code`, {
      code: 'import bpy\nprint("Hello from Blender!")\nprint(f"Objects in scene: {len(bpy.data.objects)}")'
    });
    if (customCode.data.success) {
      console.log(' Custom code executed successfully!');
      console.log('   Output:', customCode.data.data);
    } else {
      console.log(' Failed:', customCode.data.error);
    }
    console.log();

    // Test 8: Add a cylinder
    console.log(' Testing add cylinder...');
    const cylinder = await axios.post(`${BACKEND_URL}/add-cylinder`, {
      radius: 1,
      depth: 3,
      location: [-3, 0, 0]
    });
    if (cylinder.data.success) {
      console.log(' Cylinder added successfully!');
    } else {
      console.log(' Failed to add cylinder:', cylinder.data.error);
    }
    console.log();

    console.log(' All tests completed!\n');
    console.log(' Check your Blender viewport to see the added objects!');

  } catch (error) {
    console.error(' Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('\n Make sure the backend server is running:');
      console.log('   npm start');
    }
  }
}

// Run tests
testBackend();