"use strict";
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
exports.VectorDatabaseService = void 0;
// src/services/vectorDB.ts
var chromadb_1 = require("chromadb");
var openai_1 = require("openai");
var VectorDatabaseService = /** @class */ (function () {
    function VectorDatabaseService() {
        this.collectionName = 'research_documents';
        var chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
        this.client = new chromadb_1.ChromaClient({
            path: chromaUrl
        });
        this.openai = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    VectorDatabaseService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var collections, exists, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.client.listCollections()];
                    case 1:
                        collections = _a.sent();
                        exists = collections.some(function (col) { return col.name === _this.collectionName; });
                        if (!!exists) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.client.createCollection({
                                name: this.collectionName,
                                metadata: {
                                    description: 'Research documents with embeddings for semantic search'
                                }
                            })];
                    case 2:
                        _a.sent();
                        console.log("Created collection: ".concat(this.collectionName));
                        return [3 /*break*/, 4];
                    case 3:
                        console.log("Collection ".concat(this.collectionName, " already exists"));
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Failed to initialize VectorDB:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    VectorDatabaseService.prototype.generateEmbeddings = function (texts) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.openai.embeddings.create({
                                model: 'text-embedding-3-small',
                                input: texts,
                                encoding_format: 'float'
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.map(function (item) { return item.embedding; })];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Failed to generate embeddings:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    VectorDatabaseService.prototype.storeDocuments = function (chunks) {
        return __awaiter(this, void 0, void 0, function () {
            var collection, texts, embeddings, ids, documents, metadatas, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.client.getCollection({ name: this.collectionName })];
                    case 1:
                        collection = _a.sent();
                        texts = chunks.map(function (chunk) { return chunk.content; });
                        return [4 /*yield*/, this.generateEmbeddings(texts)];
                    case 2:
                        embeddings = _a.sent();
                        ids = chunks.map(function (chunk) { return chunk.id; });
                        documents = chunks.map(function (chunk) { return chunk.content; });
                        metadatas = chunks.map(function (chunk) { return chunk.metadata; });
                        return [4 /*yield*/, collection.add({
                                ids: ids,
                                documents: documents,
                                embeddings: embeddings,
                                metadatas: metadatas
                            })];
                    case 3:
                        _a.sent();
                        console.log("Stored ".concat(chunks.length, " document chunks in VectorDB"));
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Failed to store documents:', error_3);
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VectorDatabaseService.prototype.semanticSearch = function (query_1) {
        return __awaiter(this, arguments, void 0, function (query, limit, filters) {
            var collection, queryEmbedding, results, chunks, i, error_4;
            var _a, _b;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.client.getCollection({ name: this.collectionName })];
                    case 1:
                        collection = _c.sent();
                        return [4 /*yield*/, this.generateEmbeddings([query])];
                    case 2:
                        queryEmbedding = _c.sent();
                        return [4 /*yield*/, collection.query({
                                queryEmbeddings: queryEmbedding,
                                nResults: limit,
                                where: filters
                            })];
                    case 3:
                        results = _c.sent();
                        chunks = [];
                        if (results.ids && results.ids[0]) {
                            for (i = 0; i < results.ids[0].length; i++) {
                                chunks.push({
                                    id: results.ids[0][i] || '',
                                    content: results.documents[0][i] || '',
                                    metadata: results.metadatas[0][i],
                                    embeddings: ((_b = (_a = results.embeddings) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b[i]) || undefined
                                });
                            }
                        }
                        return [2 /*return*/, chunks];
                    case 4:
                        error_4 = _c.sent();
                        console.error('Failed to perform semantic search:', error_4);
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VectorDatabaseService.prototype.getCollectionStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var collection, count, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.client.getCollection({ name: this.collectionName })];
                    case 1:
                        collection = _a.sent();
                        return [4 /*yield*/, collection.count()];
                    case 2:
                        count = _a.sent();
                        return [2 /*return*/, { count: count }];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Failed to get collection stats:', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    VectorDatabaseService.prototype.clearCollection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.deleteCollection({ name: this.collectionName })];
                    case 1:
                        _a.sent();
                        console.log("Cleared collection: ".concat(this.collectionName));
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Failed to clear collection:', error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return VectorDatabaseService;
}());
exports.VectorDatabaseService = VectorDatabaseService;
