import { z } from "zod";
import { log } from "../logger";
import { HfInference } from "@huggingface/inference";
import { RealSynthesizedInsight, RealSourceInfo } from "./real_synthesizer";

// Embedding analysis schemas
export const EmbeddingResultSchema = z.object({
  text: z.string(),
  embedding: z.array(z.number()),
  model: z.string(),
  dimensions: z.number(),
});

export const SimilarityResultSchema = z.object({
  item1_id: z.string(),
  item2_id: z.string(),
  similarity_score: z.number().min(0).max(1),
  distance: z.number(),
  relationship_type: z.enum(["identical", "very_similar", "similar", "related", "different", "contradictory"]),
});

export const ClusterResultSchema = z.object({
  cluster_id: z.string(),
  topic: z.string(),
  items: z.array(z.string()), // item IDs
  centroid: z.array(z.number()),
  coherence_score: z.number().min(0).max(1),
  size: z.number(),
});

export const SemanticAnalysisSchema = z.object({
  total_items: z.number(),
  unique_clusters: z.number(),
  average_similarity: z.number(),
  similarity_distribution: z.object({
    very_high: z.number(), // 0.9+
    high: z.number(),      // 0.7-0.9
    medium: z.number(),    // 0.5-0.7
    low: z.number(),       // 0.3-0.5
    very_low: z.number(),  // <0.3
  }),
  potential_duplicates: z.array(z.string()),
  outliers: z.array(z.string()),
  topic_coherence: z.number().min(0).max(1),
});

export type EmbeddingResult = z.infer<typeof EmbeddingResultSchema>;
export type SimilarityResult = z.infer<typeof SimilarityResultSchema>;
export type ClusterResult = z.infer<typeof ClusterResultSchema>;
export type SemanticAnalysis = z.infer<typeof SemanticAnalysisSchema>;

export class EmbeddingAnalyzer {
  private hf: HfInference;
  private embedding_cache: Map<string, number[]> = new Map();
  private similarity_cache: Map<string, number> = new Map();
  private model: string = "sentence-transformers/all-MiniLM-L6-v2";

  constructor(config?: { 
    huggingface_token?: string; 
    model?: string;
    cache_enabled?: boolean;
  }) {
    this.hf = new HfInference(config?.huggingface_token);
    this.model = config?.model || this.model;

    if (config?.cache_enabled !== false) {
      log.info(`Embedding analyzer initialized with model: ${this.model}`);
    }
  }

  async generate_embedding(text: string): Promise<number[]> {
    // Check cache first
    const cache_key = `${this.model}:${text.slice(0, 100)}`;
    if (this.embedding_cache.has(cache_key)) {
      return this.embedding_cache.get(cache_key)!;
    }

    try {
      // Clean and truncate text for embedding
      const clean_text = this.clean_text_for_embedding(text);
      
      // Generate embedding using Hugging Face
      const response = await this.hf.featureExtraction({
        model: this.model,
        inputs: clean_text,
      });

      // Handle different response formats
      let embedding: number[];
      if (Array.isArray(response[0])) {
        embedding = response[0] as number[];
      } else {
        embedding = response as number[];
      }

      // Cache the result
      this.embedding_cache.set(cache_key, embedding);
      
      log.debug(`Generated embedding for text (${clean_text.length} chars): ${embedding.length} dimensions`);
      return embedding;

    } catch (error) {
      log.error("Embedding generation failed:", error);
      
      // Fallback to simple text-based embedding
      return this.generate_fallback_embedding(text);
    }
  }

