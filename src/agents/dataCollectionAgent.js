"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCollectionAgent = void 0;
// src/agents/dataCollectionAgent.ts
var agent_js_1 = require("../core/agent.js");
var DataCollectionAgent = /** @class */ (function (_super) {
    __extends(DataCollectionAgent, _super);
    function DataCollectionAgent(options) {
        return _super.call(this, __assign(__assign({}, options), { system: options.system || "You are a data collection specialist focused on gathering comprehensive information.\n\nYour expertise:\n1. Web search optimization and source identification\n2. Academic database queries (PubMed, arXiv, Google Scholar)\n3. Social media monitoring and sentiment analysis\n4. News aggregation and real-time information\n5. Document processing (PDFs, research papers)\n\nFor each research query, you should:\n- Identify the most relevant sources\n- Gather data from multiple perspectives\n- Ensure source diversity and credibility\n- Provide raw data with metadata\n- Maintain ethical data collection practices\n\nAlways prioritize quality over quantity and provide detailed source attribution." })) || this;
    }
    DataCollectionAgent.prototype.generateLLMResponse = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.chat(prompt)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.text];
                }
            });
        });
    };
    DataCollectionAgent.prototype.collectData = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, webResults, academicPapers, newsArticles, socialPosts, documents, qualityMetrics, urlsProcessed, rawData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        console.log("\uD83D\uDD0D Data Collection Agent starting collection for: ".concat(query.query));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.collectWebData(query)];
                    case 2:
                        webResults = _a.sent();
                        return [4 /*yield*/, this.collectAcademicData(query)];
                    case 3:
                        academicPapers = _a.sent();
                        return [4 /*yield*/, this.collectNewsData(query)];
                    case 4:
                        newsArticles = _a.sent();
                        return [4 /*yield*/, this.collectSocialData(query)];
                    case 5:
                        socialPosts = _a.sent();
                        return [4 /*yield*/, this.collectDocuments(query)];
                    case 6:
                        documents = _a.sent();
                        qualityMetrics = this.calculateQualityMetrics({
                            webResults: webResults,
                            academicPapers: academicPapers,
                            newsArticles: newsArticles,
                            socialPosts: socialPosts,
                            documents: documents
                        });
                        urlsProcessed = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], webResults.map(function (r) { return r.url; }), true), academicPapers.map(function (p) { return p.url; }), true), newsArticles.map(function (a) { return a.url; }), true), documents.map(function (d) { return d.url; }), true);
                        rawData = {
                            searchResults: webResults,
                            academicPapers: academicPapers,
                            newsArticles: newsArticles,
                            socialPosts: socialPosts,
                            documents: documents,
                            urlsProcessed: Array.from(new Set(urlsProcessed)),
                            urlsTotal: urlsProcessed.length,
                            metadata: {
                                collectionTime: Date.now() - startTime,
                                sourcesUsed: this.getSourcesUsed(webResults, academicPapers, newsArticles, socialPosts),
                                qualityMetrics: qualityMetrics
                            }
                        };
                        console.log("\u2705 Data collection completed in ".concat(rawData.metadata.collectionTime, "ms"));
                        console.log("\uD83D\uDCCA Collected: ".concat(webResults.length, " web results, ").concat(academicPapers.length, " academic papers, ").concat(newsArticles.length, " news articles, ").concat(socialPosts.length, " social posts, ").concat(documents.length, " documents"));
                        return [2 /*return*/, rawData];
                    case 7:
                        error_1 = _a.sent();
                        console.error('❌ Data collection failed:', error_1);
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    DataCollectionAgent.prototype.collectWebData = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var EnhancedSearchTool, enhancedSearchTool, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83C\uDF10 Collecting web data for: ".concat(query.query));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../tools/enhancedSearchTool.js'); })];
                    case 1:
                        EnhancedSearchTool = (_a.sent()).EnhancedSearchTool;
                        enhancedSearchTool = new EnhancedSearchTool();
                        return [4 /*yield*/, enhancedSearchTool.search(query.query, {
                                maxResults: query.maxResults || this.getMaxResultsForDepth(query.depth),
                                useVectorDB: true,
                                storeResults: true
                            })];
                    case 2:
                        results = _a.sent();
                        return [2 /*return*/, results.fusedResults];
                }
            });
        });
    };
    DataCollectionAgent.prototype.collectAcademicData = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var academicPapers;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCDA Collecting academic data for: ".concat(query.query));
                academicPapers = [];
                // TODO: Implement academic database integration
                // - PubMed API
                // - arXiv API
                // - Google Scholar scraping
                // - Citation analysis
                return [2 /*return*/, academicPapers];
            });
        });
    };
    DataCollectionAgent.prototype.collectNewsData = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var newsArticles;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCF0 Collecting news data for: ".concat(query.query));
                newsArticles = [];
                // TODO: Implement news API integration
                // - NewsAPI
                // - RSS feeds
                // - Breaking news monitoring
                // - Sentiment analysis
                return [2 /*return*/, newsArticles];
            });
        });
    };
    DataCollectionAgent.prototype.collectSocialData = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var socialPosts;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCF1 Collecting social media data for: ".concat(query.query));
                socialPosts = [];
                // TODO: Implement social media integration
                // - Twitter API
                // - Reddit API
                // - LinkedIn API
                // - Sentiment analysis
                return [2 /*return*/, socialPosts];
            });
        });
    };
    DataCollectionAgent.prototype.collectDocuments = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var documents;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCC4 Collecting documents for: ".concat(query.query));
                documents = [];
                // TODO: Implement document processing
                // - PDF parsing
                // - DOCX processing
                // - HTML extraction
                // - Content analysis
                return [2 /*return*/, documents];
            });
        });
    };
    DataCollectionAgent.prototype.calculateQualityMetrics = function (data) {
        var totalSources = data.webResults.length + data.academicPapers.length +
            data.newsArticles.length + data.socialPosts.length +
            data.documents.length;
        // Source diversity (0-1)
        var sourceTypes = [
            data.webResults.length > 0 ? 'web' : null,
            data.academicPapers.length > 0 ? 'academic' : null,
            data.newsArticles.length > 0 ? 'news' : null,
            data.socialPosts.length > 0 ? 'social' : null,
            data.documents.length > 0 ? 'documents' : null
        ].filter(Boolean);
        var sourceDiversity = sourceTypes.length / 5;
        // Content quality (0-1) - based on relevance scores
        var allResults = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], data.webResults.map(function (r) { return r.relevanceScore || 0; }), true), data.academicPapers.map(function (p) { return p.relevanceScore || 0; }), true), data.newsArticles.map(function (a) { return a.relevanceScore || 0; }), true), data.socialPosts.map(function (s) { return s.relevanceScore || 0; }), true), data.documents.map(function (d) { return d.relevanceScore || 0; }), true);
        var contentQuality = allResults.length > 0
            ? allResults.reduce(function (sum, score) { return sum + score; }, 0) / allResults.length
            : 0;
        // Timeliness (0-1) - based on publication dates
        var timeliness = this.calculateTimeliness(data);
        // Credibility (0-1) - based on source reputation
        var credibility = this.calculateCredibility(data);
        // Overall score
        var overallScore = (sourceDiversity + contentQuality + timeliness + credibility) / 4;
        return {
            sourceDiversity: sourceDiversity,
            contentQuality: contentQuality,
            timeliness: timeliness,
            credibility: credibility,
            overallScore: overallScore
        };
    };
    DataCollectionAgent.prototype.calculateTimeliness = function (data) {
        // For now, return a default value
        // In full implementation, this would analyze publication dates
        return 0.7;
    };
    DataCollectionAgent.prototype.calculateCredibility = function (data) {
        // For now, return a default value
        // In full implementation, this would analyze source reputation
        return 0.8;
    };
    DataCollectionAgent.prototype.getSourcesUsed = function () {
        var dataArrays = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            dataArrays[_i] = arguments[_i];
        }
        var sources = new Set();
        dataArrays.forEach(function (array) {
            array.forEach(function (item) {
                var _a;
                if (item.source)
                    sources.add(item.source);
                if ((_a = item.metadata) === null || _a === void 0 ? void 0 : _a.domain)
                    sources.add(item.metadata.domain);
            });
        });
        return Array.from(sources);
    };
    DataCollectionAgent.prototype.getMaxResultsForDepth = function (depth) {
        switch (depth) {
            case 'shallow': return 5;
            case 'medium': return 15;
            case 'deep': return 30;
            default: return 10;
        }
    };
    DataCollectionAgent.prototype.validateSources = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("\uD83D\uDD0D Validating sources for collected data");
                // TODO: Implement source validation
                // - Check URL accessibility
                // - Verify content authenticity
                // - Assess source credibility
                // - Flag suspicious sources
                return [2 /*return*/, data];
            });
        });
    };
    DataCollectionAgent.prototype.enrichData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("\u2728 Enriching collected data with additional metadata");
                // TODO: Implement data enrichment
                // - Add semantic tags
                // - Extract entities
                // - Calculate sentiment scores
                // - Add temporal information
                return [2 /*return*/, data];
            });
        });
    };
    return DataCollectionAgent;
}(agent_js_1.Agent));
exports.DataCollectionAgent = DataCollectionAgent;
exports.default = DataCollectionAgent;
