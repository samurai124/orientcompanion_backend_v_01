/**
 * Compute the cosine similarity between two numeric vectors.
 * Returns a value in [-1, 1], or 0 if vectors are empty or have zero norm.
 * 
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number}
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    return 0;
  }
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp between -1 and 1 to prevent floating-point inaccuracies
  return Math.max(-1, Math.min(1, similarity));
};

/**
 * Normalizes a cosine similarity (-1 to 1) into a 0 to 100 score.
 * Formula: ((cosineSimilarity + 1) / 2) * 100
 * 
 * @param {number} similarity - Cosine similarity between -1 and 1
 * @returns {number} - Normalized score between 0 and 100
 */
export const normalizeVectorScore = (similarity) => {
  return ((similarity + 1) / 2) * 100;
};
