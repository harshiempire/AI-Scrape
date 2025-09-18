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
exports.SynthesisAgent = void 0;
// src/agents/synthesisAgent.ts
var agent_js_1 = require("../core/agent.js");
var SynthesisAgent = /** @class */ (function (_super) {
    __extends(SynthesisAgent, _super);
    function SynthesisAgent(options) {
        var _this = _super.call(this, __assign(__assign({}, options), { system: options.system || "You are a synthesis specialist focused on combining findings into coherent insights.\n\nYour capabilities:\n1. Cross-reference findings from multiple sources\n2. Generate insights and conclusions\n3. Identify contradictions and resolve conflicts\n4. Create comprehensive research summaries\n5. Generate actionable recommendations\n\nSynthesis approach:\n- Integrate findings from multiple perspectives\n- Identify patterns and relationships\n- Resolve contradictions through evidence evaluation\n- Generate actionable insights\n- Provide clear, structured conclusions\n\nFocus on creating value through synthesis rather than just summarizing." })) || this;
        _this._llm = options.llm;
        _this._memory = options.memory;
        _this._tools = options.tools;
        return _this;
    }
    SynthesisAgent.prototype.generateLLMResponse = function (prompt) {
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
    SynthesisAgent.prototype.synthesizeInsights = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, executiveSummary, keyFindings, recommendations, conclusions, insights, confidence, completeness, synthesisResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        console.log("\uD83E\uDDE9 Synthesis Agent starting synthesis for: ".concat(query.query));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.generateExecutiveSummary(analysis, query)];
                    case 2:
                        executiveSummary = _a.sent();
                        return [4 /*yield*/, this.extractKeyFindings(analysis, query)];
                    case 3:
                        keyFindings = _a.sent();
                        return [4 /*yield*/, this.generateRecommendations(analysis, query)];
                    case 4:
                        recommendations = _a.sent();
                        return [4 /*yield*/, this.drawConclusions(analysis, query)];
                    case 5:
                        conclusions = _a.sent();
                        return [4 /*yield*/, this.synthesizeInsightsFromAnalysis(analysis, query)];
                    case 6:
                        insights = _a.sent();
                        confidence = this.calculateSynthesisConfidence(keyFindings, recommendations, conclusions);
                        completeness = this.calculateCompleteness(analysis);
                        synthesisResult = {
                            executiveSummary: executiveSummary,
                            keyFindings: keyFindings,
                            recommendations: recommendations,
                            conclusions: conclusions,
                            insights: insights,
                            metadata: {
                                synthesisTime: Date.now() - startTime,
                                confidence: confidence,
                                completeness: completeness
                            }
                        };
                        console.log("\u2705 Synthesis completed in ".concat(synthesisResult.metadata.synthesisTime, "ms"));
                        console.log("\uD83D\uDCCA Generated: ".concat(keyFindings.length, " key findings, ").concat(recommendations.length, " recommendations, ").concat(conclusions.length, " conclusions"));
                        return [2 /*return*/, synthesisResult];
                    case 7:
                        error_1 = _a.sent();
                        console.error('❌ Synthesis failed:', error_1);
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SynthesisAgent.prototype.generateExecutiveSummary = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var summaryPrompt, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDCDD Generating executive summary for: ".concat(query.query));
                        summaryPrompt = "\nGenerate a comprehensive executive summary for research on \"".concat(query.query, "\".\n\nAnalysis Results:\n- Insights: ").concat(analysis.insights.length, "\n- Patterns: ").concat(analysis.patterns.length, "\n- Trends: ").concat(analysis.trends.length, "\n- Contradictions: ").concat(analysis.contradictions.length, "\n- Topics: ").concat(analysis.topics.length, "\n- Entities: ").concat(analysis.entities.length, "\n\nKey Insights:\n").concat(analysis.insights.map(function (insight) { return "- ".concat(insight.content); }).join('\n'), "\n\nKey Patterns:\n").concat(analysis.patterns.map(function (pattern) { return "- ".concat(pattern.description); }).join('\n'), "\n\nProvide a clear, concise executive summary that captures the essence of the research findings.\n");
                        return [4 /*yield*/, this.generateLLMResponse(summaryPrompt)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    SynthesisAgent.prototype.extractKeyFindings = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var keyFindings;
            var _this = this;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDD0D Extracting key findings for: ".concat(query.query));
                keyFindings = [];
                // Convert insights to key findings
                analysis.insights.forEach(function (insight) {
                    if (insight.type === 'pattern' || insight.type === 'trend') {
                        keyFindings.push({
                            title: "".concat(insight.type.charAt(0).toUpperCase() + insight.type.slice(1), " Analysis"),
                            description: insight.content,
                            confidence: insight.confidence,
                            evidence: insight.evidence,
                            implications: _this.generateImplications(insight),
                            sources: insight.sources
                        });
                    }
                });
                // Convert patterns to key findings
                analysis.patterns.forEach(function (pattern) {
                    keyFindings.push({
                        title: "".concat(pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1), " Pattern"),
                        description: pattern.description,
                        confidence: pattern.confidence,
                        evidence: _this.convertPatternToEvidence(pattern),
                        implications: _this.generatePatternImplications(pattern),
                        sources: pattern.examples
                    });
                });
                // Convert trends to key findings
                analysis.trends.forEach(function (trend) {
                    keyFindings.push({
                        title: "".concat(trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1), " Trend"),
                        description: trend.description,
                        confidence: trend.confidence,
                        evidence: trend.evidence,
                        implications: _this.generateTrendImplications(trend),
                        sources: trend.evidence.map(function (e) { return e.source; })
                    });
                });
                return [2 /*return*/, keyFindings];
            });
        });
    };
    SynthesisAgent.prototype.generateRecommendations = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations;
            var _this = this;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDCA1 Generating recommendations for: ".concat(query.query));
                recommendations = [];
                // Generate recommendations based on insights
                analysis.insights.forEach(function (insight) {
                    if (insight.type === 'recommendation') {
                        recommendations.push({
                            title: 'Research Recommendation',
                            description: insight.content,
                            priority: _this.determinePriority(insight.confidence),
                            rationale: "Based on analysis confidence of ".concat(insight.confidence),
                            implementation: _this.generateImplementationSteps(insight),
                            expectedOutcome: 'Improved research quality and reliability',
                            confidence: insight.confidence
                        });
                    }
                });
                // Generate recommendations based on contradictions
                analysis.contradictions.forEach(function (contradiction) {
                    recommendations.push({
                        title: 'Contradiction Resolution',
                        description: "Address contradiction: ".concat(contradiction.description),
                        priority: _this.mapSeverityToPriority(contradiction.severity),
                        rationale: "Contradiction severity: ".concat(contradiction.severity),
                        implementation: contradiction.resolution ? [contradiction.resolution] : ['Further investigation required'],
                        expectedOutcome: 'Resolved contradiction and improved data reliability',
                        confidence: contradiction.confidence
                    });
                });
                // Generate recommendations based on patterns
                analysis.patterns.forEach(function (pattern) {
                    if (pattern.significance === 'high') {
                        recommendations.push({
                            title: 'Pattern-Based Recommendation',
                            description: "Leverage identified pattern: ".concat(pattern.description),
                            priority: 'medium',
                            rationale: "High significance pattern with ".concat(pattern.confidence, " confidence"),
                            implementation: _this.generatePatternBasedImplementation(pattern),
                            expectedOutcome: 'Enhanced understanding and application of identified patterns',
                            confidence: pattern.confidence
                        });
                    }
                });
                return [2 /*return*/, recommendations];
            });
        });
    };
    SynthesisAgent.prototype.drawConclusions = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var conclusions, mainConclusion;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83C\uDFAF Drawing conclusions for: ".concat(query.query));
                        conclusions = [];
                        return [4 /*yield*/, this.generateMainConclusion(analysis, query)];
                    case 1:
                        mainConclusion = _a.sent();
                        conclusions.push(mainConclusion);
                        // Topic-specific conclusions
                        analysis.topics.forEach(function (topic) {
                            if (topic.relevance > 0.7) {
                                conclusions.push({
                                    statement: "\"".concat(topic.name, "\" is a highly relevant topic with ").concat(topic.frequency, " mentions and ").concat(topic.relevance, " relevance score"),
                                    confidence: topic.relevance,
                                    supportingEvidence: _this.convertTopicToEvidence(topic),
                                    limitations: ['Limited to available sources', 'May not capture all perspectives'],
                                    futureResearch: ["Deeper analysis of ".concat(topic.name), 'Cross-topic correlation analysis']
                                });
                            }
                        });
                        return [2 /*return*/, conclusions];
                }
            });
        });
    };
    SynthesisAgent.prototype.synthesizeInsightsFromAnalysis = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var synthesizedInsights;
            return __generator(this, function (_a) {
                console.log("\uD83D\uDD2C Synthesizing insights from analysis for: ".concat(query.query));
                synthesizedInsights = [];
                // Add original insights
                synthesizedInsights.push.apply(synthesizedInsights, analysis.insights);
                // Generate cross-pattern insights
                if (analysis.patterns.length > 1) {
                    synthesizedInsights.push({
                        type: 'pattern',
                        content: "Multiple patterns identified (".concat(analysis.patterns.length, "), indicating complex relationships in the data"),
                        confidence: 0.7,
                        sources: analysis.patterns.flatMap(function (p) { return p.examples; }),
                        tags: ['synthesis', 'patterns', 'complexity'],
                        evidence: analysis.patterns.map(function (p) { return ({
                            source: 'pattern_analysis',
                            content: p.description,
                            relevance: p.confidence,
                            type: 'reference',
                            credibility: p.confidence
                        }); })
                    });
                }
                // Generate trend-pattern correlation insights
                if (analysis.trends.length > 0 && analysis.patterns.length > 0) {
                    synthesizedInsights.push({
                        type: 'trend',
                        content: "Trend analysis reveals ".concat(analysis.trends.length, " directional patterns, supported by ").concat(analysis.patterns.length, " structural patterns"),
                        confidence: 0.6,
                        sources: __spreadArray(__spreadArray([], analysis.trends.flatMap(function (t) { return t.evidence.map(function (e) { return e.source; }); }), true), analysis.patterns.flatMap(function (p) { return p.examples; }), true),
                        tags: ['synthesis', 'trends', 'patterns'],
                        evidence: __spreadArray(__spreadArray([], analysis.trends.flatMap(function (t) { return t.evidence; }), true), analysis.patterns.map(function (p) { return ({
                            source: 'pattern_analysis',
                            content: p.description,
                            relevance: p.confidence,
                            type: 'reference',
                            credibility: p.confidence
                        }); }), true)
                    });
                }
                return [2 /*return*/, synthesizedInsights];
            });
        });
    };
    SynthesisAgent.prototype.generateImplications = function (insight) {
        var implications = [];
        if (insight.type === 'pattern') {
            implications.push('Pattern suggests systematic behavior or structure');
            implications.push('May indicate underlying causes or mechanisms');
        }
        else if (insight.type === 'trend') {
            implications.push('Trend suggests directional change over time');
            implications.push('May predict future developments');
        }
        return implications;
    };
    SynthesisAgent.prototype.convertPatternToEvidence = function (pattern) {
        return pattern.examples.map(function (example) { return ({
            source: 'pattern_analysis',
            content: example,
            relevance: pattern.confidence,
            type: 'example',
            credibility: pattern.confidence
        }); });
    };
    SynthesisAgent.prototype.generatePatternImplications = function (pattern) {
        var implications = [];
        switch (pattern.type) {
            case 'content_type':
                implications.push('Content type distribution affects information accessibility');
                implications.push('May indicate preferred communication channels');
                break;
            case 'temporal':
                implications.push('Temporal patterns suggest time-dependent factors');
                implications.push('May indicate cyclical or seasonal influences');
                break;
            case 'geographical':
                implications.push('Geographical patterns suggest location-dependent factors');
                implications.push('May indicate regional variations or influences');
                break;
            default:
                implications.push('Pattern suggests systematic behavior');
                implications.push('May indicate underlying structural factors');
        }
        return implications;
    };
    SynthesisAgent.prototype.generateTrendImplications = function (trend) {
        var implications = [];
        switch (trend.direction) {
            case 'increasing':
                implications.push('Trend suggests growing importance or prevalence');
                implications.push('May indicate accelerating change');
                break;
            case 'decreasing':
                implications.push('Trend suggests declining importance or prevalence');
                implications.push('May indicate diminishing influence');
                break;
            case 'stable':
                implications.push('Trend suggests consistent behavior over time');
                implications.push('May indicate established patterns');
                break;
            case 'cyclical':
                implications.push('Trend suggests recurring patterns');
                implications.push('May indicate predictable variations');
                break;
        }
        return implications;
    };
    SynthesisAgent.prototype.determinePriority = function (confidence) {
        if (confidence > 0.8)
            return 'high';
        if (confidence > 0.6)
            return 'medium';
        return 'low';
    };
    SynthesisAgent.prototype.generateImplementationSteps = function (insight) {
        return [
            'Review and validate findings',
            'Identify specific actions based on insights',
            'Implement changes systematically',
            'Monitor results and adjust as needed'
        ];
    };
    SynthesisAgent.prototype.mapSeverityToPriority = function (severity) {
        switch (severity) {
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
        }
    };
    SynthesisAgent.prototype.generatePatternBasedImplementation = function (pattern) {
        return [
            "Analyze ".concat(pattern.type, " pattern in detail"),
            'Identify underlying causes or mechanisms',
            'Develop strategies to leverage or address pattern',
            'Implement pattern-based solutions'
        ];
    };
    SynthesisAgent.prototype.generateMainConclusion = function (analysis, query) {
        return __awaiter(this, void 0, void 0, function () {
            var conclusionPrompt, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conclusionPrompt = "\nBased on comprehensive analysis of \"".concat(query.query, "\", generate a main conclusion.\n\nAnalysis Summary:\n- ").concat(analysis.insights.length, " insights generated\n- ").concat(analysis.patterns.length, " patterns identified\n- ").concat(analysis.trends.length, " trends detected\n- ").concat(analysis.contradictions.length, " contradictions found\n- Overall confidence: ").concat(analysis.metadata.confidence, "\n\nProvide a clear, evidence-based conclusion that synthesizes the key findings.\n");
                        return [4 /*yield*/, this.generateLLMResponse(conclusionPrompt)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                statement: response,
                                confidence: analysis.metadata.confidence,
                                supportingEvidence: analysis.insights.flatMap(function (i) { return i.evidence; }),
                                limitations: [
                                    'Analysis limited to available sources',
                                    'May not capture all perspectives',
                                    'Confidence based on source quality'
                                ],
                                futureResearch: [
                                    'Expand source diversity',
                                    'Conduct longitudinal analysis',
                                    'Validate findings with additional sources'
                                ]
                            }];
                }
            });
        });
    };
    SynthesisAgent.prototype.convertTopicToEvidence = function (topic) {
        return [{
                source: 'topic_analysis',
                content: "Topic \"".concat(topic.name, "\" with ").concat(topic.frequency, " mentions"),
                relevance: topic.relevance,
                type: 'statistic',
                credibility: topic.relevance
            }];
    };
    SynthesisAgent.prototype.calculateSynthesisConfidence = function (keyFindings, recommendations, conclusions) {
        var allItems = __spreadArray(__spreadArray(__spreadArray([], keyFindings, true), recommendations, true), conclusions, true);
        if (allItems.length === 0)
            return 0;
        var avgConfidence = allItems.reduce(function (sum, item) { return sum + item.confidence; }, 0) / allItems.length;
        return avgConfidence;
    };
    SynthesisAgent.prototype.calculateCompleteness = function (analysis) {
        var totalComponents = 6; // insights, patterns, trends, contradictions, topics, entities
        var presentComponents = [
            analysis.insights.length > 0,
            analysis.patterns.length > 0,
            analysis.trends.length > 0,
            analysis.contradictions.length > 0,
            analysis.topics.length > 0,
            analysis.entities.length > 0
        ].filter(Boolean).length;
        return presentComponents / totalComponents;
    };
    return SynthesisAgent;
}(agent_js_1.Agent));
exports.SynthesisAgent = SynthesisAgent;
exports.default = SynthesisAgent;
