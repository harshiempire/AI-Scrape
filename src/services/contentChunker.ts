// src/services/contentChunker.ts
import { DocumentChunk } from './vectorDB.js';

export interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
  minChunkSize?: number;
}

export class ContentChunker {
  private defaultOptions: Required<ChunkingOptions> = {
    chunkSize: 1000,
    overlap: 200,
    minChunkSize: 100
  };

  chunkContent(
    content: string, 
    metadata: DocumentChunk['metadata'],
    options: ChunkingOptions = {}
  ): DocumentChunk[] {
    const opts = { ...this.defaultOptions, ...options };
    
    // Clean and normalize content
    const cleanedContent = this.cleanContent(content);
    
    // Split into sentences for better chunking
    const sentences = this.splitIntoSentences(cleanedContent);
    
    // Create chunks with overlap
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
      
      if (potentialChunk.length > opts.chunkSize && currentChunk.length >= opts.minChunkSize) {
        // Create chunk
        chunks.push(this.createChunk(currentChunk, metadata, chunkIndex, sentences.length));
        chunkIndex++;
        
        // Start new chunk with overlap
        currentChunk = this.createOverlapChunk(currentChunk, opts.overlap) + sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    // Add final chunk if it has content
    if (currentChunk.trim().length >= opts.minChunkSize) {
      chunks.push(this.createChunk(currentChunk, metadata, chunkIndex, sentences.length));
    }
    
    return chunks;
  }

  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - can be enhanced with NLP libraries
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private createOverlapChunk(chunk: string, overlapSize: number): string {
    if (chunk.length <= overlapSize) return chunk;
    
    // Find the last sentence that fits in the overlap
    const sentences = chunk.split(/[.!?]+/).filter(s => s.trim());
    let overlap = '';
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const potentialOverlap = sentences.slice(i).join('. ') + '.';
      if (potentialOverlap.length <= overlapSize) {
        overlap = potentialOverlap;
        break;
      }
    }
    
    return overlap || chunk.slice(-overlapSize);
  }

  private createChunk(
    content: string, 
    metadata: DocumentChunk['metadata'],
    chunkIndex: number,
    totalChunks: number
  ): DocumentChunk {
    return {
      id: `${metadata.url}-chunk-${chunkIndex}`,
      content: content.trim(),
      metadata: {
        ...metadata,
        chunkIndex,
        totalChunks
      }
    };
  }

  // Utility method to determine content quality
  calculateContentQuality(content: string, metadata: DocumentChunk['metadata']): number {
    let quality = 0;
    
    // Length factor (longer content is generally better)
    const lengthScore = Math.min(content.length / 2000, 1) * 0.3;
    quality += lengthScore;
    
    // Structure factor (presence of headings, lists, etc.)
    const structureScore = this.analyzeStructure(content) * 0.2;
    quality += structureScore;
    
    // Domain factor (trusted domains get higher scores)
    const domainScore = this.getDomainQuality(metadata.domain) * 0.2;
    quality += domainScore;
    
    // Content type factor
    const typeScore = this.getContentTypeScore(metadata.contentType) * 0.15;
    quality += typeScore;
    
    // Language factor (English content gets slight boost)
    const languageScore = metadata.language === 'en' ? 0.1 : 0.05;
    quality += languageScore;
    
    // Author factor (if available)
    const authorScore = metadata.author ? 0.05 : 0;
    quality += authorScore;
    
    return Math.min(quality, 1); // Cap at 1.0
  }

  private analyzeStructure(content: string): number {
    let score = 0;
    
    // Check for headings
    if (/#{1,6}\s/.test(content)) score += 0.3;
    
    // Check for lists
    if (/^\s*[-*+]\s/m.test(content) || /^\s*\d+\.\s/m.test(content)) score += 0.2;
    
    // Check for paragraphs (multiple line breaks)
    const paragraphs = content.split(/\n\s*\n/).length;
    if (paragraphs > 3) score += 0.3;
    
    // Check for links (indicates rich content)
    if (/\[.*?\]\(.*?\)/.test(content)) score += 0.2;
    
    return Math.min(score, 1);
  }

  private getDomainQuality(domain: string): number {
    const trustedDomains = {
      'wikipedia.org': 0.9,
      'github.com': 0.8,
      'stackoverflow.com': 0.8,
      'medium.com': 0.7,
      'dev.to': 0.7,
      'reddit.com': 0.6,
      'youtube.com': 0.6,
      'twitter.com': 0.5,
      'facebook.com': 0.4,
      'instagram.com': 0.3
    };
    
    for (const [trustedDomain, score] of Object.entries(trustedDomains)) {
      if (domain.includes(trustedDomain)) {
        return score;
      }
    }
    
    return 0.5; // Default score for unknown domains
  }

  private getContentTypeScore(contentType: DocumentChunk['metadata']['contentType']): number {
    const typeScores = {
      'documentation': 0.9,
      'article': 0.8,
      'news': 0.7,
      'forum': 0.6,
      'social': 0.4
    };
    
    return typeScores[contentType] || 0.5;
  }
}
