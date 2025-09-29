import { log } from "../logger";
import { ProductionResearchConfig } from "./production_deep_research_agent";

export interface EnvironmentConfig {
  // API Keys
  openai_api_key?: string;
  serpapi_key?: string;
  bing_search_key?: string;
  google_search_key?: string;
  google_search_engine_id?: string;
  
  // Performance settings
  max_concurrent_searches?: number;
  max_concurrent_scrapes?: number;
  enable_cache?: boolean;
  cache_ttl_seconds?: number;
  requests_per_second?: number;
  burst_limit?: number;
  max_memory_mb?: number;
  
  // Research settings
  min_source_authority?: number;
  confidence_threshold?: number;
  min_cross_validation?: number;
  use_browser_for_js?: boolean;
  respect_robots_txt?: boolean;
  scraping_delay_ms?: number;
  
  // Output settings
  default_citation_style?: "apa" | "mla" | "chicago" | "ieee";
  include_performance_metrics?: boolean;
  save_intermediate_results?: boolean;
  
  // Logging
  log_level?: string;
  log_to_file?: boolean;
  debug_mode?: boolean;
}

export class ResearchConfigLoader {
  static load_from_env(): EnvironmentConfig {
    const config: EnvironmentConfig = {};

    // API Keys
    config.openai_api_key = process.env.OPENAI_API_KEY;
    config.serpapi_key = process.env.SERPAPI_KEY;
    config.bing_search_key = process.env.BING_SEARCH_KEY;
    config.google_search_key = process.env.GOOGLE_SEARCH_KEY;
    config.google_search_engine_id = process.env.GOOGLE_SEARCH_ENGINE_ID;

    // Performance settings with defaults
    config.max_concurrent_searches = parseInt(process.env.MAX_CONCURRENT_SEARCHES || "5");
    config.max_concurrent_scrapes = parseInt(process.env.MAX_CONCURRENT_SCRAPES || "3");
    config.enable_cache = process.env.ENABLE_CACHE !== "false";
    config.cache_ttl_seconds = parseInt(process.env.CACHE_TTL_SECONDS || "3600");
    config.requests_per_second = parseInt(process.env.REQUESTS_PER_SECOND || "10");
    config.burst_limit = parseInt(process.env.BURST_LIMIT || "20");
    config.max_memory_mb = parseInt(process.env.MAX_MEMORY_MB || "512");

    // Research settings
    config.min_source_authority = parseInt(process.env.MIN_SOURCE_AUTHORITY || "6");
    config.confidence_threshold = parseFloat(process.env.CONFIDENCE_THRESHOLD || "0.75");
    config.min_cross_validation = parseInt(process.env.MIN_CROSS_VALIDATION || "2");
    config.use_browser_for_js = process.env.USE_BROWSER_FOR_JS === "true";
    config.respect_robots_txt = process.env.RESPECT_ROBOTS_TXT !== "false";
    config.scraping_delay_ms = parseInt(process.env.SCRAPING_DELAY_MS || "2000");

    // Output settings
    const citation_style = process.env.DEFAULT_CITATION_STYLE as any;
    config.default_citation_style = ["apa", "mla", "chicago", "ieee"].includes(citation_style) ? citation_style : "apa";
    config.include_performance_metrics = process.env.INCLUDE_PERFORMANCE_METRICS !== "false";
    config.save_intermediate_results = process.env.SAVE_INTERMEDIATE_RESULTS === "true";

    // Logging
    config.log_level = process.env.LOG_LEVEL || "info";
    config.log_to_file = process.env.LOG_TO_FILE !== "false";
    config.debug_mode = process.env.DEBUG_MODE === "true";

    return config;
  }

  static create_production_config(env_config?: EnvironmentConfig): ProductionResearchConfig {
    const env = env_config || this.load_from_env();

    // Determine available search engines based on API keys
    const search_engines = ["duckduckgo"]; // Always available
    if (env.serpapi_key) search_engines.push("serpapi");
    if (env.bing_search_key) search_engines.push("bing");
    if (env.google_search_key && env.google_search_engine_id) search_engines.push("google");

    const config: ProductionResearchConfig = {
      name: "ProductionResearchAgent",
      
      // Search configuration
      search_engines,
      search_apis: {
        serpapi_key: env.serpapi_key,
        bing_key: env.bing_search_key,
        google_key: env.google_search_key,
        google_search_engine_id: env.google_search_engine_id,
      },
      
      // Research parameters
      max_sources_per_subquery: 15,
      max_scraping_depth: 10,
      confidence_threshold: env.confidence_threshold || 0.75,
      min_cross_validation: env.min_cross_validation || 2,
      citation_style: env.default_citation_style || "apa",
      min_source_authority: env.min_source_authority || 6,
      require_recent_sources: true,
      max_bias_tolerance: 0.3,
      
      // Scraping configuration
      use_browser_for_js_sites: env.use_browser_for_js || false,
      respect_robots_txt: env.respect_robots_txt ?? true,
      scraping_delay: env.scraping_delay_ms || 2000,
      
      // Performance configuration
      performance: {
        max_concurrent_searches: env.max_concurrent_searches || 5,
        max_concurrent_scrapes: env.max_concurrent_scrapes || 3,
        search_timeout: 30000,
        scrape_timeout: 60000,
        cache_enabled: env.enable_cache ?? true,
        cache_ttl: env.cache_ttl_seconds || 3600,
        rate_limiting: {
          requests_per_second: env.requests_per_second || 10,
          burst_limit: env.burst_limit || 20,
        },
        memory_management: {
          max_memory_usage: env.max_memory_mb || 512,
          cleanup_interval: 300,
        },
        adaptive_batching: true,
      },
    };

    return config;
  }

