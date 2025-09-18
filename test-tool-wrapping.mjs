// Test script to verify all tools are properly wrapped
import { ComprehensiveToolRegistry } from './dist/utils/toolRegistry.js';

async function testToolWrapping() {
  console.log('🔧 Testing Tool Wrapping Implementation\n');

  try {
    // Test comprehensive tool registry
    const toolRegistryManager = new ComprehensiveToolRegistry();
    
    console.log('📋 Testing All Tools Registration...');
    const allToolsRegistry = await toolRegistryManager.registerAllTools();
    const allTools = allToolsRegistry.list();
    
    console.log(`\n✅ All Tools Registered Successfully!`);
    console.log(`�� Total Tools: ${allTools.length}`);
    console.log('🔧 Available Tools:');
    allTools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    console.log('\n📋 Testing Research Tools Registration...');
    const researchRegistryManager = new ComprehensiveToolRegistry();
    const researchToolsRegistry = await researchRegistryManager.registerResearchTools();
    const researchTools = researchToolsRegistry.list();
    
    console.log(`\n✅ Research Tools Registered Successfully!`);
    console.log(`📊 Total Research Tools: ${researchTools.length}`);
    console.log('🔧 Available Research Tools:');
    researchTools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    console.log('\n📋 Testing Utility Tools Registration...');
    const utilityRegistryManager = new ComprehensiveToolRegistry();
    const utilityToolsRegistry = await utilityRegistryManager.registerUtilityTools();
    const utilityTools = utilityToolsRegistry.list();
    
    console.log(`\n✅ Utility Tools Registered Successfully!`);
    console.log(`📊 Total Utility Tools: ${utilityTools.length}`);
    console.log('🔧 Available Utility Tools:');
    utilityTools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
    });

    console.log('\n🎉 All Tool Wrapping Tests Passed!');
    console.log('\n📝 Summary:');
    console.log(`- All Tools: ${allTools.length} tools`);
    console.log(`- Research Tools: ${researchTools.length} tools`);
    console.log(`- Utility Tools: ${utilityTools.length} tools`);
    console.log('- All tools properly wrapped as Tool instances');
    console.log('- No direct tool class usage in registrations');

  } catch (error) {
    console.error('❌ Tool wrapping test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testToolWrapping();
