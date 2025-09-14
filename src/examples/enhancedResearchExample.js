// src/examples/enhancedResearchExample.ts
import ResearchWorkflow from '../workflows/researchWorkflow.js';
async function demonstrateEnhancedResearch() {
    console.log('🚀 Starting Enhanced Research Workflow Demo\n');
    const researchWorkflow = new ResearchWorkflow();
    // Example research query
    const query = {
        query: "AI agents research workflow vector databases",
        depth: "medium",
        focusAreas: ["implementation", "best practices", "performance"],
        maxResults: 15
    };
    try {
        console.log(`📋 Research Query: ${query.query}`);
        console.log(`🔍 Depth: ${query.depth}`);
        console.log(`🎯 Focus Areas: ${query.focusAreas?.join(', ')}\n`);
        // Conduct the research
        const session = await researchWorkflow.conductResearch(query);
        // Display results
        console.log('📊 Research Session Results:');
        console.log(`Session ID: ${session.id}`);
        console.log(`Total Search Time: ${session.metadata.totalSearchTime}ms`);
        console.log(`Total Results: ${session.metadata.totalResults}`);
        console.log(`Vector DB Documents: ${session.metadata.vectorDBCount}\n`);
        // Display fused results
        console.log('🔗 Fused Results (Top 5):');
        session.results[0].fusedResults.slice(0, 5).forEach((result, index) => {
            console.log(`${index + 1}. ${result.title}`);
            console.log(`   URL: ${result.url}`);
            console.log(`   Source: ${result.source}`);
            console.log(`   Quality Score: ${result.qualityScore.toFixed(2)}`);
            console.log(`   Relevance Score: ${result.relevanceScore.toFixed(2)}`);
            console.log(`   Content Preview: ${result.content.substring(0, 100)}...\n`);
        });
        // Display insights
        console.log('💡 Generated Insights:');
        session.insights.forEach((insight, index) => {
            console.log(`${index + 1}. [${insight.type.toUpperCase()}] ${insight.content}`);
            console.log(`   Confidence: ${insight.confidence}`);
            console.log(`   Tags: ${insight.tags.join(', ')}\n`);
        });
        // Display metadata
        console.log('📈 Search Metadata:');
        session.results.forEach((result, index) => {
            console.log(`Search ${index + 1}:`);
            console.log(`  Real-time Results: ${result.metadata.totalRealTimeResults}`);
            console.log(`  Semantic Results: ${result.metadata.totalSemanticResults}`);
            console.log(`  Search Time: ${result.metadata.searchTime}ms\n`);
        });
    }
    catch (error) {
        console.error('❌ Research failed:', error);
    }
}
// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
    demonstrateEnhancedResearch()
        .then(() => {
        console.log('✅ Demo completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    });
}
export { demonstrateEnhancedResearch };
