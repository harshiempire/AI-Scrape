#!/usr/bin/env node
// run-deep-research-with-logging.js
import { demonstrateDeepResearchWithFileLogging, demonstrateMultipleResearchSessions } from './dist/examples/deepResearchWithFileLogging.js';

const args = process.argv.slice(2);

console.log('🚀 Deep Research Framework with File Logging');
console.log('=============================================\n');

if (args.includes('--multiple')) {
  console.log('Running multiple research sessions demo...\n');
  demonstrateMultipleResearchSessions()
    .then(() => {
      console.log('\n✅ Multiple sessions demo completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Multiple sessions demo failed:', error);
      process.exit(1);
    });
} else {
  console.log('Running single deep research session demo...\n');
  demonstrateDeepResearchWithFileLogging()
    .then(() => {
      console.log('\n✅ Deep research demo completed!');
      console.log('\nUsage:');
      console.log('  node run-deep-research-with-logging.js          # Single session');
      console.log('  node run-deep-research-with-logging.js --multiple # Multiple sessions');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deep research demo failed:', error);
      process.exit(1);
    });
}
