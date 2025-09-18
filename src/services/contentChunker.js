"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentChunker = void 0;
var ContentChunker = /** @class */ (function () {
    function ContentChunker() {
        this.defaultOptions = {
            chunkSize: 1000,
            overlap: 200,
            minChunkSize: 100
        };
    }
    ContentChunker.prototype.chunkContent = function (content, metadata, options) {
        if (options === void 0) { options = {}; }
        var opts = __assign(__assign({}, this.defaultOptions), options);
        // Clean and normalize content
        var cleanedContent = this.cleanContent(content);
        // Split into sentences for better chunking
        var sentences = this.splitIntoSentences(cleanedContent);
        // Create chunks with overlap
        var chunks = [];
        var currentChunk = '';
        var chunkIndex = 0;
        for (var i = 0; i < sentences.length; i++) {
            var sentence = sentences[i];
            var potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
            if (potentialChunk.length > opts.chunkSize && currentChunk.length >= opts.minChunkSize) {
                // Create chunk
                chunks.push(this.createChunk(currentChunk, metadata, chunkIndex, sentences.length));
                chunkIndex++;
                // Start new chunk with overlap
                currentChunk = this.createOverlapChunk(currentChunk, opts.overlap) + sentence;
            }
            else {
                currentChunk = potentialChunk;
            }
        }
        // Add final chunk if it has content
        if (currentChunk.trim().length >= opts.minChunkSize) {
            chunks.push(this.createChunk(currentChunk, metadata, chunkIndex, sentences.length));
        }
        return chunks;
    };
    ContentChunker.prototype.cleanContent = function (content) {
        return content
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();
    };
    ContentChunker.prototype.splitIntoSentences = function (text) {
        // Simple sentence splitting - can be enhanced with NLP libraries
        return text
            .split(/[.!?]+/)
            .map(function (s) { return s.trim(); })
            .filter(function (s) { return s.length > 0; });
    };
    ContentChunker.prototype.createOverlapChunk = function (chunk, overlapSize) {
        if (chunk.length <= overlapSize)
            return chunk;
        // Find the last sentence that fits in the overlap
        var sentences = chunk.split(/[.!?]+/).filter(function (s) { return s.trim(); });
        var overlap = '';
        for (var i = sentences.length - 1; i >= 0; i--) {
            var potentialOverlap = sentences.slice(i).join('. ') + '.';
            if (potentialOverlap.length <= overlapSize) {
                overlap = potentialOverlap;
                break;
            }
        }
        return overlap || chunk.slice(-overlapSize);
    };
    ContentChunker.prototype.createChunk = function (content, metadata, chunkIndex, totalChunks) {
        return {
            id: "".concat(metadata.url, "-chunk-").concat(chunkIndex),
            content: content.trim(),
            metadata: __assign(__assign({}, metadata), { chunkIndex: chunkIndex, totalChunks: totalChunks })
        };
    };
    // Utility method to determine content quality
    ContentChunker.prototype.calculateContentQuality = function (content, metadata) {
        var quality = 0;
        // Length factor (longer content is generally better)
        var lengthScore = Math.min(content.length / 2000, 1) * 0.3;
        quality += lengthScore;
        // Structure factor (presence of headings, lists, etc.)
        var structureScore = this.analyzeStructure(content) * 0.2;
        quality += structureScore;
        // Domain factor (trusted domains get higher scores)
        var domainScore = this.getDomainQuality(metadata.domain) * 0.2;
        quality += domainScore;
        // Content type factor
        var typeScore = this.getContentTypeScore(metadata.contentType) * 0.15;
        quality += typeScore;
        // Language factor (English content gets slight boost)
        var languageScore = metadata.language === 'en' ? 0.1 : 0.05;
        quality += languageScore;
        // Author factor (if available)
        var authorScore = metadata.author ? 0.05 : 0;
        quality += authorScore;
        return Math.min(quality, 1); // Cap at 1.0
    };
    ContentChunker.prototype.analyzeStructure = function (content) {
        var score = 0;
        // Check for headings
        if (/#{1,6}\s/.test(content))
            score += 0.3;
        // Check for lists
        if (/^\s*[-*+]\s/m.test(content) || /^\s*\d+\.\s/m.test(content))
            score += 0.2;
        // Check for paragraphs (multiple line breaks)
        var paragraphs = content.split(/\n\s*\n/).length;
        if (paragraphs > 3)
            score += 0.3;
        // Check for links (indicates rich content)
        if (/\[.*?\]\(.*?\)/.test(content))
            score += 0.2;
        return Math.min(score, 1);
    };
    ContentChunker.prototype.getDomainQuality = function (domain) {
        var trustedDomains = {
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
        for (var _i = 0, _a = Object.entries(trustedDomains); _i < _a.length; _i++) {
            var _b = _a[_i], trustedDomain = _b[0], score = _b[1];
            if (domain.includes(trustedDomain)) {
                return score;
            }
        }
        return 0.5; // Default score for unknown domains
    };
    ContentChunker.prototype.getContentTypeScore = function (contentType) {
        var typeScores = {
            'documentation': 0.9,
            'article': 0.8,
            'news': 0.7,
            'forum': 0.6,
            'social': 0.4
        };
        return typeScores[contentType] || 0.5;
    };
    return ContentChunker;
}());
exports.ContentChunker = ContentChunker;
