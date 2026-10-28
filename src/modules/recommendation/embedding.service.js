import llmClient from '../../utils/llmClient.js';

class EmbeddingService {
  /**
   * Compute embedding vector for student profile.
   */
  async computeStudentEmbedding(student) {
    const context = {
      bacTrack: student.bacTrack || '',
      stage: student.stage || '',
      riasecScores: student.riasecScores || {},
      preferences: student.preferences || {}
    };

    return llmClient.generateEmbedding(context);
  }

  /**
   * Compute embedding vector for a filière.
   */
  async computeFiliereEmbedding(filiere) {
    const context = {
      name: filiere.name,
      description: filiere.description || '',
      tags: filiere.tags || [],
      requiredBacTracks: filiere.requiredBacTracks || [],
      riasecProfile: filiere.riasecProfile || {}
    };

    return llmClient.generateEmbedding(context);
  }
}

export default new EmbeddingService();
