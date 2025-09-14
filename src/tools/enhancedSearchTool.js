// src/tools/enhancedSearchTool.ts
import { z } from "zod";
import { Tool } from "../core/tool.js";
import axios from "axios";
import { getJson } from "serpapi";
import fs from "fs";
import { fetchRenderedHtml } from "./renderHtml.js";
import { parseHtmlToMarkdown } from "./htmlParse.js";
import { VectorDatabaseService } from "../services/vectorDB.js";
import { ContentChunker } from "../services/contentChunker.js";
import { RetryService, UserAgentService } from "../services/retryService.js";
export class EnhancedSearchTool {
    vectorDB;
    chunker;
    isInitialized = false;
    constructor() {
        this.vectorDB = new VectorDatabaseService();
        this.chunker = new ContentChunker();
    }
    static createTool() {
        const instance = new EnhancedSearchTool();
        return new Tool({
            name: "enhanced_search",
            description: "Advanced search with real-time results and semantic search capabilities",
            schema: z.object({
                query: z.string().describe("Search query"),
                useVectorDB: z.boolean().optional().default(true).describe("Whether to use vector database for semantic search"),
                maxResults: z.number().optional().default(10).describe("Maximum number of results to return"),
                storeResults: z.boolean().optional().default(true).describe("Whether to store new results in vector database")
            }),
            func: async (input) => {
                const { query, useVectorDB, maxResults, storeResults } = input;
                return await instance.search(query, { useVectorDB, maxResults, storeResults });
            },
        });
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            await this.vectorDB.initialize();
            this.isInitialized = true;
            console.log('Enhanced Search Tool initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize Enhanced Search Tool:', error);
            throw error;
        }
    }
    async search(query, options = {}) {
        const startTime = Date.now();
        const { useVectorDB = true, maxResults = 10, storeResults = true } = options;
        await this.initialize();
        try {
            // 1. Get real-time search results
            const realTimeResults = await this.getRealTimeResults(query);
            // 2. Get semantic search results (if enabled)
            let semanticResults = [];
            if (useVectorDB) {
                semanticResults = await this.vectorDB.semanticSearch(query, maxResults);
            }
            // 3. Store new real-time results in vector DB (if enabled)
            if (storeResults && realTimeResults.length > 0) {
                await this.storeRealTimeResults(realTimeResults);
            }
            // 4. Fuse results intelligently
            const fusedResults = this.fuseResults(realTimeResults, semanticResults, maxResults);
            // 5. Get metadata
            const vectorDBCount = await this.vectorDB.getCollectionStats().then(stats => stats.count).catch(() => 0);
            return {
                realTimeResults,
                semanticResults,
                fusedResults,
                metadata: {
                    totalRealTimeResults: realTimeResults.length,
                    totalSemanticResults: semanticResults.length,
                    searchTime: Date.now() - startTime,
                    vectorDBCount
                }
            };
        }
        catch (error) {
            console.error('Error in enhanced search:', error);
            throw error;
        }
    }
    async getRealTimeResults(query) {
        try {
            const linksResponse = await this.searchSerpApi(query);
            const organicResults = Array.isArray(linksResponse?.["organic_results"])
                ? linksResponse["organic_results"] : [];
            if (organicResults.length === 0) {
                throw new Error("No organic results found from search API.");
            }
            const links = organicResults
                .map((item) => {
                if (item &&
                    typeof item === "object" &&
                    "link" in item &&
                    typeof item.link === "string") {
                    return item.link;
                }
                return null;
            })
                .filter((link) => typeof link === "string");
            // Use enhanced fetching with retry logic
            const parsedResults = await this.smartFetchAndParse(links);
            // Save results for debugging
            fs.writeFileSync("htmlResults_final.json", JSON.stringify(parsedResults, null, 2));
            return parsedResults;
        }
        catch (error) {
            console.error('Error getting real-time results:', error);
            throw error;
        }
    }
    async smartFetchAndParse(links) {
        const allPromises = links.map((link) => RetryService.withRetry(async () => {
            const staticHtml = await this.getStaticHtml(link);
            let parsed = parseHtmlToMarkdown(staticHtml);
            if (parsed.markdownContent.length < 250) {
                console.log(`[!] Static content for ${link} is too short. Falling back to rendered fetch.`);
                const renderedHtml = await fetchRenderedHtml(link);
                parsed = parseHtmlToMarkdown(renderedHtml);
            }
            return parsed;
        }, {
            maxRetries: 2,
            baseDelay: 1000,
            backoffFactor: 2
        }));
        const outcomes = await Promise.allSettled(allPromises);
        const results = [];
        for (let i = 0; i < outcomes.length; i++) {
            const o = outcomes[i];
            if (o.status === "fulfilled") {
                results.push(o.value);
            }
            else {
                console.error(`Error processing link ${links[i]}:`, o.reason);
                results.push({
                    title: `Error processing ${links[i]}`,
                    markdownContent: o.reason?.message ?? "Unknown error",
                });
            }
        }
        return results;
    }
    async getStaticHtml(link) {
        return RetryService.withRetry(async () => {
            const response = await axios.get(link, {
                headers: UserAgentService.getHeaders(),
                timeout: 10000,
                maxRedirects: 5
            });
            return response.data;
        }, {
            maxRetries: 2,
            baseDelay: 2000
        });
    }
    async searchSerpApi(query) {
        return RetryService.withRetry(async () => {
            const response = await getJson({
                engine: "google_light",
                q: query,
                location: "India",
                google_domain: "google.co.in",
                hl: "en",
                gl: "in",
                api_key: process.env.SERPAPI_API_KEY,
            });
            return response;
        }, {
            maxRetries: 2,
            baseDelay: 1000
        });
    }
    async storeRealTimeResults(results) {
        try {
            const chunks = [];
            for (const result of results) {
                if (!result.markdownContent || result.markdownContent.length < 100) {
                    continue; // Skip low-quality results
                }
                const url = result.canonical || '';
                const domain = new URL(url).hostname;
                const baseMetadata = {
                    url,
                    title: result.title,
                    domain,
                    publishDate: result.publishDate,
                    author: result.author,
                    contentType: this.determineContentType(domain, result.title || ''),
                    language: 'en',
                    quality: 0,
                    chunkIndex: 0,
                    totalChunks: 1
                };
                const metadata = {
                    ...baseMetadata,
                    quality: this.chunker.calculateContentQuality(result.markdownContent, baseMetadata)
                };
                const resultChunks = this.chunker.chunkContent(result.markdownContent, metadata);
                chunks.push(...resultChunks);
            }
            if (chunks.length > 0) {
                await this.vectorDB.storeDocuments(chunks);
                console.log(`Stored ${chunks.length} chunks from real-time results`);
            }
        }
        catch (error) {
            console.error('Failed to store real-time results:', error);
            // Don't throw - this shouldn't break the search
        }
    }
    determineContentType(domain, title) {
        const socialDomains = ['twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com'];
        const forumDomains = ['reddit.com', 'stackoverflow.com', 'quora.com'];
        const newsDomains = ['bbc.com', 'cnn.com', 'reuters.com', 'nytimes.com'];
        const docDomains = ['github.com', 'docs.', 'documentation'];
        if (socialDomains.some(d => domain.includes(d)))
            return 'social';
        if (forumDomains.some(d => domain.includes(d)))
            return 'forum';
        if (newsDomains.some(d => domain.includes(d)))
            return 'news';
        if (docDomains.some(d => domain.includes(d)))
            return 'documentation';
        return 'article';
    }
    fuseResults(realTimeResults, semanticResults, maxResults) {
        const fused = [];
        const seenUrls = new Set();
        // Add real-time results first (they're more current)
        for (const result of realTimeResults.slice(0, Math.ceil(maxResults * 0.6))) {
            if (!result.canonical)
                continue;
            const url = result.canonical;
            seenUrls.add(url);
            fused.push({
                content: result.markdownContent,
                title: result.title || 'Untitled',
                url,
                source: 'real-time',
                relevanceScore: 0.9, // High relevance for real-time results
                qualityScore: this.chunker.calculateContentQuality(result.markdownContent, {
                    url,
                    title: result.title,
                    domain: new URL(url).hostname,
                    contentType: 'article',
                    language: 'en',
                    quality: 0,
                    chunkIndex: 0,
                    totalChunks: 1
                }),
                metadata: {
                    domain: new URL(url).hostname,
                    contentType: this.determineContentType(new URL(url).hostname, result.title || ''),
                    publishDate: result.publishDate,
                    author: result.author
                }
            });
        }
        // Add semantic results (avoiding duplicates)
        for (const result of semanticResults) {
            if (seenUrls.has(result.metadata.url)) {
                // Update existing result to show it came from both sources
                const existing = fused.find(f => f.url === result.metadata.url);
                if (existing) {
                    existing.source = 'both';
                    existing.relevanceScore = Math.max(existing.relevanceScore, 0.8);
                }
                continue;
            }
            if (fused.length >= maxResults)
                break;
            fused.push({
                content: result.content,
                title: result.metadata.title || 'Untitled',
                url: result.metadata.url,
                source: 'semantic',
                relevanceScore: 0.8, // Good relevance for semantic results
                qualityScore: result.metadata.quality,
                metadata: {
                    domain: result.metadata.domain,
                    contentType: result.metadata.contentType,
                    publishDate: result.metadata.publishDate,
                    author: result.metadata.author
                }
            });
        }
        // Sort by combined score (relevance + quality)
        return fused
            .sort((a, b) => (b.relevanceScore + b.qualityScore) - (a.relevanceScore + a.qualityScore))
            .slice(0, maxResults);
    }
}
const enhancedSearchTool = EnhancedSearchTool.createTool();
export default enhancedSearchTool;
