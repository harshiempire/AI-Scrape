// src/services/backgroundProcessingService.ts
import { DeepResearchQuery, ResearchProgress } from '../agents/researchCoordinatorAgent.js';
import { ResearchSession } from '../workflows/researchWorkflow.js';
import { ResearchMemoryService } from './researchMemory.js';

export interface BackgroundTask {
  id: string;
  type: 'research' | 'analysis' | 'synthesis' | 'cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  data: any;
  error?: string;
}

export interface ProgressCallback {
  (progress: ResearchProgress): void;
}

export interface TaskCallback {
  (task: BackgroundTask): void;
}

export class BackgroundProcessingService {
  private activeSessions = new Map<string, ResearchSession>();
  private progressCallbacks = new Map<string, ProgressCallback[]>();
  private taskCallbacks = new Map<string, TaskCallback[]>();
  private backgroundTasks = new Map<string, BackgroundTask>();
  private isProcessing = false;
  private processingQueue: string[] = [];
  private researchMemory: ResearchMemoryService;

  constructor(researchMemory: ResearchMemoryService) {
    this.researchMemory = researchMemory;
  }

  async startResearchSession(query: DeepResearchQuery, userId: string): Promise<string> {
    const sessionId = this.generateSessionId();
    
    console.log(`🚀 Starting background research session ${sessionId} for user ${userId}`);
    
    try {
      // Store session in persistent storage
      await this.storeSession(sessionId, { 
        query, 
        userId, 
        status: 'starting',
        createdAt: new Date()
      });
      
      // Start background processing
      this.processResearchInBackground(sessionId, query);
      
      return sessionId;
      
    } catch (error) {
      console.error(`❌ Failed to start research session ${sessionId}:`, error);
      throw error;
    }
  }

