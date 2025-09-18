// src/services/vectorDB.ts
import { ChromaClient } from 'chromadb';
import { OpenAI } from 'openai';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';
import * as dotenv from 'dotenv';

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

dotenv.config();

export class VectorDatabaseService {
  private client: ChromaClient;
  private openai: OpenAI;
  private embeddingFunction: DefaultEmbeddingFunction;
  private collectionName = 'research_documents';

  constructor() {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    this.client = new ChromaClient({
      path: chromaUrl
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Initialize the default embedding function
    this.embeddingFunction = new DefaultEmbeddingFunction();
  }

  async initialize(): Promise<void> {
    try {
      // Check if collection exists, create if not
      const collections = await this.client.listCollections();
      const exists = collections.some(col => col.name === this.collectionName);
      
      if (!exists) {
        await this.client.createCollection({
          name: this.collectionName,
          embeddingFunction: this.embeddingFunction,
          metadata: {
            description: 'Research documents with embeddings for semantic search'
          }
        });
        console.log(`Created collection: ${this.collectionName} with proper embedding function`);
      } else {
        // If collection exists but was created without embedding function, recreate it
        try {
          await this.client.getCollection({ 
            name: this.collectionName,
            embeddingFunction: this.embeddingFunction
          });
          console.log(`Collection ${this.collectionName} already exists with proper embedding function`);
        } catch (getError) {
          console.log(`Collection ${this.collectionName} exists but needs to be recreated with embedding function`);
          await this.client.deleteCollection({ name: this.collectionName });
          await this.client.createCollection({
            name: this.collectionName,
            embeddingFunction: this.embeddingFunction,
            metadata: {
              description: 'Research documents with embeddings for semantic search'
            }
          });
          console.log(`Recreated collection: ${this.collectionName} with proper embedding function`);
        }
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
      const collection = await this.client.getCollection({ 
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction
      });
      
      // Prepare data for ChromaDB
      const ids = chunks.map(chunk => chunk.id);
      const documents = chunks.map(chunk => chunk.content);
      const metadatas = chunks.map(chunk => chunk.metadata);

      await collection.add({
        ids,
        documents,
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
      const collection = await this.client.getCollection({ 
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction
      });
      
      // Perform similarity search (embedding function handles query embedding)
      const results = await collection.query({
        queryTexts: [query],
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
      const collection = await this.client.getCollection({ 
        name: this.collectionName,
        embeddingFunction: this.embeddingFunction
      });
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
