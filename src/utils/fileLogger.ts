// src/utils/fileLogger.ts
import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

export class FileLogger {
  private logFilePath: string;
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug?: typeof console.debug;
  };

  constructor(logFilePath?: string) {
    // Default to timestamped log file in project root
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = logFilePath || path.join(process.cwd(), `deep-research-${timestamp}.log`);
    
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
  }

  /**
   * Start logging to file while preserving console output
   */
  startLogging(): void {
    const logToFile = (level: LogEntry['level'], ...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message
      };

      // Write to file
      fs.appendFileSync(this.logFilePath, `${JSON.stringify(logEntry)}\n`);
      
      // Also output to console
      if (this.originalConsole[level]) {
        this.originalConsole[level](...args);
      } else {
        this.originalConsole.log(...args);
      }
    };

    // Override console methods
    console.log = (...args) => logToFile('info', ...args);
    console.error = (...args) => logToFile('error', ...args);
    console.warn = (...args) => logToFile('warn', ...args);
    console.info = (...args) => logToFile('info', ...args);
  }

  /**
   * Stop logging and restore original console
   */
  stopLogging(): void {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
  }

  /**
   * Log a structured entry directly
   */
  log(level: LogEntry['level'], message: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    fs.appendFileSync(this.logFilePath, `${JSON.stringify(logEntry)}\n`);
    if (this.originalConsole[level]) {
      this.originalConsole[level](message, data || '');
    } else {
      this.originalConsole.log(message, data || '');
    }
  }

  /**
   * Get the log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * Write a formatted research session summary
   */
  writeResearchSummary(session: any, query: any): void {
    const summary = {
      timestamp: new Date().toISOString(),
      type: 'RESEARCH_SUMMARY',
      query: {
        text: query.query,
        depth: query.depth,
        strategy: query.strategy,
        focusAreas: query.focusAreas,
        maxResults: query.maxResults,
        context: query.context
      },
      session: {
        id: session.id,
        metadata: session.metadata,
        totalResults: session.results?.length || 0,
        totalInsights: session.insights?.length || 0,
        insights: session.insights?.map((insight: any) => ({
          type: insight.type,
          content: insight.content,
          confidence: insight.confidence,
          tags: insight.tags,
          sources: insight.sources?.length || 0
        })) || []
      },
      topResults: session.results?.flatMap((r: any) => r.fusedResults || [])
        .sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, 10)
        .map((result: any) => ({
          title: result.title,
          url: result.url,
          source: result.source,
          qualityScore: result.qualityScore,
          relevanceScore: result.relevanceScore,
          contentPreview: result.content?.substring(0, 200)
        })) || []
    };

    fs.appendFileSync(this.logFilePath, `\n${'='.repeat(80)}\n`);
    fs.appendFileSync(this.logFilePath, `RESEARCH SESSION SUMMARY\n`);
    fs.appendFileSync(this.logFilePath, `${'='.repeat(80)}\n`);
    fs.appendFileSync(this.logFilePath, `${JSON.stringify(summary, null, 2)}\n`);
    fs.appendFileSync(this.logFilePath, `${'='.repeat(80)}\n\n`);
  }

  /**
   * Write a formatted error report
   */
  writeErrorReport(error: Error, context?: any): void {
    const errorReport = {
      timestamp: new Date().toISOString(),
      type: 'ERROR_REPORT',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    };

    fs.appendFileSync(this.logFilePath, `\n${'='.repeat(80)}\n`);
    fs.appendFileSync(this.logFilePath, `ERROR REPORT\n`);
    fs.appendFileSync(this.logFilePath, `${'='.repeat(80)}\n`);
    fs.appendFileSync(this.logFilePath, `${JSON.stringify(errorReport, null, 2)}\n`);
    fs.appendFileSync(this.logFilePath, `${'='.repeat(80)}\n\n`);
  }
}

export default FileLogger;
