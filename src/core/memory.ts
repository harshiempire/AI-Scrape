import { Memory, ChatMessage } from "./types";

export class InMemoryMemory implements Memory {
  private messages: ChatMessage[] = [];

  async load(): Promise<ChatMessage[]> {
    return [...this.messages];
  }

  async store(message: ChatMessage): Promise<void> {
    this.messages.push(message);
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}

export class VectorMemory implements Memory {
  private messages: ChatMessage[] = [];
  // TODO: Implement vector storage for semantic search
  // This would integrate with a vector database like Pinecone, Weaviate, etc.

  async load(): Promise<ChatMessage[]> {
    return [...this.messages];
  }

  async store(message: ChatMessage): Promise<void> {
    this.messages.push(message);
    // TODO: Store embeddings for semantic search
  }

  async clear(): Promise<void> {
    this.messages = [];
  }

  // Additional methods for vector memory
  async searchSimilar(query: string, limit: number = 5): Promise<ChatMessage[]> {
    // TODO: Implement semantic search using vector embeddings
    return this.messages.slice(-limit);
  }
}

export class DatabaseMemory implements Memory {
  // TODO: Implement persistent database storage
  // This would integrate with Prisma/your database of choice

  async load(): Promise<ChatMessage[]> {
    // TODO: Load messages from database
    return [];
  }

  async store(message: ChatMessage): Promise<void> {
    // TODO: Store message in database
  }

  async clear(): Promise<void> {
    // TODO: Clear messages from database
  }
}
