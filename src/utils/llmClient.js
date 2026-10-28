import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

class LlmClient {
  constructor() {
    this.apiKey = env.GEMINI_API_KEY;
    this.provider = env.EMBEDDING_PROVIDER;
    this.ai = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  /**
   * Generate text using Gemini with strict fallback.
   * Design rule: LLM is ONLY used for natural-language explanations in French.
   */
  async generateText(prompt, fallbackText = '') {
    if (!this.ai || this.provider === 'fake') {
      return fallbackText;
    }

    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text || fallbackText;
    } catch (error) {
      console.warn('⚠️ LLM API call failed, using template explanation:', error.message);
      return fallbackText;
    }
  }

  /**
   * Deterministic fake embedding generator for local offline development & tests.
   */
  generateFakeEmbedding(input) {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    const vector = [];
    let sumSq = 0;
    for (let i = 0; i < 16; i++) {
      const val = Math.sin(hash + i * 1.618);
      vector.push(val);
      sumSq += val * val;
    }
    const norm = Math.sqrt(sumSq) || 1;
    return vector.map(v => Number((v / norm).toFixed(6)));
  }

  /**
   * Generate embedding vector.
   */
  async generateEmbedding(input) {
    if (!this.ai || this.provider === 'fake') {
      return this.generateFakeEmbedding(input);
    }

    try {
      const text = typeof input === 'string' ? input : JSON.stringify(input);
      const model = this.ai.getGenerativeModel({ model: 'gemini-embedding-001' });
      const result = await model.embedContent(text);
      return result.embedding.values.slice(0, 16); // Standardize to 16 dims for fast vector math
    } catch (error) {
      console.warn('⚠️ Embedding API call failed, using deterministic fallback:', error.message);
      return this.generateFakeEmbedding(input);
    }
  }
}

export default new LlmClient();