  static validate_config(config: ProductionResearchConfig): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check critical requirements
    if (!config.search_engines || config.search_engines.length === 0) {
      errors.push("No search engines configured");
    }

    if (config.search_engines.length === 1 && config.search_engines[0] === "duckduckgo") {
      warnings.push("Only DuckDuckGo available - consider adding premium search APIs for better results");
    }

    // Check thresholds
    if (config.confidence_threshold && config.confidence_threshold > 0.9) {
      warnings.push("Very high confidence threshold may result in incomplete research");
    }

    if (config.min_source_authority && config.min_source_authority > 8) {
      warnings.push("Very high authority requirement may limit available sources");
    }

    // Check performance settings
    if (config.performance?.max_concurrent_searches && config.performance.max_concurrent_searches > 10) {
      warnings.push("High concurrent search limit may trigger rate limiting");
    }

    // Check memory settings
    if (config.performance?.memory_management?.max_memory_usage && config.performance.memory_management.max_memory_usage < 256) {
      warnings.push("Low memory limit may impact performance for large research tasks");
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  }

  static log_config_status(config: ProductionResearchConfig): void {
    const validation = this.validate_config(config);
    
    log.info("=== RESEARCH AGENT CONFIGURATION ===");
    log.info(`Search Engines: ${config.search_engines?.join(', ') || 'None'}`);
    log.info(`Max Sources per Query: ${config.max_sources_per_subquery}`);
    log.info(`Confidence Threshold: ${(config.confidence_threshold || 0) * 100}%`);
    log.info(`Citation Style: ${config.citation_style?.toUpperCase()}`);
    log.info(`Browser Rendering: ${config.use_browser_for_js_sites ? 'Enabled' : 'Disabled'}`);
    log.info(`Performance Caching: ${config.performance?.cache_enabled ? 'Enabled' : 'Disabled'}`);
    
    if (validation.warnings.length > 0) {
      log.warn("Configuration Warnings:");
      validation.warnings.forEach(warning => log.warn(`- ${warning}`));
    }
    
    if (validation.errors.length > 0) {
      log.error("Configuration Errors:");
      validation.errors.forEach(error => log.error(`- ${error}`));
    }
    
    log.info("=====================================");
  }

  // Preset configurations for different use cases
  static get_preset_config(preset: 'fast' | 'thorough' | 'academic' | 'business'): Partial<ProductionResearchConfig> {
    const presets = {
      fast: {
        max_sources_per_subquery: 8,
        max_scraping_depth: 5,
        confidence_threshold: 0.6,
        use_browser_for_js_sites: false,
        performance: {
          max_concurrent_searches: 8,
          max_concurrent_scrapes: 4,
          cache_enabled: true,
        },
      },
      
      thorough: {
        max_sources_per_subquery: 25,
        max_scraping_depth: 20,
        confidence_threshold: 0.85,
        min_cross_validation: 3,
        use_browser_for_js_sites: true,
        performance: {
          max_concurrent_searches: 6,
          max_concurrent_scrapes: 3,
          cache_enabled: true,
          cache_ttl: 7200,
        },
      },
      
      academic: {
        max_sources_per_subquery: 20,
        max_scraping_depth: 15,
        confidence_threshold: 0.8,
        min_source_authority: 8,
        citation_style: "apa" as const,
        require_recent_sources: false, // Academic research values historical sources
        performance: {
          cache_enabled: true,
          cache_ttl: 3600,
        },
      },
      
      business: {
        max_sources_per_subquery: 15,
        max_scraping_depth: 10,
        confidence_threshold: 0.7,
        require_recent_sources: true,
        citation_style: "chicago" as const,
        performance: {
          max_concurrent_searches: 10,
          adaptive_batching: true,
        },
      },
    };

    return presets[preset];
  }

  // Dynamic configuration based on query analysis
  static analyze_query_and_configure(query: string): Partial<ProductionResearchConfig> {
    const lower_query = query.toLowerCase();
    const words = query.split(/\s+/).length;
    
    let config: Partial<ProductionResearchConfig> = {};

    // Adjust based on query complexity
    if (words > 20) {
      config.max_sources_per_subquery = 25;
      config.max_scraping_depth = 20;
      config.confidence_threshold = 0.8;
    } else if (words > 10) {
      config.max_sources_per_subquery = 15;
      config.max_scraping_depth = 10;
      config.confidence_threshold = 0.75;
    } else {
      config.max_sources_per_subquery = 10;
      config.max_scraping_depth = 8;
      config.confidence_threshold = 0.7;
    }

    // Adjust based on query type
    if (lower_query.includes('academic') || lower_query.includes('research') || lower_query.includes('study')) {
      config = { ...config, ...this.get_preset_config('academic') };
    } else if (lower_query.includes('business') || lower_query.includes('market') || lower_query.includes('economic')) {
      config = { ...config, ...this.get_preset_config('business') };
    } else if (lower_query.includes('quick') || lower_query.includes('summary')) {
      config = { ...config, ...this.get_preset_config('fast') };
    }

    // Adjust for temporal requirements
    if (lower_query.includes('latest') || lower_query.includes('current') || lower_query.includes('2024') || lower_query.includes('recent')) {
      config.require_recent_sources = true;
    }

    // Adjust for depth requirements
    if (lower_query.includes('comprehensive') || lower_query.includes('detailed') || lower_query.includes('thorough')) {
      config = { ...config, ...this.get_preset_config('thorough') };
    }

    return config;
  }
}