// Export all research tools
export { WebSearch } from './web_search';
export { WebScraper } from './web_scraper';
export { FactVerifier } from './fact_verifier';
export { DocumentAnalyzer } from './document_analyzer';

// Research tool collection
import { ToolCollection } from '../tool_collection';
import { WebSearch } from './web_search';
import { WebScraper } from './web_scraper';
import { FactVerifier } from './fact_verifier';
import { DocumentAnalyzer } from './document_analyzer';

export function createResearchToolCollection(): ToolCollection {
  return new ToolCollection([
    new WebSearch(),
    new WebScraper(),
    new FactVerifier(),
    new DocumentAnalyzer()
  ]);
}