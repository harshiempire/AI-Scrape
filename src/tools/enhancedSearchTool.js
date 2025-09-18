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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedSearchTool = void 0;
// src/tools/enhancedSearchTool.ts
var zod_1 = require("zod");
var tool_js_1 = require("../core/tool.js");
var axios_1 = require("axios");
var serpapi_1 = require("serpapi");
var fs = require("fs");
var renderHtml_js_1 = require("./renderHtml.js");
var htmlParse_js_1 = require("./htmlParse.js");
var vectorDB_js_1 = require("../services/vectorDB.js");
var contentChunker_js_1 = require("../services/contentChunker.js");
var retryService_js_1 = require("../services/retryService.js");
var EnhancedSearchTool = /** @class */ (function () {
    function EnhancedSearchTool() {
        this.isInitialized = false;
        this.vectorDB = new vectorDB_js_1.VectorDatabaseService();
        this.chunker = new contentChunker_js_1.ContentChunker();
    }
    EnhancedSearchTool.createTool = function () {
        var _this = this;
        var instance = new EnhancedSearchTool();
        return new tool_js_1.Tool({
            name: "enhanced_search",
            description: "Advanced search with real-time results and semantic search capabilities",
            schema: zod_1.z.object({
                query: zod_1.z.string().describe("Search query"),
                useVectorDB: zod_1.z.boolean().optional().default(true).describe("Whether to use vector database for semantic search"),
                maxResults: zod_1.z.number().optional().default(10).describe("Maximum number of results to return"),
                storeResults: zod_1.z.boolean().optional().default(true).describe("Whether to store new results in vector database")
            }),
            func: function (input) { return __awaiter(_this, void 0, void 0, function () {
                var query, useVectorDB, maxResults, storeResults;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            query = input.query, useVectorDB = input.useVectorDB, maxResults = input.maxResults, storeResults = input.storeResults;
                            return [4 /*yield*/, instance.search(query, { useVectorDB: useVectorDB, maxResults: maxResults, storeResults: storeResults })];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); },
        });
    };
    EnhancedSearchTool.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.vectorDB.initialize()];
                    case 2:
                        _a.sent();
                        this.isInitialized = true;
                        console.log('Enhanced Search Tool initialized successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to initialize Enhanced Search Tool:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedSearchTool.prototype.search = function (query_1) {
        return __awaiter(this, arguments, void 0, function (query, options) {
            var startTime, _a, useVectorDB, _b, maxResults, _c, storeResults, realTimeResults, semanticResults, fusedResults, vectorDBCount, error_2;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        _a = options.useVectorDB, useVectorDB = _a === void 0 ? true : _a, _b = options.maxResults, maxResults = _b === void 0 ? 10 : _b, _c = options.storeResults, storeResults = _c === void 0 ? true : _c;
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 9, , 10]);
                        return [4 /*yield*/, this.getRealTimeResults(query)];
                    case 3:
                        realTimeResults = _d.sent();
                        semanticResults = [];
                        if (!useVectorDB) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.vectorDB.semanticSearch(query, maxResults)];
                    case 4:
                        semanticResults = _d.sent();
                        _d.label = 5;
                    case 5:
                        if (!(storeResults && realTimeResults.length > 0)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.storeRealTimeResults(realTimeResults)];
                    case 6:
                        _d.sent();
                        _d.label = 7;
                    case 7:
                        fusedResults = this.fuseResults(realTimeResults, semanticResults, maxResults);
                        return [4 /*yield*/, this.vectorDB.getCollectionStats().then(function (stats) { return stats.count; }).catch(function () { return 0; })];
                    case 8:
                        vectorDBCount = _d.sent();
                        return [2 /*return*/, {
                                realTimeResults: realTimeResults,
                                semanticResults: semanticResults,
                                fusedResults: fusedResults,
                                metadata: {
                                    totalRealTimeResults: realTimeResults.length,
                                    totalSemanticResults: semanticResults.length,
                                    searchTime: Date.now() - startTime,
                                    vectorDBCount: vectorDBCount
                                }
                            }];
                    case 9:
                        error_2 = _d.sent();
                        console.error('Error in enhanced search:', error_2);
                        throw error_2;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedSearchTool.prototype.getRealTimeResults = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var linksResponse, organicResults, links, parsedResults, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.searchSerpApi(query)];
                    case 1:
                        linksResponse = _a.sent();
                        organicResults = Array.isArray(linksResponse === null || linksResponse === void 0 ? void 0 : linksResponse["organic_results"])
                            ? linksResponse["organic_results"] : [];
                        if (organicResults.length === 0) {
                            throw new Error("No organic results found from search API.");
                        }
                        links = organicResults
                            .map(function (item) {
                            if (item &&
                                typeof item === "object" &&
                                "link" in item &&
                                typeof item.link === "string") {
                                return item.link;
                            }
                            return null;
                        })
                            .filter(function (link) { return typeof link === "string"; });
                        return [4 /*yield*/, this.smartFetchAndParse(links)];
                    case 2:
                        parsedResults = _a.sent();
                        // Save results for debugging
                        fs.writeFileSync("htmlResults_final.json", JSON.stringify(parsedResults, null, 2));
                        return [2 /*return*/, parsedResults];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error getting real-time results:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedSearchTool.prototype.smartFetchAndParse = function (links) {
        return __awaiter(this, void 0, void 0, function () {
            var allPromises, outcomes, results, i, o;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        allPromises = links.map(function (link) {
                            return retryService_js_1.RetryService.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                                var staticHtml, parsed, renderedHtml;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.getStaticHtml(link)];
                                        case 1:
                                            staticHtml = _a.sent();
                                            parsed = (0, htmlParse_js_1.parseHtmlToMarkdown)(staticHtml);
                                            if (!(parsed.markdownContent.length < 250)) return [3 /*break*/, 3];
                                            console.log("[!] Static content for ".concat(link, " is too short. Falling back to rendered fetch."));
                                            return [4 /*yield*/, (0, renderHtml_js_1.fetchRenderedHtml)(link)];
                                        case 2:
                                            renderedHtml = _a.sent();
                                            parsed = (0, htmlParse_js_1.parseHtmlToMarkdown)(renderedHtml);
                                            _a.label = 3;
                                        case 3: return [2 /*return*/, parsed];
                                    }
                                });
                            }); }, {
                                maxRetries: 2,
                                baseDelay: 1000,
                                backoffFactor: 2
                            });
                        });
                        return [4 /*yield*/, Promise.allSettled(allPromises)];
                    case 1:
                        outcomes = _c.sent();
                        results = [];
                        for (i = 0; i < outcomes.length; i++) {
                            o = outcomes[i];
                            if (o.status === "fulfilled") {
                                results.push(o.value);
                            }
                            else {
                                console.error("Error processing link ".concat(links[i], ":"), o.reason);
                                results.push({
                                    title: "Error processing ".concat(links[i]),
                                    markdownContent: (_b = (_a = o.reason) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Unknown error",
                                });
                            }
                        }
                        return [2 /*return*/, results];
                }
            });
        });
    };
    EnhancedSearchTool.prototype.getStaticHtml = function (link) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, retryService_js_1.RetryService.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, axios_1.default.get(link, {
                                        headers: retryService_js_1.UserAgentService.getHeaders(),
                                        timeout: 10000,
                                        maxRedirects: 5
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response.data];
                            }
                        });
                    }); }, {
                        maxRetries: 2,
                        baseDelay: 2000
                    })];
            });
        });
    };
    EnhancedSearchTool.prototype.searchSerpApi = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, retryService_js_1.RetryService.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, serpapi_1.getJson)({
                                        engine: "google_light",
                                        q: query,
                                        location: "India",
                                        google_domain: "google.co.in",
                                        hl: "en",
                                        gl: "in",
                                        api_key: process.env.SERPAPI_API_KEY,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, response];
                            }
                        });
                    }); }, {
                        maxRetries: 2,
                        baseDelay: 1000
                    })];
            });
        });
    };
    EnhancedSearchTool.prototype.storeRealTimeResults = function (results) {
        return __awaiter(this, void 0, void 0, function () {
            var chunks, _i, results_1, result, url, domain, baseMetadata, metadata, resultChunks, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        chunks = [];
                        for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                            result = results_1[_i];
                            if (!result.markdownContent || result.markdownContent.length < 100) {
                                continue; // Skip low-quality results
                            }
                            url = result.canonical || '';
                            domain = new URL(url).hostname;
                            baseMetadata = {
                                url: url,
                                title: result.title,
                                domain: domain,
                                publishDate: result.publishDate,
                                author: result.author,
                                contentType: this.determineContentType(domain, result.title || ''),
                                language: 'en',
                                quality: 0,
                                chunkIndex: 0,
                                totalChunks: 1
                            };
                            metadata = __assign(__assign({}, baseMetadata), { quality: this.chunker.calculateContentQuality(result.markdownContent, baseMetadata) });
                            resultChunks = this.chunker.chunkContent(result.markdownContent, metadata);
                            chunks.push.apply(chunks, resultChunks);
                        }
                        if (!(chunks.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.vectorDB.storeDocuments(chunks)];
                    case 1:
                        _a.sent();
                        console.log("Stored ".concat(chunks.length, " chunks from real-time results"));
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        console.error('Failed to store real-time results:', error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EnhancedSearchTool.prototype.determineContentType = function (domain, title) {
        var socialDomains = ['twitter.com', 'facebook.com', 'instagram.com', 'linkedin.com'];
        var forumDomains = ['reddit.com', 'stackoverflow.com', 'quora.com'];
        var newsDomains = ['bbc.com', 'cnn.com', 'reuters.com', 'nytimes.com'];
        var docDomains = ['github.com', 'docs.', 'documentation'];
        if (socialDomains.some(function (d) { return domain.includes(d); }))
            return 'social';
        if (forumDomains.some(function (d) { return domain.includes(d); }))
            return 'forum';
        if (newsDomains.some(function (d) { return domain.includes(d); }))
            return 'news';
        if (docDomains.some(function (d) { return domain.includes(d); }))
            return 'documentation';
        return 'article';
    };
    EnhancedSearchTool.prototype.fuseResults = function (realTimeResults, semanticResults, maxResults) {
        var fused = [];
        var seenUrls = new Set();
        // Add real-time results first (they're more current)
        for (var _i = 0, _a = realTimeResults.slice(0, Math.ceil(maxResults * 0.6)); _i < _a.length; _i++) {
            var result = _a[_i];
            if (!result.canonical)
                continue;
            var url = result.canonical;
            seenUrls.add(url);
            fused.push({
                content: result.markdownContent,
                title: result.title || 'Untitled',
                url: url,
                source: 'real-time',
                relevanceScore: 0.9, // High relevance for real-time results
                qualityScore: this.chunker.calculateContentQuality(result.markdownContent, {
                    url: url,
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
        var _loop_1 = function (result) {
            if (seenUrls.has(result.metadata.url)) {
                // Update existing result to show it came from both sources
                var existing = fused.find(function (f) { return f.url === result.metadata.url; });
                if (existing) {
                    existing.source = 'both';
                    existing.relevanceScore = Math.max(existing.relevanceScore, 0.8);
                }
                return "continue";
            }
            if (fused.length >= maxResults)
                return "break";
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
        };
        // Add semantic results (avoiding duplicates)
        for (var _b = 0, semanticResults_1 = semanticResults; _b < semanticResults_1.length; _b++) {
            var result = semanticResults_1[_b];
            var state_1 = _loop_1(result);
            if (state_1 === "break")
                break;
        }
        // Sort by combined score (relevance + quality)
        return fused
            .sort(function (a, b) { return (b.relevanceScore + b.qualityScore) - (a.relevanceScore + a.qualityScore); })
            .slice(0, maxResults);
    };
    return EnhancedSearchTool;
}());
exports.EnhancedSearchTool = EnhancedSearchTool;
var enhancedSearchTool = EnhancedSearchTool.createTool();
exports.default = enhancedSearchTool;
