// src/services/vectorDB.ts
import { ChromaClient } from 'chromadb';
import { OpenAI } from 'openai';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    url: string;
    title?: string;
    domain: string;
    publishDate?: string;
    author?: string;
    contentType: 'article' | 'forum' | 'social' | 'documentation' | 'news';
    language: string;
    quality: number;
    chunkIndex: number;
    totalChunks: number;
  };
  embeddings?: number[];
}

export class VectorDatabaseService {
  private client: ChromaClient;
  private openai: OpenAI;
  private collectionName = 'research_documents';

  constructor() {

    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    this.client = new ChromaClient({
      path: chromaUrl
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async initialize(): Promise<void> {
    try {
      // Check if collection exists, create if not
      const collections = await this.client.listCollections();
      const exists = collections.some(col => col.name === this.collectionName);
      
      if (!exists) {
        await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Research documents with embeddings for semantic search'
          }
        });
        console.log(`Created collection: ${this.collectionName}`);
      } else {
        console.log(`Collection ${this.collectionName} already exists`);
      }
    } catch (error) {
      console.error('Failed to initialize VectorDB:', error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float'
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      throw error;
    }
  }

  async storeDocuments(chunks: DocumentChunk[]): Promise<void> {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      // Generate embeddings for all chunks
      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.generateEmbeddings(texts);
      
      // Prepare data for ChromaDB
      const ids = chunks.map(chunk => chunk.id);
      const documents = chunks.map(chunk => chunk.content);
      const metadatas = chunks.map(chunk => chunk.metadata);

      await collection.add({
        ids,
        documents,
        embeddings,
        metadatas
      });

      console.log(`Stored ${chunks.length} document chunks in VectorDB`);
    } catch (error) {
      console.error('Failed to store documents:', error);
      throw error;
    }
  }

  async semanticSearch(
    query: string, 
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<DocumentChunk[]> {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbeddings([query]);
      
      // Perform similarity search
      const results = await collection.query({
        queryEmbeddings: queryEmbedding,
        nResults: limit,
        where: filters
      });

      // Transform results back to DocumentChunk format
      const chunks: DocumentChunk[] = [];
      
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          chunks.push({
            id: results.ids[0][i] || '',
            content: results.documents[0][i] || '',
            metadata: results.metadatas[0][i] as DocumentChunk['metadata'],
            embeddings: results.embeddings?.[0]?.[i] || undefined
          });
        }
      }

      return chunks;
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      throw error;
    }
  }

  async getCollectionStats(): Promise<{ count: number }> {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      const count = await collection.count();
      return { count };
    } catch (error) {
      console.error('Failed to get collection stats:', error);
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
      console.log(`Cleared collection: ${this.collectionName}`);
    } catch (error) {
      console.error('Failed to clear collection:', error);
      throw error;
    }
  }
}
