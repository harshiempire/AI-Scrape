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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchCoordinatorAgent = void 0;
// src/agents/researchCoordinatorAgent.ts
var agent_js_1 = require("../core/agent.js");
var ResearchCoordinatorAgent = /** @class */ (function (_super) {
    __extends(ResearchCoordinatorAgent, _super);
    function ResearchCoordinatorAgent(options) {
        var _this = _super.call(this, __assign(__assign({}, options), { system: options.system || "You are a research coordinator managing a team of specialized research agents.\n\nYour responsibilities:\n1. Analyze research queries and determine optimal strategy\n2. Delegate tasks to appropriate specialized agents\n3. Coordinate between agents to ensure comprehensive coverage\n4. Synthesize findings from multiple agents\n5. Ensure research quality and completeness\n\nAvailable agents:\n- DataCollectionAgent: Gathers data from multiple sources\n- AnalysisAgent: Analyzes content and identifies patterns\n- SynthesisAgent: Combines findings into coherent insights\n- QualityAgent: Validates sources and checks facts\n\nAlways provide clear, actionable instructions to agents and maintain context across the research process." })) || this;
        _this.progressCallbacks = [];
        _this.activeSessions = new Map();
        _this._llm = options.llm;
        _this._memory = options.memory;
        _this._tools = options.tools;
        return _this;
    }
    ResearchCoordinatorAgent.prototype.generateLLMResponse = function (prompt) {
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
    ResearchCoordinatorAgent.prototype.conductDeepResearch = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, startTime, strategy, tasks, rawData, analysis, insights, session, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sessionId = this.generateSessionId();
                        startTime = Date.now();
                        console.log("\uD83E\uDDE0 Starting Deep Research Session ".concat(sessionId, " for query: ").concat(query.query));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 13, , 15]);
                        // Update progress: Starting
                        return [4 /*yield*/, this.updateProgress(sessionId, {
                                sessionId: sessionId,
                                step: 'starting',
                                progress: 5,
                                currentTask: 'Initializing research strategy',
                                urlsProcessed: [],
                                urlsTotal: 0,
                                insightsFound: 0
                            })];
                    case 2:
                        // Update progress: Starting
                        _a.sent();
                        return [4 /*yield*/, this.determineResearchStrategy(query)];
                    case 3:
                        strategy = _a.sent();
                        console.log("\uD83D\uDCCB Research Strategy: ".concat(strategy));
                        // Update progress: Analyzing
                        return [4 /*yield*/, this.updateProgress(sessionId, {
                                sessionId: sessionId,
                                step: 'analyzing',
                                progress: 15,
                                currentTask: 'Analyzing query and planning research approach',
                                urlsProcessed: [],
                                urlsTotal: 0,
                                insightsFound: 0
                            })];
                    case 4:
                        // Update progress: Analyzing
                        _a.sent();
                        return [4 /*yield*/, this.createAgentTasks(query, strategy)];
                    case 5:
                        tasks = _a.sent();
                        console.log("\uD83D\uDCDD Created ".concat(tasks.length, " agent tasks"));
                        return [4 /*yield*/, this.executeDataCollection(query, tasks, sessionId)];
                    case 6:
                        rawData = _a.sent();
                        // Update progress: Processing
                        return [4 /*yield*/, this.updateProgress(sessionId, {
                                sessionId: sessionId,
                                step: 'processing',
                                progress: 60,
                                currentTask: 'Processing and analyzing collected data',
                                urlsProcessed: rawData.urlsProcessed,
                                urlsTotal: rawData.urlsTotal,
                                insightsFound: 0
                            })];
                    case 7:
                        // Update progress: Processing
                        _a.sent();
                        return [4 /*yield*/, this.executeAnalysis(rawData, query, sessionId)];
                    case 8:
                        analysis = _a.sent();
                        // Update progress: Synthesizing
                        return [4 /*yield*/, this.updateProgress(sessionId, {
                                sessionId: sessionId,
                                step: 'synthesizing',
                                progress: 85,
                                currentTask: 'Synthesizing insights and generating final report',
                                urlsProcessed: rawData.urlsProcessed,
                                urlsTotal: rawData.urlsTotal,
                                insightsFound: analysis.insights.length
                            })];
                    case 9:
                        // Update progress: Synthesizing
                        _a.sent();
                        return [4 /*yield*/, this.executeSynthesis(analysis, query, sessionId)];
                    case 10:
                        insights = _a.sent();
                        session = {
                            id: sessionId,
                            queries: [query],
                            results: rawData.searchResults,
                            insights: insights,
                            metadata: {
                                createdAt: new Date(),
                                totalSearchTime: Date.now() - startTime,
                                totalResults: rawData.searchResults.reduce(function (sum, r) { return sum + r.fusedResults.length; }, 0),
                                vectorDBCount: rawData.vectorDBCount || 0
                            }
                        };
                        // Store session in memory
                        this.activeSessions.set(sessionId, session);
                        return [4 /*yield*/, this.storeSessionInMemory(session)];
                    case 11:
                        _a.sent();
                        // Update progress: Completed
                        return [4 /*yield*/, this.updateProgress(sessionId, {
                                sessionId: sessionId,
                                step: 'completed',
                                progress: 100,
                                currentTask: 'Research completed successfully',
                                urlsProcessed: rawData.urlsProcessed,
                                urlsTotal: rawData.urlsTotal,
                                insightsFound: insights.length
                            })];
                    case 12:
                        // Update progress: Completed
                        _a.sent();
                        console.log("\u2705 Deep Research Session ".concat(sessionId, " completed in ").concat(session.metadata.totalSearchTime, "ms"));
                        return [2 /*return*/, session];
                    case 13:
                        error_1 = _a.sent();
                        console.error("\u274C Deep Research Session ".concat(sessionId, " failed:"), error_1);
                        // Update progress: Failed
                        return [4 /*yield*/, this.updateProgress(sessionId, {
                                sessionId: sessionId,
                                step: 'failed',
                                progress: 0,
                                currentTask: "Research failed: ".concat(error_1.message),
                                urlsProcessed: [],
                                urlsTotal: 0,
                                insightsFound: 0
                            })];
                    case 14:
                        // Update progress: Failed
                        _a.sent();
                        throw error_1;
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    ResearchCoordinatorAgent.prototype.determineResearchStrategy = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var strategyPrompt, response;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        strategyPrompt = "\nAnalyze this research query and determine the optimal research strategy:\n\nQuery: \"".concat(query.query, "\"\nDepth: ").concat(query.depth, "\nFocus Areas: ").concat(((_a = query.focusAreas) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'None specified', "\nContext: ").concat(JSON.stringify(query.context || {}), "\n\nAvailable strategies:\n1. exploratory - For broad, open-ended research\n2. systematic - For comprehensive, methodical research\n3. comparative - For comparing multiple options/approaches\n4. trend_analysis - For identifying patterns and trends over time\n\nConsider:\n- Query complexity and specificity\n- Depth requirements\n- Focus areas\n- Context constraints\n\nRespond with just the strategy name (e.g., \"exploratory\").\n");
                        return [4 /*yield*/, this.generateLLMResponse(strategyPrompt)];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.trim().toLowerCase()];
                }
            });
        });
    };
    ResearchCoordinatorAgent.prototype.createAgentTasks = function (query, strategy) {
        return __awaiter(this, void 0, void 0, function () {
            var tasks;
            return __generator(this, function (_a) {
                tasks = [];
                // Data Collection Tasks
                tasks.push({
                    agentType: 'data_collection',
                    task: "Gather comprehensive data for \"".concat(query.query, "\" using ").concat(strategy, " approach"),
                    priority: 'high',
                    context: query.context || {}
                });
                // Analysis Tasks
                tasks.push({
                    agentType: 'analysis',
                    task: "Analyze collected data for patterns, trends, and key insights related to \"".concat(query.query, "\""),
                    priority: 'high',
                    dependencies: ['data_collection'],
                    context: query.context || {}
                });
                // Synthesis Tasks
                tasks.push({
                    agentType: 'synthesis',
                    task: "Synthesize analysis results into coherent insights and recommendations for \"".concat(query.query, "\""),
                    priority: 'medium',
                    dependencies: ['analysis'],
                    context: query.context || {}
                });
                // Quality Tasks
                tasks.push({
                    agentType: 'quality',
                    task: "Validate sources and fact-check findings for \"".concat(query.query, "\""),
                    priority: 'medium',
                    dependencies: ['data_collection'],
                    context: query.context || {}
                });
                return [2 /*return*/, tasks];
            });
        });
    };
    ResearchCoordinatorAgent.prototype.executeDataCollection = function (query, tasks, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var DataCollectionAgent, dataAgent, rawData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDD0D Executing data collection for session ".concat(sessionId));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./dataCollectionAgent.js'); })];
                    case 1:
                        DataCollectionAgent = (_a.sent()).DataCollectionAgent;
                        dataAgent = new DataCollectionAgent({
                            llm: this._llm,
                            memory: this._memory,
                            tools: this._tools
                        });
                        return [4 /*yield*/, dataAgent.collectData(query)];
                    case 2:
                        rawData = _a.sent();
                        return [2 /*return*/, {
                                searchResults: rawData.searchResults,
                                urlsProcessed: rawData.urlsProcessed,
                                urlsTotal: rawData.urlsTotal,
                                vectorDBCount: rawData.metadata.qualityMetrics.overallScore * 1000 // Convert to count-like number
                            }];
                }
            });
        });
    };
    ResearchCoordinatorAgent.prototype.executeAnalysis = function (rawData, query, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var AnalysisAgent, analysisAgent, analysisResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDD2C Executing analysis for session ".concat(sessionId));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./analysisAgent.js'); })];
                    case 1:
                        AnalysisAgent = (_a.sent()).AnalysisAgent;
                        analysisAgent = new AnalysisAgent({
                            llm: this._llm,
                            memory: this._memory,
                            tools: this._tools
                        });
                        return [4 /*yield*/, analysisAgent.analyzeData(rawData, query)];
                    case 2:
                        analysisResult = _a.sent();
                        return [2 /*return*/, {
                                insights: analysisResult.insights,
                                patterns: analysisResult.patterns,
                                trends: analysisResult.trends
                            }];
                }
            });
        });
    };
    ResearchCoordinatorAgent.prototype.executeSynthesis = function (analysis, query, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var SynthesisAgent, synthesisAgent, synthesisResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83E\uDDE9 Executing synthesis for session ".concat(sessionId));
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./synthesisAgent.js'); })];
                    case 1:
                        SynthesisAgent = (_a.sent()).SynthesisAgent;
                        synthesisAgent = new SynthesisAgent({
                            llm: this._llm,
                            memory: this._memory,
                            tools: this._tools
                        });
                        return [4 /*yield*/, synthesisAgent.synthesizeInsights(analysis, query)];
                    case 2:
                        synthesisResult = _a.sent();
                        return [2 /*return*/, synthesisResult.insights];
                }
            });
        });
    };
    ResearchCoordinatorAgent.prototype.generateSessionId = function () {
        return "deep_research_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    ResearchCoordinatorAgent.prototype.getMaxResultsForDepth = function (depth) {
        switch (depth) {
            case 'shallow': return 5;
            case 'medium': return 15;
            case 'deep': return 30;
            default: return 10;
        }
    };
    ResearchCoordinatorAgent.prototype.generateFollowUpQueries = function (originalQuery, initialResults) {
        var followUps = [];
        if (originalQuery.depth === 'shallow') {
            return followUps;
        }
        // Extract key topics from initial results
        var topics = this.extractTopics(initialResults.fusedResults);
        // Generate follow-up queries based on topics
        for (var _i = 0, _a = topics.slice(0, 3); _i < _a.length; _i++) {
            var topic = _a[_i];
            followUps.push({
                query: "".concat(originalQuery.query, " ").concat(topic),
                depth: 'shallow',
                maxResults: 5,
                strategy: originalQuery.strategy,
                context: originalQuery.context
            });
        }
        return followUps;
    };
    ResearchCoordinatorAgent.prototype.extractTopics = function (results) {
        var topics = new Set();
        var commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must']);
        var _loop_1 = function (result) {
            var words = result.title.toLowerCase().split(/\s+/)
                .concat(result.content.toLowerCase().split(/\s+/))
                .filter(function (word) { return word.length > 3 && !commonWords.has(word); });
            var wordCount = new Map();
            words.forEach(function (word) {
                wordCount.set(word, (wordCount.get(word) || 0) + 1);
            });
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
    ResearchCoordinatorAgent.prototype.generateSummary = function (results, query) {
        var domains = Array.from(new Set(results.map(function (r) { return r.metadata.domain; })));
        var contentTypes = Array.from(new Set(results.map(function (r) { return r.metadata.contentType; })));
        return "Deep research on \"".concat(query, "\" found ").concat(results.length, " relevant sources across ").concat(domains.length, " domains. Content types include: ").concat(contentTypes.join(', '), ". The comprehensive analysis provides multi-perspective insights with quality validation.");
    };
    ResearchCoordinatorAgent.prototype.identifyTrends = function (results) {
        var insights = [];
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
                content: "Primary information sources: ".concat(topDomains.map(function (_a) {
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
    ResearchCoordinatorAgent.prototype.identifyPatterns = function (results) {
        var insights = [];
        var contentTypeCount = new Map();
        results.forEach(function (r) {
            contentTypeCount.set(r.metadata.contentType, (contentTypeCount.get(r.metadata.contentType) || 0) + 1);
        });
        var dominantType = Array.from(contentTypeCount.entries())
            .sort(function (a, b) { return b[1] - a[1]; })[0];
        if (dominantType && dominantType[1] > results.length * 0.4) {
            insights.push({
                type: 'pattern',
                content: "Content distribution shows ".concat(Math.round(dominantType[1] / results.length * 100), "% ").concat(dominantType[0], " format, indicating this topic is primarily discussed in ").concat(dominantType[0], " context."),
                confidence: 0.6,
                sources: results.map(function (r) { return r.url; }),
                tags: ['pattern', 'content-type', 'distribution']
            });
        }
        return insights;
    };
    // Progress tracking methods
    ResearchCoordinatorAgent.prototype.onProgress = function (callback) {
        this.progressCallbacks.push(callback);
    };
    ResearchCoordinatorAgent.prototype.updateProgress = function (sessionId, progress) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCCA Progress Update [".concat(sessionId, "]: ").concat(progress.step, " - ").concat(progress.progress, "% - ").concat(progress.currentTask));
                // Notify all progress callbacks
                this.progressCallbacks.forEach(function (callback) {
                    try {
                        callback(progress);
                    }
                    catch (error) {
                        console.error('Error in progress callback:', error);
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    ResearchCoordinatorAgent.prototype.storeSessionInMemory = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Store session in persistent memory for future reference
                    return [4 /*yield*/, this._memory.store({
                            role: 'system',
                            content: "Research session ".concat(session.id, " completed: ").concat(JSON.stringify(session.metadata))
                        })];
                    case 1:
                        // Store session in persistent memory for future reference
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ResearchCoordinatorAgent.prototype.resumeResearch = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                session = this.activeSessions.get(sessionId);
                if (!session) {
                    throw new Error("Session ".concat(sessionId, " not found"));
                }
                console.log("\uD83D\uDD04 Resuming research session ".concat(sessionId));
                return [2 /*return*/, session];
            });
        });
    };
    ResearchCoordinatorAgent.prototype.getActiveSessions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.activeSessions.values())];
            });
        });
    };
    return ResearchCoordinatorAgent;
}(agent_js_1.Agent));
exports.ResearchCoordinatorAgent = ResearchCoordinatorAgent;
exports.default = ResearchCoordinatorAgent;
