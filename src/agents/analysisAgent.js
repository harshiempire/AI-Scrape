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
exports.AnalysisAgent = void 0;
// src/agents/analysisAgent.ts
var agent_js_1 = require("../core/agent.js");
var AnalysisAgent = /** @class */ (function (_super) {
    __extends(AnalysisAgent, _super);
    function AnalysisAgent(options) {
        return _super.call(this, __assign(__assign({}, options), { system: options.system || "You are a content analysis specialist focused on extracting insights from raw data.\n\nYour capabilities:\n1. Content categorization and topic modeling\n2. Sentiment analysis and emotional tone detection\n3. Trend identification and pattern recognition\n4. Bias detection and source credibility assessment\n5. Cross-reference validation and contradiction detection\n\nAnalysis approach:\n- Process data systematically and objectively\n- Identify key themes and patterns\n- Detect potential biases or inconsistencies\n- Provide confidence scores for findings\n- Highlight areas requiring further investigation\n\nMaintain analytical rigor while being open to unexpected insights." })) || this;
    }
    AnalysisAgent.prototype.generateLLMResponse = function (prompt) {
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
    AnalysisAgent.prototype.analyzeData = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, insights, patterns, trends, contradictions, sentiment, topics, entities, confidence, coverage, analysisResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        console.log("\uD83D\uDD2C Analysis Agent starting analysis for: ".concat(query.query));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        return [4 /*yield*/, this.generateInsights(data, query)];
                    case 2:
                        insights = _a.sent();
                        return [4 /*yield*/, this.identifyPatterns(data, query)];
                    case 3:
                        patterns = _a.sent();
                        return [4 /*yield*/, this.identifyTrends(data, query)];
                    case 4:
                        trends = _a.sent();
                        return [4 /*yield*/, this.detectContradictions(data, query)];
                    case 5:
                        contradictions = _a.sent();
                        return [4 /*yield*/, this.analyzeSentiment(data, query)];
                    case 6:
                        sentiment = _a.sent();
                        return [4 /*yield*/, this.extractTopics(data, query)];
                    case 7:
                        topics = _a.sent();
                        return [4 /*yield*/, this.extractEntities(data, query)];
                    case 8:
                        entities = _a.sent();
                        confidence = this.calculateConfidence(insights, patterns, trends, contradictions);
                        coverage = this.calculateCoverage(data);
                        analysisResult = {
                            insights: insights,
                            patterns: patterns,
                            trends: trends,
                            contradictions: contradictions,
                            sentiment: sentiment,
                            topics: topics,
                            entities: entities,
                            metadata: {
                                analysisTime: Date.now() - startTime,
                                confidence: confidence,
                                coverage: coverage
                            }
                        };
                        console.log("\u2705 Analysis completed in ".concat(analysisResult.metadata.analysisTime, "ms"));
                        console.log("\uD83D\uDCCA Generated: ".concat(insights.length, " insights, ").concat(patterns.length, " patterns, ").concat(trends.length, " trends, ").concat(contradictions.length, " contradictions"));
                        return [2 /*return*/, analysisResult];
                    case 9:
                        error_1 = _a.sent();
                        console.error('❌ Analysis failed:', error_1);
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.generateInsights = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, allResults, summary, keyFindings, recommendations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCA1 Generating insights for: ".concat(query.query));
                        insights = [];
                        allResults = data.searchResults.flatMap(function (r) { return r.fusedResults; });
                        return [4 /*yield*/, this.generateSummary(allResults, query)];
                    case 1:
                        summary = _a.sent();
                        insights.push({
                            type: 'summary',
                            content: summary,
                            confidence: 0.8,
                            sources: allResults.map(function (r) { return r.url; }),
                            tags: ['summary', 'overview'],
                            evidence: this.extractEvidence(allResults, 'summary')
                        });
                        return [4 /*yield*/, this.identifyKeyFindings(allResults, query)];
                    case 2:
                        keyFindings = _a.sent();
                        insights.push.apply(insights, keyFindings);
                        return [4 /*yield*/, this.generateRecommendations(allResults, query)];
                    case 3:
                        recommendations = _a.sent();
                        insights.push.apply(insights, recommendations);
                        return [2 /*return*/, insights];
                }
            });
        });
    };
    AnalysisAgent.prototype.generateSummary = function (results, query) {
        return __awaiter(this, void 0, void 0, function () {
            var domains, contentTypes;
            return __generator(this, function (_a) {
                domains = Array.from(new Set(results.map(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain) || 'unknown'; })));
                contentTypes = Array.from(new Set(results.map(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.contentType) || 'unknown'; })));
                return [2 /*return*/, "Comprehensive analysis of \"".concat(query.query, "\" reveals ").concat(results.length, " relevant sources across ").concat(domains.length, " domains. Content distribution includes: ").concat(contentTypes.join(', '), ". The multi-source approach provides diverse perspectives with quality validation.")];
            });
        });
    };
    AnalysisAgent.prototype.identifyKeyFindings = function (results, query) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, qualityScores, avgQuality, domains;
            return __generator(this, function (_a) {
                insights = [];
                qualityScores = results.map(function (r) { return r.qualityScore || 0; });
                avgQuality = qualityScores.reduce(function (sum, score) { return sum + score; }, 0) / qualityScores.length;
                if (avgQuality > 0.7) {
                    insights.push({
                        type: 'pattern',
                        content: "High-quality sources dominate the research results (average quality: ".concat(avgQuality.toFixed(2), "), indicating reliable information availability."),
                        confidence: 0.8,
                        sources: results.map(function (r) { return r.url; }),
                        tags: ['quality', 'reliability'],
                        evidence: this.extractEvidence(results, 'quality')
                    });
                }
                domains = Array.from(new Set(results.map(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain) || 'unknown'; })));
                if (domains.length > 3) {
                    insights.push({
                        type: 'pattern',
                        content: "Research spans ".concat(domains.length, " diverse domains, ensuring comprehensive coverage and reducing bias."),
                        confidence: 0.7,
                        sources: results.map(function (r) { return r.url; }),
                        tags: ['diversity', 'coverage'],
                        evidence: this.extractEvidence(results, 'diversity')
                    });
                }
                return [2 /*return*/, insights];
            });
        });
    };
    AnalysisAgent.prototype.generateRecommendations = function (results, query) {
        return __awaiter(this, void 0, void 0, function () {
            var insights, highQualityResults;
            return __generator(this, function (_a) {
                insights = [];
                highQualityResults = results.filter(function (r) { return (r.qualityScore || 0) > 0.8; });
                if (highQualityResults.length > 0) {
                    insights.push({
                        type: 'recommendation',
                        content: "Focus on the ".concat(highQualityResults.length, " highest-quality sources for authoritative information on \"").concat(query.query, "\"."),
                        confidence: 0.8,
                        sources: highQualityResults.map(function (r) { return r.url; }),
                        tags: ['recommendation', 'quality'],
                        evidence: this.extractEvidence(highQualityResults, 'recommendation')
                    });
                }
                return [2 /*return*/, insights];
            });
        });
    };
    AnalysisAgent.prototype.identifyPatterns = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var patterns, allResults, contentTypeCount, dominantType, domainCount, topDomains;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDD0D Identifying patterns for: ".concat(query.query));
                patterns = [];
                allResults = data.searchResults.flatMap(function (r) { return r.fusedResults; });
                contentTypeCount = new Map();
                allResults.forEach(function (r) {
                    var _a;
                    var type = ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.contentType) || 'unknown';
                    contentTypeCount.set(type, (contentTypeCount.get(type) || 0) + 1);
                });
                dominantType = Array.from(contentTypeCount.entries())
                    .sort(function (a, b) { return b[1] - a[1]; })[0];
                if (dominantType && dominantType[1] > allResults.length * 0.4) {
                    patterns.push({
                        type: 'content_type',
                        description: "Content is predominantly ".concat(dominantType[0], " format (").concat(Math.round(dominantType[1] / allResults.length * 100), "%)"),
                        confidence: 0.7,
                        frequency: dominantType[1],
                        examples: allResults.filter(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.contentType) === dominantType[0]; }).map(function (r) { return r.title; }),
                        significance: 'medium'
                    });
                }
                domainCount = new Map();
                allResults.forEach(function (r) {
                    var _a;
                    var domain = ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain) || 'unknown';
                    domainCount.set(domain, (domainCount.get(domain) || 0) + 1);
                });
                topDomains = Array.from(domainCount.entries())
                    .sort(function (a, b) { return b[1] - a[1]; })
                    .slice(0, 3);
                if (topDomains.length > 0) {
                    patterns.push({
                        type: 'behavioral',
                        description: "Information concentration in ".concat(topDomains.length, " primary domains: ").concat(topDomains.map(function (_a) {
                            var domain = _a[0], count = _a[1];
                            return "".concat(domain, " (").concat(count, ")");
                        }).join(', ')),
                        confidence: 0.6,
                        frequency: topDomains.reduce(function (sum, _a) {
                            var count = _a[1];
                            return sum + count;
                        }, 0),
                        examples: topDomains.map(function (_a) {
                            var domain = _a[0];
                            return domain;
                        }),
                        significance: 'medium'
                    });
                }
                return [2 /*return*/, patterns];
            });
        });
    };
    AnalysisAgent.prototype.identifyTrends = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var trends, allResults, qualityScores, avgQuality;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCC8 Identifying trends for: ".concat(query.query));
                trends = [];
                allResults = data.searchResults.flatMap(function (r) { return r.fusedResults; });
                qualityScores = allResults.map(function (r) { return r.qualityScore || 0; });
                avgQuality = qualityScores.reduce(function (sum, score) { return sum + score; }, 0) / qualityScores.length;
                if (avgQuality > 0.7) {
                    trends.push({
                        direction: 'stable',
                        description: "Consistent high-quality information available for \"".concat(query.query, "\""),
                        confidence: 0.7,
                        timeframe: 'current',
                        magnitude: avgQuality,
                        evidence: this.extractEvidence(allResults, 'quality')
                    });
                }
                return [2 /*return*/, trends];
            });
        });
    };
    AnalysisAgent.prototype.detectContradictions = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var contradictions, allResults, qualityScores, avgQuality, lowQualityResults;
            return __generator(this, function (_a) {
                console.log("\u26A0\uFE0F Detecting contradictions for: ".concat(query.query));
                contradictions = [];
                allResults = data.searchResults.flatMap(function (r) { return r.fusedResults; });
                qualityScores = allResults.map(function (r) { return r.qualityScore || 0; });
                avgQuality = qualityScores.reduce(function (sum, score) { return sum + score; }, 0) / qualityScores.length;
                lowQualityResults = allResults.filter(function (r) { return (r.qualityScore || 0) < avgQuality * 0.6; });
                if (lowQualityResults.length > 0) {
                    contradictions.push({
                        description: "Found ".concat(lowQualityResults.length, " sources with significantly lower quality scores, potentially indicating unreliable information"),
                        sources: lowQualityResults.map(function (r) { return r.url; }),
                        confidence: 0.6,
                        severity: 'medium',
                        resolution: 'Cross-reference with high-quality sources and verify claims independently'
                    });
                }
                return [2 /*return*/, contradictions];
            });
        });
    };
    AnalysisAgent.prototype.analyzeSentiment = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("\uD83D\uDE0A Analyzing sentiment for: ".concat(query.query));
                // For now, return neutral sentiment
                // In full implementation, this would use NLP libraries for sentiment analysis
                return [2 /*return*/, {
                        overall: 'neutral',
                        distribution: {
                            positive: 0.4,
                            negative: 0.2,
                            neutral: 0.4
                        },
                        trends: [],
                        sources: []
                    }];
            });
        });
    };
    AnalysisAgent.prototype.extractTopics = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var topics, allResults, commonWords, wordCount;
            return __generator(this, function (_a) {
                console.log("\uD83C\uDFF7\uFE0F Extracting topics for: ".concat(query.query));
                topics = [];
                allResults = data.searchResults.flatMap(function (r) { return r.fusedResults; });
                commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
                wordCount = new Map();
                allResults.forEach(function (result) {
                    var words = result.title.toLowerCase().split(/\s+/)
                        .concat(result.content.toLowerCase().split(/\s+/))
                        .filter(function (word) { return word.length > 3 && !commonWords.has(word); });
                    words.forEach(function (word) {
                        wordCount.set(word, (wordCount.get(word) || 0) + 1);
                    });
                });
                // Convert to topics
                Array.from(wordCount.entries())
                    .sort(function (a, b) { return b[1] - a[1]; })
                    .slice(0, 10)
                    .forEach(function (_a) {
                    var word = _a[0], count = _a[1];
                    topics.push({
                        name: word,
                        relevance: count / allResults.length,
                        frequency: count,
                        subtopics: [],
                        relatedTopics: []
                    });
                });
                return [2 /*return*/, topics];
            });
        });
    };
    AnalysisAgent.prototype.extractEntities = function (data, query) {
        return __awaiter(this, void 0, void 0, function () {
            var entities, allResults, domains;
            return __generator(this, function (_a) {
                console.log("\uD83C\uDFE2 Extracting entities for: ".concat(query.query));
                entities = [];
                allResults = data.searchResults.flatMap(function (r) { return r.fusedResults; });
                domains = Array.from(new Set(allResults.map(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain) || 'unknown'; })));
                domains.forEach(function (domain) {
                    entities.push({
                        name: domain,
                        type: 'organization',
                        relevance: 0.7,
                        mentions: allResults.filter(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain) === domain; }).length,
                        context: allResults.filter(function (r) { var _a; return ((_a = r.metadata) === null || _a === void 0 ? void 0 : _a.domain) === domain; }).map(function (r) { return r.title; })
                    });
                });
                return [2 /*return*/, entities];
            });
        });
    };
    AnalysisAgent.prototype.extractEvidence = function (results, type) {
        return results.slice(0, 3).map(function (result) { return ({
            source: result.url,
            content: result.content.substring(0, 200) + '...',
            relevance: result.relevanceScore || 0.5,
            type: 'quote',
            credibility: result.qualityScore || 0.7
        }); });
    };
    AnalysisAgent.prototype.calculateConfidence = function (insights, patterns, trends, contradictions) {
        var allItems = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], insights, true), patterns, true), trends, true), contradictions, true);
        if (allItems.length === 0)
            return 0;
        var avgConfidence = allItems.reduce(function (sum, item) { return sum + item.confidence; }, 0) / allItems.length;
        return avgConfidence;
    };
    AnalysisAgent.prototype.calculateCoverage = function (data) {
        var totalSources = data.urlsTotal;
        var uniqueSources = data.urlsProcessed.length;
        return totalSources > 0 ? uniqueSources / totalSources : 0;
    };
    return AnalysisAgent;
}(agent_js_1.Agent));
exports.AnalysisAgent = AnalysisAgent;
exports.default = AnalysisAgent;
