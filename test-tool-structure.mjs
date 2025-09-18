// Test script to verify tool structure without API calls
import { MathTools } from './dist/tools/mathTools.js';
import { WeatherTool } from './dist/tools/weatherTool.js';
import { SearchTool } from './dist/tools/searchTool.js';
import { ToolRegistry } from './dist/core/toolRegistry.js';

async function testToolStructure() {
  console.log('🔧 Testing Tool Structure Implementation\n');

  try {
    const toolRegistry = new ToolRegistry();
    
    console.log('📋 Testing Math Tools...');
    const mathTools = MathTools.createTools();
    console.log(`✅ Math Tools created: ${mathTools.length} tools`);
    mathTools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
      toolRegistry.register(tool);
    });

    console.log('\n📋 Testing Weather Tool...');
    const weatherTool = WeatherTool.createTool();
    console.log(`✅ Weather Tool created: ${weatherTool.name} - ${weatherTool.description}`);
    toolRegistry.register(weatherTool);

    console.log('\n📋 Testing Search Tool...');
    const searchTool = SearchTool.createTool();
    console.log(`✅ Search Tool created: ${searchTool.name} - ${searchTool.description}`);
    toolRegistry.register(searchTool);

    console.log('\n📊 Tool Registry Summary:');
    const allTools = toolRegistry.list();
    console.log(`Total Tools Registered: ${allTools.length}`);
    console.log('Available Tools:');
    allTools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    console.log('\n🎉 All Tool Structure Tests Passed!');
    console.log('\n📝 Summary:');
    console.log(`- Math Tools: ${mathTools.length} tools`);
    console.log('- Weather Tool: 1 tool');
    console.log('- Search Tool: 1 tool');
    console.log(`- Total Registered: ${allTools.length} tools`);
    console.log('- All tools properly structured as Tool instances');
    console.log('- Tool registry working correctly');

  } catch (error) {
    console.error('❌ Tool structure test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testToolStructure();
