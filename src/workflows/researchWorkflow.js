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
exports.ResearchWorkflow = void 0;
// src/workflows/researchWorkflow.ts
var enhancedSearchTool_js_1 = require("../tools/enhancedSearchTool.js");
var vectorDB_js_1 = require("../services/vectorDB.js");
var contentChunker_js_1 = require("../services/contentChunker.js");
var ResearchWorkflow = /** @class */ (function () {
    function ResearchWorkflow() {
        this.searchTool = new enhancedSearchTool_js_1.EnhancedSearchTool();
        this.vectorDB = new vectorDB_js_1.VectorDatabaseService();
        this.chunker = new contentChunker_js_1.ContentChunker();
    }
    ResearchWorkflow.prototype.conductResearch = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, startTime, initialResults, followUpQueries, followUpResults, _i, followUpQueries_1, followUpQuery, result, allResults, insights, session, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        sessionId = this.generateSessionId();
                        startTime = Date.now();
                        console.log("Starting research session ".concat(sessionId, " for query: ").concat(query.query));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.searchTool.search(query.query, {
                                maxResults: query.maxResults || this.getMaxResultsForDepth(query.depth),
                                useVectorDB: true,
                                storeResults: true
                            })];
                    case 2:
                        initialResults = _c.sent();
                        followUpQueries = this.generateFollowUpQueries(query, initialResults);
                        followUpResults = [];
                        _i = 0, followUpQueries_1 = followUpQueries;
                        _c.label = 3;
                    case 3:
                        if (!(_i < followUpQueries_1.length)) return [3 /*break*/, 6];
                        followUpQuery = followUpQueries_1[_i];
                        return [4 /*yield*/, this.searchTool.search(followUpQuery.query, {
                                maxResults: Math.ceil((query.maxResults || 10) * 0.5),
                                useVectorDB: true,
                                storeResults: true
                            })];
                    case 4:
                        result = _c.sent();
                        followUpResults.push(result);
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        allResults = __spreadArray([initialResults], followUpResults, true);
                        return [4 /*yield*/, this.generateInsights(allResults, query)];
                    case 7:
                        insights = _c.sent();
                        _a = {
                            id: sessionId,
                            queries: __spreadArray([query], followUpQueries.map(function (q) { return (__assign(__assign({}, q), { depth: 'shallow' })); }), true),
                            results: allResults,
                            insights: insights
                        };
                        _b = {
                            createdAt: new Date(),
                            totalSearchTime: Date.now() - startTime,
                            totalResults: allResults.reduce(function (sum, r) { return sum + r.fusedResults.length; }, 0)
                        };
                        return [4 /*yield*/, this.vectorDB.getCollectionStats().then(function (s) { return s.count; }).catch(function () { return 0; })];
                    case 8:
                        session = (_a.metadata = (_b.vectorDBCount = _c.sent(),
                            _b),
                            _a);
                        console.log("Research session ".concat(sessionId, " completed in ").concat(session.metadata.totalSearchTime, "ms"));
                        return [2 /*return*/, session];
                    case 9:
                        error_1 = _c.sent();
                        console.error("Research session ".concat(sessionId, " failed:"), error_1);
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    ResearchWorkflow.prototype.generateSessionId = function () {
        return "research_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    ResearchWorkflow.prototype.getMaxResultsForDepth = function (depth) {
        switch (depth) {
            case 'shallow': return 5;
            case 'medium': return 15;
            case 'deep': return 30;
            default: return 10;
        }
    };
    ResearchWorkflow.prototype.generateFollowUpQueries = function (originalQuery, initialResults) {
        var followUps = [];
        if (originalQuery.depth === 'shallow') {
            return followUps; // No follow-ups for shallow research
        }
        // Extract key topics from initial results
        var topics = this.extractTopics(initialResults.fusedResults);
        // Generate follow-up queries based on topics
        for (var _i = 0, _a = topics.slice(0, 3); _i < _a.length; _i++) { // Limit to 3 follow-ups
            var topic = _a[_i];
            followUps.push({
                query: "".concat(originalQuery.query, " ").concat(topic),
                depth: 'shallow',
                maxResults: 5
            });
        }
        // Add specific focus area queries if provided
        if (originalQuery.focusAreas) {
            for (var _b = 0, _c = originalQuery.focusAreas.slice(0, 2); _b < _c.length; _b++) {
                var area = _c[_b];
                followUps.push({
                    query: "".concat(originalQuery.query, " ").concat(area),
                    depth: 'shallow',
                    maxResults: 5
                });
            }
        }
        return followUps;
    };
    ResearchWorkflow.prototype.extractTopics = function (results) {
        var topics = new Set();
        // Simple topic extraction based on common words and phrases
        var commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
        var _loop_1 = function (result) {
            var words = result.title.toLowerCase().split(/\s+/)
                .concat(result.content.toLowerCase().split(/\s+/))
                .filter(function (word) { return word.length > 3 && !commonWords.has(word); });
            // Count word frequency
            var wordCount = new Map();
            words.forEach(function (word) {
                wordCount.set(word, (wordCount.get(word) || 0) + 1);
            });
            // Add top words as topics
            Array.from(wordCount.entries())
                .sort(function (a, b) { return b[1] - a[1]; })
                .slice(0, 5)
                .forEach(function (_a) {
                var word = _a[0];
                return topics.add(word);
            });
        };
        for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
            var result = results_1[_i];
            _loop_1(result);
        }
        return Array.from(topics).slice(0, 10);
    };
    ResearchWorkflow.prototype.generateInsights = function (results, query) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, allResults, summary, trends, patterns, contradictions;
            return __generator(this, function (_a) {
                insights = [];
                allResults = results.flatMap(function (r) { return r.fusedResults; });
                summary = this.generateSummary(allResults, query.query);
                insights.push({
                    type: 'summary',
                    content: summary,
                    confidence: 0.8,
                    sources: allResults.map(function (r) { return r.url; }),
                    tags: ['summary', 'overview']
                });
                trends = this.identifyTrends(allResults);
                insights.push.apply(insights, trends);
                patterns = this.identifyPatterns(allResults);
                insights.push.apply(insights, patterns);
                contradictions = this.identifyContradictions(allResults);
                insights.push.apply(insights, contradictions);
                return [2 /*return*/, insights];
            });
        });
    };
    ResearchWorkflow.prototype.generateSummary = function (results, query) {
        var domains = Array.from(new Set(results.map(function (r) { return r.metadata.domain; })));
        var contentTypes = Array.from(new Set(results.map(function (r) { return r.metadata.contentType; })));
        return "Research on \"".concat(query, "\" found ").concat(results.length, " relevant sources across ").concat(domains.length, " domains. Content types include: ").concat(contentTypes.join(', '), ". The search covered both real-time and historical content, providing comprehensive coverage of the topic.");
    };
    ResearchWorkflow.prototype.identifyTrends = function (results) {
        var insights = [];
        // Group by domain to identify popular sources
        var domainCount = new Map();
        results.forEach(function (r) {
            domainCount.set(r.metadata.domain, (domainCount.get(r.metadata.domain) || 0) + 1);
        });
        var topDomains = Array.from(domainCount.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 3);
        if (topDomains.length > 0) {
            insights.push({
                type: 'trend',
                content: "Most information comes from: ".concat(topDomains.map(function (_a) {
                    var domain = _a[0], count = _a[1];
                    return "".concat(domain, " (").concat(count, " results)");
                }).join(', ')),
                confidence: 0.7,
                sources: results.map(function (r) { return r.url; }),
                tags: ['trend', 'sources', 'popularity']
            });
        }
        return insights;
    };
    ResearchWorkflow.prototype.identifyPatterns = function (results) {
        var insights = [];
        // Identify content type patterns
        var contentTypeCount = new Map();
        results.forEach(function (r) {
            contentTypeCount.set(r.metadata.contentType, (contentTypeCount.get(r.metadata.contentType) || 0) + 1);
        });
        var dominantType = Array.from(contentTypeCount.entries())
            .sort(function (a, b) { return b[1] - a[1]; })[0];
        if (dominantType && dominantType[1] > results.length * 0.4) {
            insights.push({
                type: 'pattern',
                content: "The majority of content (".concat(Math.round(dominantType[1] / results.length * 100), "%) is ").concat(dominantType[0], " type, suggesting this topic is primarily discussed in ").concat(dominantType[0], " format."),
                confidence: 0.6,
                sources: results.map(function (r) { return r.url; }),
                tags: ['pattern', 'content-type', 'distribution']
            });
        }
        return insights;
    };
    ResearchWorkflow.prototype.identifyContradictions = function (results) {
        var insights = [];
        // This is a simplified contradiction detection
        // In a real implementation, you'd use more sophisticated NLP
        var qualityScores = results.map(function (r) { return r.qualityScore; });
        var avgQuality = qualityScores.reduce(function (sum, score) { return sum + score; }, 0) / qualityScores.length;
        var lowQualityResults = results.filter(function (r) { return r.qualityScore < avgQuality * 0.7; });
        if (lowQualityResults.length > 0) {
            insights.push({
                type: 'contradiction',
                content: "Found ".concat(lowQualityResults.length, " results with significantly lower quality scores, which may indicate unreliable or incomplete information."),
                confidence: 0.5,
                sources: lowQualityResults.map(function (r) { return r.url; }),
                tags: ['contradiction', 'quality', 'reliability']
            });
        }
        return insights;
    };
    ResearchWorkflow.prototype.getResearchHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would typically be stored in a database
                // For now, return empty array
                return [2 /*return*/, []];
            });
        });
    };
    ResearchWorkflow.prototype.clearResearchData = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.vectorDB.clearCollection()];
                    case 1:
                        _a.sent();
                        console.log('Research data cleared');
                        return [2 /*return*/];
                }
            });
        });
    };
    return ResearchWorkflow;
}());
exports.ResearchWorkflow = ResearchWorkflow;
exports.default = ResearchWorkflow;