  async processResearchInBackground(sessionId: string, query: DeepResearchQuery): Promise<void> {
    console.log(`🔄 Processing research in background for session ${sessionId}`);
    
    try {
      // Update status: analyzing
      await this.updateSessionStatus(sessionId, 'analyzing');
      this.emitProgress(sessionId, { 
        sessionId,
        step: 'analyzing', 
        progress: 10,
        currentTask: 'Analyzing query and planning research approach',
        urlsProcessed: [],
        urlsTotal: 0,
        insightsFound: 0
      });
      
      // Create background task
      const task: BackgroundTask = {
        id: sessionId,
        type: 'research',
        status: 'running',
        priority: 'high',
        createdAt: new Date(),
        startedAt: new Date(),
        progress: 10,
        data: { query, sessionId }
      };
      
      this.backgroundTasks.set(sessionId, task);
      this.emitTaskUpdate(task);
      
      // Delegate to research coordinator
      const { ResearchCoordinatorAgent } = await import('../agents/researchCoordinatorAgent.js');
      const { OpenAILLM } = await import('../core/llm.js');
      const { InMemoryMemory } = await import('../core/memory.js');
      const { ToolRegistry } = await import('../core/toolRegistry.js');
      const { Tool } = await import('../core/tool.js');
      const { EnhancedSearchTool } = await import('../tools/enhancedSearchTool.js');
      
      const llm = new OpenAILLM({ 
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY 
      });
      
      const memory = new InMemoryMemory();
      const toolRegistry = new ToolRegistry();
      
      const enhancedSearchTool = new EnhancedSearchTool();
      const searchTool = new Tool({
        name: 'enhanced_search',
        description: 'Enhanced search tool with real-time and semantic search capabilities',
        func: async (input: any) => {
          return await enhancedSearchTool.search(input.query, input.depth || 'medium');
        }
      });
      toolRegistry.register(searchTool);
      
      const coordinator = new ResearchCoordinatorAgent({
        llm,
        memory,
        tools: toolRegistry
      });
      
      // Set up progress tracking
      coordinator.onProgress((progress) => {
        this.emitProgress(sessionId, progress);
        this.updateTaskProgress(sessionId, progress.progress);
      });
      
      const session = await coordinator.conductDeepResearch(query);
      
      // Store session in memory
      await this.researchMemory.storeResearchSession(session, query);
      
      // Update status: completed
      await this.updateSessionStatus(sessionId, 'completed');
      this.emitProgress(sessionId, { 
        sessionId,
        step: 'completed', 
        progress: 100,
        currentTask: 'Research completed successfully',
        urlsProcessed: [],
        urlsTotal: 0,
        insightsFound: session.insights.length
      });
      
      // Update task status
      const completedTask = this.backgroundTasks.get(sessionId);
      if (completedTask) {
        completedTask.status = 'completed';
        completedTask.completedAt = new Date();
        completedTask.progress = 100;
        this.emitTaskUpdate(completedTask);
      }
      
      console.log(`✅ Background research session ${sessionId} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Background research session ${sessionId} failed:`, error);
      
      // Update status: failed
      await this.updateSessionStatus(sessionId, 'failed');
      this.emitProgress(sessionId, { 
        sessionId,
        step: 'failed', 
        progress: 0,
        currentTask: `Research failed: ${(error as Error).message}`,
        urlsProcessed: [],
        urlsTotal: 0,
        insightsFound: 0
      });
      
      // Update task status
      const failedTask = this.backgroundTasks.get(sessionId);
      if (failedTask) {
        failedTask.status = 'failed';
        failedTask.completedAt = new Date();
        failedTask.error = (error as Error).message;
        this.emitTaskUpdate(failedTask);
      }
      
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<{
    status: string;
    progress: number;
    currentTask: string;
    createdAt: Date;
    completedAt?: Date;
  } | null> {
    const task = this.backgroundTasks.get(sessionId);
    if (!task) return null;
    
    return {
      status: task.status,
      progress: task.progress,
      currentTask: task.data?.currentTask || 'Processing...',
      createdAt: task.createdAt,
      completedAt: task.completedAt
    };
  }

  async getActiveSessions(): Promise<string[]> {
    return Array.from(this.backgroundTasks.keys())
      .filter(id => {
        const task = this.backgroundTasks.get(id);
        return task && (task.status === 'running' || task.status === 'pending');
      });
  }

  async cancelSession(sessionId: string): Promise<void> {
    console.log(`🛑 Cancelling research session ${sessionId}`);
    
    const task = this.backgroundTasks.get(sessionId);
    if (task) {
      task.status = 'cancelled';
      task.completedAt = new Date();
      this.emitTaskUpdate(task);
    }
    
    await this.updateSessionStatus(sessionId, 'cancelled');
    this.emitProgress(sessionId, { 
      sessionId,
      step: 'failed', 
      progress: 0,
      currentTask: 'Research session cancelled',
      urlsProcessed: [],
      urlsTotal: 0,
      insightsFound: 0
    });
  }

  async resumeSession(sessionId: string): Promise<void> {
    console.log(`🔄 Resuming research session ${sessionId}`);
    
    const task = this.backgroundTasks.get(sessionId);
    if (!task) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    if (task.status === 'completed') {
      console.log(`Session ${sessionId} already completed`);
      return;
    }
    
    if (task.status === 'failed') {
      // Retry the session
      task.status = 'running';
      task.startedAt = new Date();
      this.emitTaskUpdate(task);
      
      // Resume processing
      this.processResearchInBackground(sessionId, task.data.query);
    }
  }

  // Progress tracking methods
  onProgress(sessionId: string, callback: ProgressCallback): void {
    if (!this.progressCallbacks.has(sessionId)) {
      this.progressCallbacks.set(sessionId, []);
    }
    this.progressCallbacks.get(sessionId)!.push(callback);
  }

  offProgress(sessionId: string, callback: ProgressCallback): void {
    const callbacks = this.progressCallbacks.get(sessionId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  onTaskUpdate(callback: TaskCallback): void {
    if (!this.taskCallbacks.has('global')) {
      this.taskCallbacks.set('global', []);
    }
    this.taskCallbacks.get('global')!.push(callback);
  }

  private emitProgress(sessionId: string, progress: ResearchProgress): void {
    const callbacks = this.progressCallbacks.get(sessionId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          console.error('Error in progress callback:', error);
        }
      });
    }
  }

  private emitTaskUpdate(task: BackgroundTask): void {
    const callbacks = this.taskCallbacks.get('global');
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(task);
        } catch (error) {
          console.error('Error in task callback:', error);
        }
      });
    }
  }

  private updateTaskProgress(sessionId: string, progress: number): void {
    const task = this.backgroundTasks.get(sessionId);
    if (task) {
      task.progress = progress;
      this.emitTaskUpdate(task);
    }
  }

  private generateSessionId(): string {
    return `bg_research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeSession(sessionId: string, data: any): Promise<void> {
    // Store session metadata in memory
    // In a real implementation, this would be stored in a database
    console.log(`💾 Storing session ${sessionId} metadata`);
  }

  private async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    // Update session status in storage
    // In a real implementation, this would update a database
    console.log(`📊 Updating session ${sessionId} status to: ${status}`);
  }

  // Task management methods
  async getTaskStatus(taskId: string): Promise<BackgroundTask | null> {
    return this.backgroundTasks.get(taskId) || null;
  }

  async getAllTasks(): Promise<BackgroundTask[]> {
    return Array.from(this.backgroundTasks.values());
  }

  async getTasksByStatus(status: BackgroundTask['status']): Promise<BackgroundTask[]> {
    return Array.from(this.backgroundTasks.values())
      .filter(task => task.status === status);
  }

  async getTasksByPriority(priority: BackgroundTask['priority']): Promise<BackgroundTask[]> {
    return Array.from(this.backgroundTasks.values())
      .filter(task => task.priority === priority);
  }

  async cleanupCompletedTasks(): Promise<void> {
    console.log(`🧹 Cleaning up completed tasks`);
    
    const completedTasks = Array.from(this.backgroundTasks.values())
      .filter(task => task.status === 'completed' || task.status === 'failed');
    
    completedTasks.forEach(task => {
      this.backgroundTasks.delete(task.id);
    });
    
    console.log(`✅ Cleaned up ${completedTasks.length} completed tasks`);
  }

  async getSystemMetrics(): Promise<{
    activeSessions: number;
    completedTasks: number;
    failedTasks: number;
    averageProcessingTime: number;
    queueLength: number;
  }> {
    const tasks = Array.from(this.backgroundTasks.values());
    const activeSessions = tasks.filter(t => t.status === 'running').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    
    const completedWithTime = tasks.filter(t => t.status === 'completed' && t.startedAt && t.completedAt);
    const averageProcessingTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, task) => {
          return sum + (task.completedAt!.getTime() - task.startedAt!.getTime());
        }, 0) / completedWithTime.length
      : 0;
    
    return {
      activeSessions,
      completedTasks,
      failedTasks,
      averageProcessingTime,
      queueLength: this.processingQueue.length
    };
  }

  // Background processing control
  startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log(`🔄 Starting background processing service`);
    
    // Start processing queue
    this.processQueue();
  }

  stopProcessing(): void {
    this.isProcessing = false;
    console.log(`⏹️ Stopping background processing service`);
  }

  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      if (this.processingQueue.length > 0) {
        const sessionId = this.processingQueue.shift()!;
        // Process the session
        console.log(`🔄 Processing queued session ${sessionId}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  addToQueue(sessionId: string): void {
    this.processingQueue.push(sessionId);
    console.log(`📋 Added session ${sessionId} to processing queue`);
  }
}

export default BackgroundProcessingService;
