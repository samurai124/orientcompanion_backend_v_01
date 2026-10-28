import llmClient from '../../utils/llmClient.js';

class LlmExplanationService {
  /**
   * Generates a French natural-language explanation strictly from computed numeric values.
   */
  async generateExplanation({
    filiereName,
    schoolName,
    finalScore,
    structuredScore,
    vectorScore,
    riasecMatch,
    academicScore,
    rank
  }) {
    const templateExplanation = (
      `Cette formation à ${schoolName} correspond à votre profil avec un score global de ${finalScore}/100 ` +
      `(Rang #${rank}). Vos affinités méthodologiques (RIASEC) affichent une adéquation de ${riasecMatch}%, ` +
      `avec un score académique pondéré de ${academicScore}/100 et une concordance sémantique vectorielle de ${vectorScore}/100. ` +
      `Ce parcours capitalise efficacement sur vos points forts au Baccalauréat.`
    );

    const prompt = `
Tu es un conseiller d'orientation universitaire marocain expert et bienveillant.
Rédige en français un paragraphe d'explication d'orientation personnalisé pour l'élève à partir STRICTEMENT des données chiffrées calculées ci-dessous :

- Filière : ${filiereName}
- Établissement : ${schoolName}
- Rang de recommandation : #${rank}
- Score Final Global : ${finalScore}/100
- Score Structuré : ${structuredScore}/100
- Affinité Personnalité/RIASEC : ${riasecMatch}/100
- Score Académique Pondéré : ${academicScore}/100
- Score Vectoriel Sémantique : ${vectorScore}/100

Consignes :
1. N'invente aucun chiffre et ne recalcule rien.
2. Explique pourquoi cette filière convient à l'élève en mentionnant les atouts académiques et le profil RIASEC.
3. Rédige 2 à 3 phrases fluides, encourageantes et professionnelles en français.
`.trim();

    return llmClient.generateText(prompt, templateExplanation);
  }
}

export default new LlmExplanationService();
