# Deep Research Agent Documentation

## Overview

The Deep Research Agent is an industry-standard AI-powered research system that conducts comprehensive, multi-stage research on any topic. It follows academic research methodologies and produces detailed, citation-backed reports.

## Features

### 1. Multi-Stage Research Pipeline
- **Query Planning**: Breaks down complex queries into focused sub-questions
- **Information Gathering**: Systematic web search across multiple sources
- **Fact Verification**: Cross-references claims across sources
- **Synthesis**: Combines findings into coherent insights
- **Report Generation**: Produces professional research reports

### 2. Advanced Capabilities
- **Source Credibility Assessment**: Evaluates reliability of sources
- **Document Analysis**: Summarizes and extracts key information
- **Entity Recognition**: Identifies people, organizations, locations
- **Sentiment Analysis**: Determines tone and bias
- **Citation Management**: Proper academic citations

### 3. Flexible Output Formats
- Markdown reports (human-readable)
- JSON (machine-readable)
- HTML (web presentation)

## Architecture

```
ResearchAgent
├── Query Planning Stage
│   ├── Query decomposition
│   ├── Search strategy formulation
│   └── Context analysis
├── Information Gathering Stage
│   ├── Web search (multiple queries)
│   ├── Content extraction
│   └── Document analysis
├── Fact Verification Stage
│   ├── Cross-reference checking
│   ├── Source credibility scoring
│   └── Evidence compilation
├── Synthesis Stage
│   ├── Pattern identification
│   ├── Theme extraction
│   └── Insight generation
└── Report Generation Stage
    ├── Structured formatting
    ├── Citation compilation
    └── Multi-format export
```

## Usage

### Basic Usage

```typescript
import { ResearchAgent } from "./app/agent/research";
import { Memory } from "./schema";
import { LLM } from "./app/llm";

// Initialize the agent
const agent = new ResearchAgent({
  name: "researcher",
  llm: LLM.getInstance("default"),
  memory: new Memory(),
  max_steps: 50
});

// Run research
const report = await agent.run("Your research question here");
console.log(report);
```

### Advanced Configuration

```typescript
const agent = new ResearchAgent({
  name: "advanced_researcher",
  llm: LLM.getInstance("gpt-4"), // Use more capable model
  memory: new Memory(),
  max_steps: 100, // Allow more steps for deeper research
  system_prompt: customPrompt // Optional custom system prompt
});

// Get different output formats
const markdownReport = await agent.run(query);
const jsonReport = agent.getJSONReport();
const htmlReport = agent.getHTMLReport();
```

## Tools

### 1. WebSearch
Searches the web for relevant information.

```typescript
{
  query: string,           // Search query
  max_results: number,     // Max results (default: 10)
  search_type: string      // "general", "news", "academic", "recent"
}
```

### 2. WebScraper
Extracts content from web pages.

```typescript
{
  url: string,             // URL to scrape
  extract_type: string,    // "text", "structured", "markdown"
  selectors: object        // Optional CSS selectors
}
```

### 3. FactVerifier
Verifies factual claims across sources.

```typescript
{
  statement: string,       // Fact to verify
  sources: string[],       // Source URLs
  context: string          // Optional context
}
```

### 4. DocumentAnalyzer
Analyzes and summarizes documents.

```typescript
{
  content: string,         // Document content
  analysis_type: string,   // "summary", "key_points", "entities", etc.
  max_length: number,      // Max summary length
  focus_areas: string[]    // Optional focus areas
}
```

## Report Structure

### Generated Report Includes:

1. **Executive Summary**: High-level overview of findings
2. **Introduction**: Research context and objectives
3. **Methodology**: How the research was conducted
4. **Key Findings**: Main discoveries with evidence
5. **Analysis**: Interpretation of findings
6. **Limitations**: Constraints and caveats
7. **Conclusions**: Summary and implications
8. **Recommendations**: Actionable insights (optional)
9. **References**: Full citation list
10. **Appendices**: Additional information

## Best Practices

### 1. Query Formulation
- Be specific and focused
- Include context when relevant
- Specify desired depth of research

### 2. Source Evaluation
- Agent automatically assesses credibility
- Prioritizes authoritative sources
- Cross-references claims

### 3. Result Interpretation
- Review confidence scores
- Check verification status
- Consider limitations section

## Integration Examples

### Web API Integration

```typescript
app.post('/research', async (req, res) => {
  const { query, depth = 'medium' } = req.body;
  
  const agent = new ResearchAgent({
    name: "api_researcher",
    llm: LLM.getInstance("default"),
    memory: new Memory()
  });
  
  const report = await agent.run(query);
  const jsonReport = agent.getJSONReport();
  
  res.json({
    success: true,
    report: JSON.parse(jsonReport)
  });
});
```

### Batch Processing

```typescript
async function batchResearch(queries: string[]) {
  const results = [];
  
  for (const query of queries) {
    const agent = new ResearchAgent({
      name: `researcher_${Date.now()}`,
      llm: LLM.getInstance("default"),
      memory: new Memory()
    });
    
    const report = await agent.run(query);
    results.push({
      query,
      report: agent.getJSONReport()
    });
  }
  
  return results;
}
```

## Customization

### Custom Tools

Add domain-specific tools:

```typescript
class ArxivSearch extends BaseTool {
  name = "arxiv_search";
  description = "Search academic papers on arXiv";
  
  async execute(input: any) {
    // Implementation
  }
}

// Add to agent
agent.available_tools.add_tool(new ArxivSearch());
```

### Custom Prompts

Customize behavior with specific prompts:

```typescript
const customSystemPrompt = `
You are a medical research specialist. 
Focus on peer-reviewed sources and clinical trials.
Always note statistical significance and sample sizes.
`;

const agent = new ResearchAgent({
  system_prompt: customSystemPrompt,
  // ... other config
});
```

## Performance Considerations

1. **API Rate Limits**: Implement throttling for web searches
2. **Caching**: Cache search results and scraped content
3. **Parallel Processing**: Tools can be executed in parallel
4. **Token Limits**: Monitor LLM token usage

## Error Handling

The agent includes robust error handling:

```typescript
try {
  const report = await agent.run(query);
} catch (error) {
  if (error.message.includes('Token limit')) {
    // Handle token limit exceeded
  } else if (error.message.includes('Search failed')) {
    // Handle search API errors
  }
  // Generic error handling
}
```

## Future Enhancements

1. **Real API Integration**: Connect to actual search APIs (Google, Bing, etc.)
2. **Academic Sources**: Integration with PubMed, arXiv, Google Scholar
3. **Multi-language Support**: Research in multiple languages
4. **Real-time Updates**: Monitor topics for new information
5. **Collaborative Research**: Multiple agents working together
6. **Knowledge Graph**: Build connections between findings

## License

This research agent is part of the larger agent framework and follows the same licensing terms.