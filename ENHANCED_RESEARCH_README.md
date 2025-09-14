# Enhanced Research Workflow

A comprehensive AI-powered research system that combines real-time web search with semantic search capabilities using vector databases.

## 🚀 Features

### **Hybrid Search Architecture**
- **Real-time Search**: Uses SerpAPI to get current, trending results
- **Semantic Search**: Leverages vector database for deep, contextual understanding
- **Intelligent Fusion**: Combines both approaches for comprehensive results

### **Advanced Content Processing**
- **Smart Chunking**: Breaks content into semantic chunks with overlap
- **Quality Scoring**: Evaluates content quality based on multiple factors
- **Metadata Enrichment**: Extracts and stores rich metadata for each document

### **Robust Web Scraping**
- **Retry Logic**: Exponential backoff with jitter for failed requests
- **Rate Limiting**: Prevents overwhelming target servers
- **User-Agent Rotation**: Reduces detection and blocking
- **Smart Fallback**: Static HTML first, then rendered content if needed

### **Research Workflow Orchestration**
- **Multi-depth Research**: Shallow, medium, and deep research modes
- **Follow-up Queries**: Automatically generates related searches
- **Insight Generation**: Identifies trends, patterns, and contradictions
- **Session Management**: Tracks research sessions with metadata

## 📁 Project Structure

```
src/
├── services/
│   ├── vectorDB.ts          # ChromaDB integration
│   ├── contentChunker.ts    # Content chunking logic
│   └── retryService.ts      # Retry and rate limiting
├── tools/
│   ├── enhancedSearchTool.ts # Main search tool
│   ├── searchTool.ts        # Original search tool
│   ├── htmlParse.ts         # HTML parsing
│   └── renderHtml.ts        # Browser rendering
├── workflows/
│   └── researchWorkflow.ts  # Research orchestration
├── examples/
│   └── enhancedResearchExample.ts # Usage example
└── core/                    # AI Agents framework
```

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- OpenAI API key
- SerpAPI key

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables**:
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your-openai-api-key" > .env
   echo "SERPAPI_API_KEY=your-serpapi-key" >> .env
   echo "CHROMA_URL=http://localhost:8000" >> .env
   ```

3. **Start ChromaDB with Docker**:
   ```bash
   npm run chroma:start
   ```

### Alternative: Local ChromaDB Setup

If you prefer to run ChromaDB locally instead of Docker:

1. **Install Python 3.8+ and ChromaDB**:
   ```bash
   pip install chromadb
   ```

2. **Start ChromaDB locally**:
   ```bash
   chroma run --host localhost --port 8000
   ```

## 🎯 Usage

### Basic Search

```typescript
import enhancedSearchTool from './src/tools/enhancedSearchTool.js';

const results = await enhancedSearchTool.run({
  query: "AI research workflows",
  useVectorDB: true,
  maxResults: 10,
  storeResults: true
});

console.log(results.fusedResults);
```

### Research Workflow

```typescript
import ResearchWorkflow from './src/workflows/researchWorkflow.js';

const workflow = new ResearchWorkflow();

const session = await workflow.conductResearch({
  query: "vector databases for AI agents",
  depth: "deep",
  focusAreas: ["implementation", "performance"],
  maxResults: 20
});

console.log(session.insights);
```

### Running Examples

```bash
# Run the enhanced research example
npm run research:example

# Start the main application
npm start
```

### Docker Management

```bash
# Start ChromaDB
npm run chroma:start

# Check ChromaDB status
npm run chroma:status

# View ChromaDB logs
npm run chroma:logs

# Stop ChromaDB
npm run chroma:stop

# Restart ChromaDB
npm run chroma:restart

# Rebuild ChromaDB container
npm run chroma:rebuild

