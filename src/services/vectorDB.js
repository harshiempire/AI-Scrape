// src/services/vectorDB.ts
import { ChromaClient } from 'chromadb';
import { OpenAI } from 'openai';
export class VectorDatabaseService {
    client;
    openai;
    collectionName = 'research_documents';
    constructor() {
        this.client = new ChromaClient({
            path: 'http://localhost:8000' // Default ChromaDB port
        });
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async initialize() {
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
            }
            else {
                console.log(`Collection ${this.collectionName} already exists`);
            }
        }
        catch (error) {
            console.error('Failed to initialize VectorDB:', error);
            throw error;
        }
    }
    async generateEmbeddings(texts) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: texts,
                encoding_format: 'float'
            });
            return response.data.map(item => item.embedding);
        }
        catch (error) {
            console.error('Failed to generate embeddings:', error);
            throw error;
        }
    }
    async storeDocuments(chunks) {
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
        }
        catch (error) {
            console.error('Failed to store documents:', error);
            throw error;
        }
    }
    async semanticSearch(query, limit = 10, filters) {
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
            const chunks = [];
            if (results.ids && results.ids[0]) {
                for (let i = 0; i < results.ids[0].length; i++) {
                    chunks.push({
                        id: results.ids[0][i] || '',
                        content: results.documents[0][i] || '',
                        metadata: results.metadatas[0][i],
                        embeddings: results.embeddings?.[0]?.[i] || undefined
                    });
                }
            }
            return chunks;
        }
        catch (error) {
            console.error('Failed to perform semantic search:', error);
            throw error;
        }
    }
    async getCollectionStats() {
        try {
            const collection = await this.client.getCollection({ name: this.collectionName });
            const count = await collection.count();
            return { count };
        }
        catch (error) {
            console.error('Failed to get collection stats:', error);
            throw error;
        }
    }
    async clearCollection() {
        try {
            await this.client.deleteCollection({ name: this.collectionName });
            console.log(`Cleared collection: ${this.collectionName}`);
        }
        catch (error) {
            console.error('Failed to clear collection:', error);
            throw error;
        }
    }
}