  private clean_text_for_embedding(text: string): string {
    // Clean and prepare text for embedding generation
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()\-]/g, '') // Remove special characters
      .trim()
      .slice(0, 512); // Limit length for embedding models
  }

  private generate_fallback_embedding(text: string): number[] {
    // Simple fallback embedding based on text characteristics
    log.warn("Using fallback embedding generation");
    
    const words = text.toLowerCase().split(/\s+/);
    const word_count = words.length;
    const char_count = text.length;
    const unique_words = new Set(words).size;
    
    // Create a simple feature vector
    const features = [
      word_count / 100,
      char_count / 1000,
      unique_words / word_count,
      (text.match(/[.!?]/g) || []).length / word_count, // Sentence density
      (text.match(/[A-Z]/g) || []).length / char_count, // Capitalization ratio
    ];

    // Pad to 384 dimensions (common embedding size)
    while (features.length < 384) {
      features.push(Math.random() * 0.1); // Small random values
    }

    return features;
  }

  async calculate_similarity(embedding1: number[], embedding2: number[]): Promise<number> {
    const cache_key = `sim:${embedding1.slice(0, 3).join(',')}-${embedding2.slice(0, 3).join(',')}`;
    
    if (this.similarity_cache.has(cache_key)) {
      return this.similarity_cache.get(cache_key)!;
    }

    // Cosine similarity calculation
    const similarity = this.cosine_similarity(embedding1, embedding2);
    
    this.similarity_cache.set(cache_key, similarity);
    return similarity;
  }

  private cosine_similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Embedding dimensions must match");
    }

    const dot_product = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const norm_a = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const norm_b = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (norm_a === 0 || norm_b === 0) {
      return 0;
    }

    return dot_product / (norm_a * norm_b);
  }

  async analyze_insight_similarity(insights: RealSynthesizedInsight[]): Promise<SimilarityResult[]> {
    log.info(`Analyzing semantic similarity for ${insights.length} insights`);

    // Generate embeddings for all insights
    const embeddings = await Promise.all(
      insights.map(async (insight) => ({
        id: insight.id,
        text: insight.content,
        embedding: await this.generate_embedding(insight.content),
      }))
    );

    const similarities: SimilarityResult[] = [];

    // Calculate pairwise similarities
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = await this.calculate_similarity(
          embeddings[i].embedding,
          embeddings[j].embedding
        );

        const distance = 1 - similarity;

        similarities.push({
          item1_id: embeddings[i].id,
          item2_id: embeddings[j].id,
          similarity_score: similarity,
          distance,
          relationship_type: this.classify_relationship(similarity),
        });
      }
    }

    log.info(`Calculated ${similarities.length} pairwise similarities`);
    return similarities.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  private classify_relationship(similarity: number): SimilarityResult['relationship_type'] {
    if (similarity >= 0.95) return "identical";
    if (similarity >= 0.8) return "very_similar";
    if (similarity >= 0.6) return "similar";
    if (similarity >= 0.4) return "related";
    if (similarity >= 0.2) return "different";
    return "contradictory";
  }

  async cluster_insights(insights: RealSynthesizedInsight[], num_clusters?: number): Promise<ClusterResult[]> {
    log.info(`Clustering ${insights.length} insights into topics`);

    // Generate embeddings
    const embeddings = await Promise.all(
      insights.map(async (insight) => ({
        id: insight.id,
        text: insight.content,
        embedding: await this.generate_embedding(insight.content),
        insight,
      }))
    );

    // Determine optimal number of clusters if not specified
    const k = num_clusters || Math.min(Math.ceil(insights.length / 3), 8);

    // Perform k-means clustering
    const clusters = this.kmeans_clustering(embeddings, k);

    log.info(`Created ${clusters.length} insight clusters`);
    return clusters;
  }

  private kmeans_clustering(
    embeddings: Array<{ id: string; text: string; embedding: number[]; insight: RealSynthesizedInsight }>,
    k: number
  ): ClusterResult[] {
    const dimensions = embeddings[0].embedding.length;
    
    // Initialize centroids randomly
    let centroids = Array.from({ length: k }, () => 
      Array.from({ length: dimensions }, () => Math.random() * 2 - 1)
    );

    let assignments: number[] = new Array(embeddings.length).fill(0);
    let converged = false;
    let iterations = 0;
    const max_iterations = 50;

    // K-means iterations
    while (!converged && iterations < max_iterations) {
      const new_assignments: number[] = [];

      // Assign each point to nearest centroid
      for (const embedding of embeddings) {
        let best_cluster = 0;
        let best_distance = Infinity;

        for (let c = 0; c < k; c++) {
          const distance = this.euclidean_distance(embedding.embedding, centroids[c]);
          if (distance < best_distance) {
            best_distance = distance;
            best_cluster = c;
          }
        }

        new_assignments.push(best_cluster);
      }

      // Check for convergence
      converged = new_assignments.every((assignment, i) => assignment === assignments[i]);
      assignments = new_assignments;

      // Update centroids
      if (!converged) {
        for (let c = 0; c < k; c++) {
          const cluster_points = embeddings.filter((_, i) => assignments[i] === c);
          
          if (cluster_points.length > 0) {
            for (let d = 0; d < dimensions; d++) {
              centroids[c][d] = cluster_points.reduce((sum, point) => sum + point.embedding[d], 0) / cluster_points.length;
            }
          }
        }
      }

      iterations++;
    }

    // Create cluster results
    const clusters: ClusterResult[] = [];
    
    for (let c = 0; c < k; c++) {
      const cluster_items = embeddings.filter((_, i) => assignments[i] === c);
      
      if (cluster_items.length > 0) {
        const topic = this.generate_cluster_topic(cluster_items.map(item => item.insight));
        const coherence = this.calculate_cluster_coherence(cluster_items);

        clusters.push({
          cluster_id: `cluster_${c}`,
          topic,
          items: cluster_items.map(item => item.id),
          centroid: centroids[c],
          coherence_score: coherence,
          size: cluster_items.length,
        });
      }
    }

    return clusters.sort((a, b) => b.coherence_score - a.coherence_score);
  }

  private euclidean_distance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  private generate_cluster_topic(insights: RealSynthesizedInsight[]): string {
    // Extract common themes from cluster insights
    const all_words = insights.flatMap(insight => 
      insight.content.toLowerCase().split(/\s+/).filter(word => 
        word.length > 3 && !this.is_stop_word(word)
      )
    );

    // Count word frequencies
    const word_counts = all_words.reduce((counts, word) => {
      counts[word] = (counts[word] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Get most frequent meaningful words
    const top_words = Object.entries(word_counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);

    return top_words.join(' ') || 'general topic';
  }

  private calculate_cluster_coherence(cluster_items: Array<{ embedding: number[] }>): number {
    if (cluster_items.length <= 1) return 1.0;

    const embeddings = cluster_items.map(item => item.embedding);
    let total_similarity = 0;
    let comparisons = 0;

    // Calculate average pairwise similarity within cluster
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        total_similarity += this.cosine_similarity(embeddings[i], embeddings[j]);
        comparisons++;
      }
    }

    return comparisons > 0 ? total_similarity / comparisons : 0;
  }

  private is_stop_word(word: string): boolean {
    const stop_words = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those',
      'a', 'an', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'must', 'shall', 'ought'
    ]);
    return stop_words.has(word.toLowerCase());
  }

  async detect_duplicate_insights(insights: RealSynthesizedInsight[], threshold: number = 0.9): Promise<Array<{ insight1: string; insight2: string; similarity: number }>> {
    const similarities = await this.analyze_insight_similarity(insights);
    
    return similarities
      .filter(sim => sim.similarity_score >= threshold)
      .map(sim => ({
        insight1: sim.item1_id,
        insight2: sim.item2_id,
        similarity: sim.similarity_score,
      }));
  }

  async find_contradictory_insights(insights: RealSynthesizedInsight[]): Promise<SimilarityResult[]> {
    const similarities = await this.analyze_insight_similarity(insights);
    
    // Look for insights with high semantic similarity but contradictory content
    const potential_contradictions = similarities.filter(sim => {
      // High semantic similarity but different conclusions
      return sim.similarity_score > 0.6 && this.has_contradictory_sentiment(
        insights.find(i => i.id === sim.item1_id)?.content || '',
        insights.find(i => i.id === sim.item2_id)?.content || ''
      );
    });

    return potential_contradictions;
  }

  private has_contradictory_sentiment(text1: string, text2: string): boolean {
    const positive_indicators = ['positive', 'good', 'beneficial', 'improved', 'increased', 'better', 'effective'];
    const negative_indicators = ['negative', 'bad', 'harmful', 'decreased', 'worse', 'ineffective', 'poor'];

    const text1_lower = text1.toLowerCase();
    const text2_lower = text2.toLowerCase();

    const text1_positive = positive_indicators.some(indicator => text1_lower.includes(indicator));
    const text1_negative = negative_indicators.some(indicator => text1_lower.includes(indicator));
    
    const text2_positive = positive_indicators.some(indicator => text2_lower.includes(indicator));
    const text2_negative = negative_indicators.some(indicator => text2_lower.includes(indicator));

    // Contradictory if one is clearly positive and other is clearly negative
    return (text1_positive && text2_negative) || (text1_negative && text2_positive);
  }

  async analyze_source_topic_coverage(sources: RealSourceInfo[], insights: RealSynthesizedInsight[]): Promise<any> {
    log.info("Analyzing topic coverage across sources");

    // Generate embeddings for source titles and insight content
    const source_embeddings = await Promise.all(
      sources.map(async (source) => ({
        id: source.id,
        title: source.title,
        embedding: await this.generate_embedding(source.title),
        authority: source.authority_score,
      }))
    );

    const insight_embeddings = await Promise.all(
      insights.map(async (insight) => ({
        id: insight.id,
        content: insight.content,
        embedding: await this.generate_embedding(insight.content),
        confidence: insight.confidence_score,
      }))
    );

    // Find which sources are most relevant to which insights
    const source_insight_mapping = await this.map_sources_to_insights(
      source_embeddings,
      insight_embeddings
    );

    // Identify topic gaps
    const topic_gaps = this.identify_topic_gaps(source_embeddings, insight_embeddings);

    return {
      source_count: sources.length,
      insight_count: insights.length,
      topic_coverage: source_insight_mapping,
      coverage_gaps: topic_gaps,
      average_source_insight_similarity: this.calculate_average_mapping_similarity(source_insight_mapping),
    };
  }

  private async map_sources_to_insights(
    source_embeddings: Array<{ id: string; embedding: number[]; authority: number }>,
    insight_embeddings: Array<{ id: string; embedding: number[]; confidence: number }>
  ): Promise<Array<{ source_id: string; insight_id: string; similarity: number; relevance_score: number }>> {
    const mappings: Array<{ source_id: string; insight_id: string; similarity: number; relevance_score: number }> = [];

    for (const source of source_embeddings) {
      for (const insight of insight_embeddings) {
        const similarity = await this.calculate_similarity(source.embedding, insight.embedding);
        
        // Calculate relevance score combining similarity, authority, and confidence
        const relevance_score = (similarity * 0.5) + (source.authority / 10 * 0.3) + (insight.confidence * 0.2);

        if (similarity > 0.3) { // Only include meaningful relationships
          mappings.push({
            source_id: source.id,
            insight_id: insight.id,
            similarity,
            relevance_score,
          });
        }
      }
    }

    return mappings.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  private identify_topic_gaps(
    source_embeddings: Array<{ id: string; embedding: number[] }>,
    insight_embeddings: Array<{ id: string; embedding: number[] }>
  ): string[] {
    const gaps: string[] = [];

    // Find insights that are not well-covered by sources
    const poorly_covered_insights = insight_embeddings.filter(insight => {
      const max_similarity = Math.max(...source_embeddings.map(source => 
        this.cosine_similarity(source.embedding, insight.embedding)
      ));
      return max_similarity < 0.5; // Low similarity to all sources
    });

    if (poorly_covered_insights.length > 0) {
      gaps.push(`${poorly_covered_insights.length} insights lack strong source support`);
    }

    // Find source topics not reflected in insights
    const underutilized_sources = source_embeddings.filter(source => {
      const max_similarity = Math.max(...insight_embeddings.map(insight => 
        this.cosine_similarity(source.embedding, insight.embedding)
      ));
      return max_similarity < 0.4; // Source content not well reflected in insights
    });

    if (underutilized_sources.length > 0) {
      gaps.push(`${underutilized_sources.length} sources contain unutilized information`);
    }

    return gaps;
  }

  private calculate_average_mapping_similarity(mappings: Array<{ similarity: number }>): number {
    if (mappings.length === 0) return 0;
    return mappings.reduce((sum, mapping) => sum + mapping.similarity, 0) / mappings.length;
  }

  async generate_semantic_analysis(insights: RealSynthesizedInsight[]): Promise<SemanticAnalysis> {
    log.info("Generating comprehensive semantic analysis");

    const similarities = await this.analyze_insight_similarity(insights);
    const clusters = await this.cluster_insights(insights);

    // Calculate similarity distribution
    const similarity_distribution = {
      very_high: similarities.filter(s => s.similarity_score >= 0.9).length,
      high: similarities.filter(s => s.similarity_score >= 0.7 && s.similarity_score < 0.9).length,
      medium: similarities.filter(s => s.similarity_score >= 0.5 && s.similarity_score < 0.7).length,
      low: similarities.filter(s => s.similarity_score >= 0.3 && s.similarity_score < 0.5).length,
      very_low: similarities.filter(s => s.similarity_score < 0.3).length,
    };

    // Identify potential duplicates (very high similarity)
    const potential_duplicates = similarities
      .filter(s => s.similarity_score >= 0.95)
      .map(s => `${s.item1_id} ↔ ${s.item2_id}`);

    // Identify outliers (insights with low similarity to all others)
    const outliers = insights
      .filter(insight => {
        const max_similarity = Math.max(...similarities
          .filter(s => s.item1_id === insight.id || s.item2_id === insight.id)
          .map(s => s.similarity_score)
        );
        return max_similarity < 0.3;
      })
      .map(insight => insight.id);

    // Calculate overall topic coherence
    const topic_coherence = clusters.length > 0 
      ? clusters.reduce((sum, cluster) => sum + cluster.coherence_score, 0) / clusters.length
      : 0;

    // Calculate average similarity
    const average_similarity = similarities.length > 0
      ? similarities.reduce((sum, sim) => sum + sim.similarity_score, 0) / similarities.length
      : 0;

    return {
      total_items: insights.length,
      unique_clusters: clusters.length,
      average_similarity,
      similarity_distribution,
      potential_duplicates,
      outliers,
      topic_coherence,
    };
  }

  // Utility methods
  get_cache_stats(): { embedding_cache_size: number; similarity_cache_size: number; hit_ratio: number } {
    return {
      embedding_cache_size: this.embedding_cache.size,
      similarity_cache_size: this.similarity_cache.size,
      hit_ratio: this.embedding_cache.size / Math.max(1, this.embedding_cache.size + this.similarity_cache.size),
    };
  }

  clear_cache(): void {
    this.embedding_cache.clear();
    this.similarity_cache.clear();
    log.info("Embedding cache cleared");
  }

  async export_embeddings(insights: RealSynthesizedInsight[]): Promise<EmbeddingResult[]> {
    const embeddings: EmbeddingResult[] = [];

    for (const insight of insights) {
      const embedding = await this.generate_embedding(insight.content);
      embeddings.push({
        text: insight.content,
        embedding,
        model: this.model,
        dimensions: embedding.length,
      });
    }

    return embeddings;
  }
}