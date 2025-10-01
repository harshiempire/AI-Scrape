import { log } from "../logger";
import { ResearchPlan, ResearchSubquery } from "./planner";
import { SearchResult } from "./tools/web_search";
import { ScrapedContent } from "./tools/web_scraper";

// Performance optimization configuration
export interface PerformanceConfig {
  max_concurrent_searches: number;
  max_concurrent_scrapes: number;
  search_timeout: number; // milliseconds
  scrape_timeout: number; // milliseconds
  cache_enabled: boolean;
  cache_ttl: number; // seconds
  rate_limiting: {
    requests_per_second: number;
    burst_limit: number;
  };
  memory_management: {
    max_memory_usage: number; // MB
    cleanup_interval: number; // seconds
  };
  adaptive_batching: boolean;
}

export interface PerformanceMetrics {
  total_execution_time: number;
  search_time: number;
  scraping_time: number;
  synthesis_time: number;
  cache_hit_rate: number;
  memory_usage: number;
  concurrent_operations: number;
  throughput: number; // operations per second
}

// Cache implementation
class ResearchCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
    new Map();
  private hit_count: number = 0;
  private miss_count: number = 0;

  set(key: string, data: any, ttl: number = 3600): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      this.miss_count++;
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.miss_count++;
      return null;
    }

    this.hit_count++;
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.hit_count = 0;
    this.miss_count = 0;
  }

  get_hit_rate(): number {
    const total = this.hit_count + this.miss_count;
    return total > 0 ? this.hit_count / total : 0;
  }

  get_size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Rate limiter implementation
class RateLimiter {
  private tokens: number;
  private last_refill: number;
  private requests_per_second: number;
  private burst_limit: number;

  constructor(requests_per_second: number, burst_limit: number) {
    this.requests_per_second = requests_per_second;
    this.burst_limit = burst_limit;
    this.tokens = burst_limit;
    this.last_refill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for next token
    const wait_time = 1000 / this.requests_per_second;
    await new Promise((resolve) => setTimeout(resolve, wait_time));
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.last_refill) / 1000;
    const tokens_to_add = elapsed * this.requests_per_second;

    this.tokens = Math.min(this.burst_limit, this.tokens + tokens_to_add);
    this.last_refill = now;
  }
}

// Batch processor for efficient parallel operations
class BatchProcessor<T, R> {
  private batch_size: number;
  private max_concurrent: number;
  private active_batches: number = 0;

  constructor(batch_size: number, max_concurrent: number) {
    this.batch_size = batch_size;
    this.max_concurrent = max_concurrent;
  }

  async process_batch(
    items: T[],
    processor: (item: T) => Promise<R>,
    on_progress?: (completed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const batches = this.create_batches(items);
    let completed = 0;

    for (const batch of batches) {
      // Wait if we've reached max concurrent batches
      while (this.active_batches >= this.max_concurrent) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.active_batches++;

      // Process batch in parallel
      const batch_promise = Promise.all(
        batch.map(async (item) => {
          try {
            return await processor(item);
          } catch (error) {
            log.warn("Batch item processing failed:", error);
            return null;
          }
        })
      ).then((batch_results) => {
        this.active_batches--;
        completed += batch.length;
        if (on_progress) {
          on_progress(completed, items.length);
        }
        return batch_results.filter((r) => r !== null) as R[];
      });

      results.push(...(await batch_promise));
    }

    return results;
  }

  private create_batches(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.batch_size) {
      batches.push(items.slice(i, i + this.batch_size));
    }
    return batches;
  }
}

