import path from "path";
import fs from "fs";
import * as toml from "@iarna/toml";
import { fileURLToPath } from 'url';
import { LLMSettings } from "../schema";

function get_project_root() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..");
}

const PROJECT_ROOT = get_project_root();

class Config {
  private static _instance: Config;
  private _config: any;
  // private _lock
  private _initialized: boolean = false;

  constructor() {
    if (!this._initialized) {
      this._config = undefined;
      this._load_initial_config();
      this._initialized = true;
    }
  }

  static getInstance(): Config {
    if (!this._instance) {
      this._instance = new Config();
      return this._instance;
    }
    return this._instance;
  }

  private static _get_config_path() {
    const root = PROJECT_ROOT;
    const toml_path = path.join(root, "config", "config.toml");
    const json_path = path.join(root, "config", "config.json");
    
    if (fs.existsSync(toml_path)) {
      return toml_path;
    }
    if (fs.existsSync(json_path)) {
      return json_path;
    }
    return null;
  }
  private _load_config() {
    const configPath = Config._get_config_path();

    if (!configPath) {
      throw new Error(`Config file not found at: ${configPath}`);
    }

    try {
      const configBuffer = fs.readFileSync(configPath);

      const configData = toml.parse(configBuffer.toString("utf8"));

      return configData;
    } catch (error) {
      throw new Error(`Failed to load TOML config file: ${error}`);
    }
  }

  private _load_initial_config() {
    const raw_config = this._load_config();
    const base_llm = (raw_config.llm as toml.JsonMap) || {};

    // Dictionary comprehension equivalent
    const llm_overrides = Object.fromEntries(
      Object.entries((raw_config.llm as toml.JsonMap) || {}).filter(
        ([k, v]) => typeof v === "object" && v !== null
      )
    ) as toml.JsonMap;

    const default_settings = {
      model: base_llm.model as string,
      base_url: base_llm.base_url as string,
      api_key: base_llm.api_key as string,
      max_tokens: (base_llm.max_tokens as number) || 4096,
      max_input_tokens: base_llm.max_input_tokens as number,
      temperature: (base_llm.temperature as number) || 1.0,
      api_type: (base_llm.api_type as string) || "",
      api_version: (base_llm.api_version as string) || "",
    };

    // Handle browser config
    const browser_config = (raw_config.browser as toml.JsonMap) || {};
    let browser_settings: any = null;

    if (Object.keys(browser_config).length > 0) {
      // Handle proxy settings
      const proxy_config = (browser_config.proxy as toml.JsonMap) || {};
      let proxy_settings: any = null;

      if (Object.keys(proxy_config).length > 0 && proxy_config.server) {
        // Dictionary comprehension for proxy settings
        const proxy_params = Object.fromEntries(
          Object.entries(proxy_config).filter(
            ([k, v]) =>
              ["server", "username", "password"].includes(k) && v !== null
          )
        );

        // TODO: Implement ProxySettings class
        // proxy_settings = new ProxySettings(proxy_params);
        proxy_settings = proxy_params; // Placeholder
      }

      // Filter valid browser config parameters
      // TODO: Define BrowserSettings class with __annotations__ equivalent
      const valid_browser_params = Object.fromEntries(
        Object.entries(browser_config).filter(([k, v]) => {
          // TODO: Replace with actual BrowserSettings field validation
          const validParams = ["headless", "user_agent", "viewport"]; // Example
          return validParams.includes(k) && v !== null;
        })
      );

      // If there is proxy settings, add it to the parameters
      if (proxy_settings) {
        valid_browser_params["proxy"] = proxy_settings;
      }

      // Only create BrowserSettings when there are valid parameters
      if (Object.keys(valid_browser_params).length > 0) {
        // TODO: Implement BrowserSettings class
        // browser_settings = new BrowserSettings(valid_browser_params);
        browser_settings = valid_browser_params; // Placeholder
      }
    }

    // Handle search config
    const search_config = (raw_config.search as toml.JsonMap) || {};
    let search_settings: any = null;
    if (Object.keys(search_config).length > 0) {
      // TODO: Implement SearchSettings class
      // search_settings = new SearchSettings(search_config);
      search_settings = search_config; // Placeholder
    }

    // Handle sandbox config
    const sandbox_config = (raw_config.sandbox as toml.JsonMap) || {};
    let sandbox_settings: any;
    if (Object.keys(sandbox_config).length > 0) {
      // TODO: Implement SandboxSettings class
      // sandbox_settings = new SandboxSettings(sandbox_config);
      sandbox_settings = sandbox_config; // Placeholder
    } else {
      // TODO: Implement SandboxSettings class
      // sandbox_settings = new SandboxSettings();
      sandbox_settings = {}; // Placeholder
    }

    // Handle daytona config
    const daytona_config = (raw_config.daytona as toml.JsonMap) || {};
    let daytona_settings: any;
    if (Object.keys(daytona_config).length > 0) {
      // TODO: Implement DaytonaSettings class
      // daytona_settings = new DaytonaSettings(daytona_config);
      daytona_settings = daytona_config; // Placeholder
    } else {
      // TODO: Implement DaytonaSettings class
      // daytona_settings = new DaytonaSettings();
      daytona_settings = {}; // Placeholder
    }

    // Handle MCP config
    const mcp_config = (raw_config.mcp as toml.JsonMap) || {};
    let mcp_settings: any;
    if (Object.keys(mcp_config).length > 0) {
      // Load server configurations from JSON
      // TODO: Implement MCPSettings.load_server_config() method
      // mcp_config["servers"] = MCPSettings.load_server_config();
      mcp_config["servers"] = {}; // Placeholder

      // TODO: Implement MCPSettings class
      // mcp_settings = new MCPSettings(mcp_config);
      mcp_settings = mcp_config; // Placeholder
    } else {
      // TODO: Implement MCPSettings class
      // mcp_settings = new MCPSettings({ servers: MCPSettings.load_server_config() });
      mcp_settings = { servers: {} }; // Placeholder
    }

    // Handle run flow config
    const run_flow_config = (raw_config.runflow as toml.JsonMap) || {};
    let run_flow_settings: any;
    if (Object.keys(run_flow_config).length > 0) {
      // TODO: Implement RunflowSettings class
      // run_flow_settings = new RunflowSettings(run_flow_config);
      run_flow_settings = run_flow_config; // Placeholder
    } else {
      // TODO: Implement RunflowSettings class
      // run_flow_settings = new RunflowSettings();
      run_flow_settings = {}; // Placeholder
    }

    // Build final config dictionary with dictionary comprehension
    const config_dict = {
      llm: {
        default: default_settings,
        ...Object.fromEntries(
          Object.entries(llm_overrides).map(([name, override_config]) => [
            name,
            //Fix this type error later
            { ...default_settings, ...(override_config as any) },
          ])
        ),
      },
      sandbox: sandbox_settings,
      browser_config: browser_settings,
      search_config: search_settings,
      mcp_config: mcp_settings,
      run_flow_config: run_flow_settings,
      daytona_config: daytona_settings,
    };

    // TODO: Implement AppConfig class
    // this._config = new AppConfig(config_dict);
    this._config = config_dict; // Placeholder
  }

  llm(): Record<string, LLMSettings> {
    return this._config.llm;
  }
}

export default Config.getInstance();
