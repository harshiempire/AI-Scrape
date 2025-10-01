#!/usr/bin/env npx tsx

/**
 * Gemini Setup Helper
 * 
 * This script helps you configure Gemini as your LLM provider
 */

import fs from "fs";
import path from "path";

function setup_gemini_config() {
  console.log("🤖 Gemini Setup Helper");
  console.log("=".repeat(40));
  
  const config_path = path.join(process.cwd(), "config", "config.toml");
  
  if (!fs.existsSync(config_path)) {
    console.error("❌ Config file not found:", config_path);
    return false;
  }
  
  // Read current config
  let config_content = fs.readFileSync(config_path, "utf8");
  
  // Update for Gemini
  config_content = config_content
    .replace(/model = ".*"/, 'model = "gemini-1.5-flash"')
    .replace(/api_type = ".*"/, 'api_type = "gemini"')
    .replace(/base_url = ".*"/, 'base_url = ""');
  
  // Write updated config
  fs.writeFileSync(config_path, config_content);
  
  console.log("✅ Config updated for Gemini!");
  console.log("\n📋 Current Configuration:");
  console.log("- Model: gemini-1.5-flash");
  console.log("- API Type: gemini");
  console.log("- Base URL: (empty for Gemini)");
  
  console.log("\n🔑 Next Steps:");
  console.log("1. Get your Gemini API key from: https://makersuite.google.com/app/apikey");
  console.log("2. Update the api_key in config/config.toml");
  console.log("3. Or set environment variable: export GOOGLE_API_KEY='your_key_here'");
  console.log("4. Run: npm run debug");
  
  return true;
}

function setup_openai_config() {
  console.log("🤖 OpenAI Setup Helper");
  console.log("=".repeat(40));
  
  const config_path = path.join(process.cwd(), "config", "config.toml");
  
  if (!fs.existsSync(config_path)) {
    console.error("❌ Config file not found:", config_path);
    return false;
  }
  
  // Read current config
  let config_content = fs.readFileSync(config_path, "utf8");
  
  // Update for OpenAI
  config_content = config_content
    .replace(/model = ".*"/, 'model = "gpt-4o-mini"')
    .replace(/api_type = ".*"/, 'api_type = "openai"')
    .replace(/base_url = ".*"/, 'base_url = "https://api.openai.com/v1"');
  
  // Write updated config
  fs.writeFileSync(config_path, config_content);
  
  console.log("✅ Config updated for OpenAI!");
  console.log("\n📋 Current Configuration:");
  console.log("- Model: gpt-4o-mini");
  console.log("- API Type: openai");
  console.log("- Base URL: https://api.openai.com/v1");
  
  console.log("\n🔑 Next Steps:");
  console.log("1. Get your OpenAI API key from: https://platform.openai.com/api-keys");
  console.log("2. Update the api_key in config/config.toml");
  console.log("3. Or set environment variable: export OPENAI_API_KEY='your_key_here'");
  console.log("4. Run: npm run debug");
  
  return true;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--gemini') || args.includes('-g')) {
    setup_gemini_config();
  } else if (args.includes('--openai') || args.includes('-o')) {
    setup_openai_config();
  } else {
    console.log("🔧 LLM Configuration Helper");
    console.log("=".repeat(40));
    console.log("\nChoose your LLM provider:");
    console.log("  npm run setup:gemini   # Configure for Google Gemini");
    console.log("  npm run setup:openai   # Configure for OpenAI GPT");
    console.log("\nOr run directly:");
    console.log("  npx tsx setup_gemini.ts --gemini");
    console.log("  npx tsx setup_gemini.ts --openai");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