# Clean up ChromaDB resources
npm run chroma:cleanup
```

## 🔧 Configuration

### Vector Database Settings

```typescript
// src/services/vectorDB.ts
const vectorDB = new VectorDatabaseService({
  collectionName: 'research_documents',
  embeddingModel: 'text-embedding-3-small'
});
```

### Retry Configuration

```typescript
// src/services/retryService.ts
await RetryService.withRetry(operation, {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true
});
```

### Rate Limiting

```typescript
// src/services/retryService.ts
await RetryService.withRateLimit(operation, {
  requestsPerMinute: 30,
  requestsPerHour: 1000
});
```

## 📊 Results Structure

### Search Results

```typescript
interface SearchResult {
  realTimeResults: ParsedPage[];      // Current web results
  semanticResults: DocumentChunk[];   // Vector DB results
  fusedResults: FusedResult[];       // Combined results
  metadata: {
    totalRealTimeResults: number;
    totalSemanticResults: number;
    searchTime: number;
    vectorDBCount: number;
  };
}
```

### Fused Results

```typescript
interface FusedResult {
  content: string;
  title: string;
  url: string;
  source: 'real-time' | 'semantic' | 'both';
  relevanceScore: number;
  qualityScore: number;
  metadata: {
    domain: string;
    contentType: string;
    publishDate?: string;
    author?: string;
  };
}
```

## 🧠 How It Works

### 1. **Search Phase**
- SerpAPI provides current search results
- Vector database provides semantic matches
- Both results are processed and scored

### 2. **Content Processing**
- HTML is parsed and cleaned
- Content is chunked with overlap
- Metadata is extracted and enriched

### 3. **Embedding Generation**
- OpenAI embeddings are generated
- Chunks are stored in ChromaDB
- Similarity search is enabled

### 4. **Result Fusion**
- Results are deduplicated
- Scores are combined (relevance + quality)
- Results are ranked and returned

### 5. **Insight Generation**
- Patterns are identified across results
- Trends are detected
- Contradictions are flagged

## 🎛️ Advanced Features

### Content Quality Scoring

The system evaluates content quality based on:
- **Length**: Longer content generally indicates more depth
- **Structure**: Presence of headings, lists, paragraphs
- **Domain Trust**: Known reliable domains get higher scores
- **Content Type**: Documentation > Articles > Social media
- **Language**: English content gets slight preference
- **Author**: Author attribution increases quality

### Smart Chunking

- **Semantic Boundaries**: Splits at sentence boundaries
- **Overlap**: Maintains context between chunks
- **Size Control**: Configurable chunk sizes (default 1000 chars)
- **Quality Filtering**: Skips chunks below minimum quality

### Error Handling

- **Graceful Degradation**: Continues if some sources fail
- **Retry Logic**: Exponential backoff for failed requests
- **Rate Limiting**: Prevents server overload
- **User-Agent Rotation**: Reduces blocking

## 🔍 Monitoring

### Logs
- Search operations are logged with timing
- Errors are captured in `searchTool-errors.log`
- Vector DB operations are logged

### Metrics
- Search response times
- Success/failure rates
- Vector DB document counts
- Content quality distributions

## 🚀 Performance Tips

1. **ChromaDB**: Run locally for best performance
2. **Caching**: Results are cached in vector DB
3. **Rate Limiting**: Adjust based on your needs
4. **Chunking**: Optimize chunk sizes for your use case
5. **Filtering**: Use domain/content type filters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**
   - Ensure ChromaDB is running on port 8000
   - Check Python installation

2. **OpenAI API Errors**
   - Verify API key is set correctly
   - Check rate limits and billing

3. **SerpAPI Errors**
   - Verify API key and credits
   - Check query limits

4. **Web Scraping Blocked**
   - Adjust rate limiting settings
   - Use different User-Agent strings
   - Consider proxy services

### Debug Mode

Enable debug logging:
```typescript
const agent = new Agent({
  // ... other config
  debug: true
});
```

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Custom embedding models
- [ ] Advanced NLP for insights
- [ ] Real-time collaboration
- [ ] Export capabilities
- [ ] API endpoints
- [ ] Web interface
- [ ] Mobile app integration