export class PerformanceOptimizer {
  private config: PerformanceConfig;
  private cache: ResearchCache;
  private rate_limiter: RateLimiter;
  private batch_processor: BatchProcessor<any, any>;
  private metrics: PerformanceMetrics;
  private memory_monitor: NodeJS.Timeout | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      max_concurrent_searches: config.max_concurrent_searches || 5,
      max_concurrent_scrapes: config.max_concurrent_scrapes || 3,
      search_timeout: config.search_timeout || 30000,
      scrape_timeout: config.scrape_timeout || 45000,
      cache_enabled: config.cache_enabled ?? true,
      cache_ttl: config.cache_ttl || 3600,
      rate_limiting: {
        requests_per_second: config.rate_limiting?.requests_per_second || 10,
        burst_limit: config.rate_limiting?.burst_limit || 20,
      },
      memory_management: {
        max_memory_usage: config.memory_management?.max_memory_usage || 512,
        cleanup_interval: config.memory_management?.cleanup_interval || 300,
      },
      adaptive_batching: config.adaptive_batching ?? true,
    };

    this.cache = new ResearchCache();
    this.rate_limiter = new RateLimiter(
      this.config.rate_limiting.requests_per_second,
      this.config.rate_limiting.burst_limit
    );
    this.batch_processor = new BatchProcessor(
      3,
      this.config.max_concurrent_searches
    );

    this.metrics = {
      total_execution_time: 0,
      search_time: 0,
      scraping_time: 0,
      synthesis_time: 0,
      cache_hit_rate: 0,
      memory_usage: 0,
      concurrent_operations: 0,
      throughput: 0,
    };

    this.start_memory_monitoring();
    log.info("Performance optimizer initialized");
  }

  // Optimize research plan execution order
  optimize_execution_plan(plan: ResearchPlan): ResearchSubquery[] {
    const subqueries = [...plan.subqueries];

    if (!this.config.adaptive_batching) {
      return subqueries.sort((a, b) => b.priority - a.priority);
    }

    // Create dependency graph
    const dependency_map = new Map<string, string[]>();
    subqueries.forEach((sq) => {
      dependency_map.set(sq.id, sq.dependencies || []);
    });

    // Topological sort with priority weighting
    const sorted: ResearchSubquery[] = [];
    const visited = new Set<string>();
    const temp_visited = new Set<string>();

    const visit = (subquery: ResearchSubquery) => {
      if (temp_visited.has(subquery.id)) {
        throw new Error("Circular dependency detected");
      }
      if (visited.has(subquery.id)) {
        return;
      }

      temp_visited.add(subquery.id);

      const dependencies = dependency_map.get(subquery.id) || [];
      const dep_subqueries = dependencies
        .map((dep_id) => subqueries.find((sq) => sq.id === dep_id))
        .filter((sq) => sq !== undefined) as ResearchSubquery[];

      dep_subqueries.forEach(visit);

      temp_visited.delete(subquery.id);
      visited.add(subquery.id);
      sorted.push(subquery);
    };

    // Sort by priority first, then apply topological sort
    const priority_sorted = subqueries.sort((a, b) => b.priority - a.priority);
    priority_sorted.forEach((sq) => {
      if (!visited.has(sq.id)) {
        visit(sq);
      }
    });

    return sorted;
  }

  // Optimized parallel search execution
  async execute_searches_optimized(
    subqueries: ResearchSubquery[],
    search_function: (query: string) => Promise<SearchResult[]>
  ): Promise<Map<string, SearchResult[]>> {
    const start_time = Date.now();
    const results = new Map<string, SearchResult[]>();

    const search_with_cache = async (
      subquery: ResearchSubquery
    ): Promise<{ id: string; results: SearchResult[] }> => {
      const cache_key = `search:${subquery.query}`;

      // Check cache first
      if (this.config.cache_enabled) {
        const cached = this.cache.get(cache_key);
        if (cached) {
          log.debug(`Cache hit for search: ${subquery.query}`);
          return { id: subquery.id, results: cached };
        }
      }

      // Rate limiting
      await this.rate_limiter.acquire();

      // Execute search with timeout
      const search_results = await Promise.race([
        search_function(subquery.query),
        new Promise<SearchResult[]>((_, reject) =>
          setTimeout(
            () => reject(new Error("Search timeout")),
            this.config.search_timeout
          )
        ),
      ]);

      // Cache results
      if (this.config.cache_enabled) {
        this.cache.set(cache_key, search_results, this.config.cache_ttl);
      }

      return { id: subquery.id, results: search_results };
    };

    // Execute searches in optimized batches
    const search_results = await this.batch_processor.process_batch(
      subqueries,
      search_with_cache,
      (completed, total) => {
        log.debug(`Search progress: ${completed}/${total}`);
      }
    );

    // Organize results by subquery ID
    search_results.forEach((result) => {
      if (result) {
        results.set(result.id, result.results);
      }
    });

    this.metrics.search_time = Date.now() - start_time;
    log.info(`Optimized searches completed in ${this.metrics.search_time}ms`);

    return results;
  }

  // Optimized parallel scraping execution
  async execute_scraping_optimized(
    urls: string[],
    scrape_function: (url: string) => Promise<ScrapedContent>
  ): Promise<ScrapedContent[]> {
    const start_time = Date.now();

    const scrape_with_cache = async (
      url: string
    ): Promise<ScrapedContent | null> => {
      const cache_key = `scrape:${url}`;

      // Check cache first
      if (this.config.cache_enabled) {
        const cached = this.cache.get(cache_key);
        if (cached) {
          log.debug(`Cache hit for scrape: ${url}`);
          return cached;
        }
      }

      // Rate limiting
      await this.rate_limiter.acquire();

      try {
        // Execute scrape with timeout
        const scraped_content = await Promise.race([
          scrape_function(url),
          new Promise<ScrapedContent>((_, reject) =>
            setTimeout(
              () => reject(new Error("Scrape timeout")),
              this.config.scrape_timeout
            )
          ),
        ]);

        // Cache results
        if (this.config.cache_enabled) {
          this.cache.set(cache_key, scraped_content, this.config.cache_ttl);
        }

        return scraped_content;
      } catch (error) {
        log.warn(`Scraping failed for ${url}:`, error);
        return null;
      }
    };

    // Create batch processor for scraping
    const scrape_processor = new BatchProcessor<string, ScrapedContent | null>(
      2, // Smaller batches for scraping
      this.config.max_concurrent_scrapes
    );

    const scraping_results = await scrape_processor.process_batch(
      urls,
      scrape_with_cache,
      (completed, total) => {
        log.debug(`Scraping progress: ${completed}/${total}`);
      }
    );

    const valid_results = scraping_results.filter(
      (r) => r !== null
    ) as ScrapedContent[];

    this.metrics.scraping_time = Date.now() - start_time;
    log.info(`Optimized scraping completed in ${this.metrics.scraping_time}ms`);

    return valid_results;
  }

  // Memory-efficient synthesis processing
  async execute_synthesis_optimized<T>(
    data: any,
    synthesis_function: (data: any) => Promise<T>
  ): Promise<T> {
    const start_time = Date.now();

    // Check memory usage before synthesis
    const memory_before = process.memoryUsage().heapUsed;

    if (
      memory_before >
      this.config.memory_management.max_memory_usage * 1024 * 1024
    ) {
      log.warn("High memory usage detected, forcing garbage collection");
      if (global.gc) {
        global.gc();
      }
    }

    const result = await synthesis_function(data);

    this.metrics.synthesis_time = Date.now() - start_time;
    this.metrics.memory_usage = process.memoryUsage().heapUsed / (1024 * 1024); // MB

    log.info(
      `Optimized synthesis completed in ${this.metrics.synthesis_time}ms`
    );

    return result;
  }

  // Adaptive batch size optimization
  optimize_batch_sizes(operation_times: number[]): {
    search_batch: number;
    scrape_batch: number;
  } {
    if (operation_times.length === 0) {
      return { search_batch: 3, scrape_batch: 2 };
    }

    const avg_time =
      operation_times.reduce((a, b) => a + b, 0) / operation_times.length;
    const target_time = 5000; // 5 seconds per batch

    const optimal_search_batch = Math.max(
      1,
      Math.min(10, Math.floor(target_time / avg_time))
    );
    const optimal_scrape_batch = Math.max(
      1,
      Math.min(5, Math.floor(optimal_search_batch / 2))
    );

    return {
      search_batch: optimal_search_batch,
      scrape_batch: optimal_scrape_batch,
    };
  }

  // Performance metrics collection
  get_performance_metrics(): PerformanceMetrics {
    this.metrics.cache_hit_rate = this.cache.get_hit_rate();
    this.metrics.memory_usage = process.memoryUsage().heapUsed / (1024 * 1024); // MB

    const total_time =
      this.metrics.search_time +
      this.metrics.scraping_time +
      this.metrics.synthesis_time;
    this.metrics.total_execution_time = total_time;

    if (total_time > 0) {
      this.metrics.throughput = 1000 / total_time; // operations per second
    }

    return { ...this.metrics };
  }

  // Memory monitoring and cleanup
  private start_memory_monitoring(): void {
    this.memory_monitor = setInterval(() => {
      const memory_usage = process.memoryUsage().heapUsed / (1024 * 1024); // MB

      if (memory_usage > this.config.memory_management.max_memory_usage) {
        log.warn(`High memory usage: ${memory_usage.toFixed(2)}MB`);
        this.cleanup();
      }

      // Regular cache cleanup
      this.cache.cleanup();
    }, this.config.memory_management.cleanup_interval * 1000);
  }

  private cleanup(): void {
    // Clear cache if memory usage is too high
    if (this.cache.get_size() > 100) {
      this.cache.clear();
      log.info("Cache cleared due to high memory usage");
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      log.debug("Forced garbage collection");
    }
  }

  // Resource management
  dispose(): void {
    if (this.memory_monitor) {
      clearInterval(this.memory_monitor);
      this.memory_monitor = null;
    }

    this.cache.clear();
    log.info("Performance optimizer disposed");
  }

  // Cache management methods
  clear_cache(): void {
    this.cache.clear();
    log.info("Research cache cleared");
  }

  get_cache_stats(): { size: number; hit_rate: number } {
    return {
      size: this.cache.get_size(),
      hit_rate: this.cache.get_hit_rate(),
    };
  }

  // Configuration updates
  update_config(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
    log.info("Performance optimizer configuration updated");
  }

  // Performance analysis
  analyze_bottlenecks(): {
    bottleneck: string;
    recommendations: string[];
  } {
    const metrics = this.get_performance_metrics();
    const times = {
      search: metrics.search_time,
      scraping: metrics.scraping_time,
      synthesis: metrics.synthesis_time,
    };

    const bottleneck = Object.entries(times).reduce((a, b) =>
      times[a[0] as keyof typeof times] > times[b[0] as keyof typeof times]
        ? a
        : b
    )[0];

    const recommendations: string[] = [];

    switch (bottleneck) {
      case "search":
        recommendations.push("Increase concurrent search limit");
        recommendations.push("Enable caching if not already enabled");
        recommendations.push("Optimize search query complexity");
        break;
      case "scraping":
        recommendations.push("Increase concurrent scraping limit");
        recommendations.push("Reduce scraping timeout");
        recommendations.push("Implement content filtering to scrape less data");
        break;
      case "synthesis":
        recommendations.push("Optimize synthesis algorithms");
        recommendations.push(
          "Implement streaming synthesis for large datasets"
        );
        recommendations.push("Increase memory limits if needed");
        break;
    }

    if (metrics.memory_usage > 256) {
      recommendations.push("Implement more aggressive memory management");
    }

    if (metrics.cache_hit_rate < 0.3) {
      recommendations.push("Increase cache TTL for better hit rates");
    }

    return { bottleneck, recommendations };
  }
}
