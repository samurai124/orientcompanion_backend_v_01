import prisma from '../../config/prisma.js';
import llmClient from '../../utils/llmClient.js';
import { notFound, badRequest } from '../../utils/errors.js';

export const RIASEC_QUESTIONS = [
  // Realistic (R) - 1 to 5
  { id: 1, dimension: 'R', text: "J'aime réparer des appareils électroniques, mécaniques ou fabriquer des objets." },
  { id: 2, dimension: 'R', text: "Je préfère travailler avec des outils, des machines ou en plein air plutôt que dans un bureau." },
  { id: 3, dimension: 'R', text: "J'ai de la facilité à comprendre le fonctionnement des systèmes techniques." },
  { id: 4, dimension: 'R', text: "Les travaux manuels et concrets me procurent une grande satisfaction." },
  { id: 5, dimension: 'R', text: "J'aimerais concevoir des prototypes ou faire des installations de réseaux physiques." },

  // Investigative (I) - 6 to 10
  { id: 6, dimension: 'I', text: "J'aime résoudre des problèmes mathématiques ou algorithmiques complexes." },
  { id: 7, dimension: 'I', text: "La recherche scientifique, l'analyse de données et les expériences me passionnent." },
  { id: 8, dimension: 'I', text: "J'aime comprendre en profondeur le 'pourquoi' et le 'comment' des phénomènes naturels." },
  { id: 9, dimension: 'I', text: "Je prends plaisir à lire des revues scientifiques ou technologiques." },
  { id: 10, dimension: 'I', text: "Face à une énigme, je préfère analyser les faits de manière méthodique et logique." },

  // Artistic (A) - 11 to 15
  { id: 11, dimension: 'A', text: "J'aime m'exprimer à travers le design, le dessin, l'écriture ou la musique." },
  { id: 12, dimension: 'A', text: "Je préfère les environnements où la créativité et l'originalité sont valorisées." },
  { id: 13, dimension: 'A', text: "J'apprécie concevoir des interfaces visuelles, des affiches ou des univers virtuels." },
  { id: 14, dimension: 'A', text: "Je suis souvent attiré(e) par les approches non conventionnelles et intuitives." },
  { id: 15, dimension: 'A', text: "L'harmonie esthétique et l'émotion sont importantes dans ce que j'entreprends." },

  // Social (S) - 16 to 20
  { id: 16, dimension: 'S', text: "J'aime aider les autres à résoudre leurs difficultés personnelles ou scolaires." },
  { id: 17, dimension: 'S', text: "Travailler en équipe et animer des groupes me motive profondément." },
  { id: 18, dimension: 'S', text: "Je suis à l'écoute des besoins et du bien-être des gens autour de moi." },
  { id: 19, dimension: 'S', text: "Les métiers de la santé, de l'éducation ou du conseil m'attirent." },
  { id: 20, dimension: 'S', text: "Je communique facilement et j'aime partager mes connaissances." },

  // Enterprising (E) - 21 to 25
  { id: 21, dimension: 'E', text: "J'ai l'esprit d'initiative et j'aime diriger des projets ou lancer des activités." },
  { id: 22, dimension: 'E', text: "La négociation, la persuasion et les défis commerciaux me stimulent." },
  { id: 23, dimension: 'E', text: "J'aimerais créer ma propre entreprise ou occuper un poste de manager." },
  { id: 24, dimension: 'E', text: "J'aime convaincre les autres et défendre mes idées avec assurance." },
  { id: 25, dimension: 'E', text: "Prendre des décisions et assumer des responsabilités ne me fait pas peur." },

  // Conventional (C) - 26 to 30
  { id: 26, dimension: 'C', text: "J'aime l'ordre, la précision et le travail bien structuré." },
  { id: 27, dimension: 'C', text: "Je suis rigoureux(se) dans la gestion des données, des chiffres et des documents." },
  { id: 28, dimension: 'C', text: "Je préfère respecter des consignes claires et des méthodes éprouvées." },
  { id: 29, dimension: 'C', text: "J'ai le sens du détail et je vérifie systématiquement mon travail." },
  { id: 30, dimension: 'C', text: "Organiser des plannings, des budgets ou des tableaux Excel m'est naturel." }
];

class AssessmentService {
  /**
   * Get the questionnaire list.
   */
  getQuestionnaire() {
    return {
      title: 'Questionnaire d’Orientation Holland RIASEC',
      description: 'Évaluez chaque affirmation de 1 (Pas du tout d’accord) à 5 (Tout à fait d’accord).',
      scale: {
        min: 1,
        max: 5,
        labels: {
          1: 'Pas du tout d’accord',
          2: 'Plutôt pas d’accord',
          3: 'Neutre / Indifférent',
          4: 'Plutôt d’accord',
          5: 'Tout à fait d’accord'
        }
      },
      questions: RIASEC_QUESTIONS
    };
  }

  /**
   * Process questionnaire submission, compute RIASEC scores (0-100), and update student.
   */
  async submitAssessment(userId, answers) {
    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      throw notFound('Student profile not found');
    }

    // Map answers by questionId
    const answerMap = new Map();
    for (const a of answers) {
      answerMap.set(a.questionId, a.score);
    }

    // Sum scores per dimension
    const dimensionSums = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const dimensionCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    for (const q of RIASEC_QUESTIONS) {
      const score = answerMap.get(q.id);
      if (score === undefined) {
        throw badRequest(`Missing answer for question #${q.id}`);
      }
      dimensionSums[q.dimension] += score;
      dimensionCounts[q.dimension] += 1;
    }

    // Calculate normalized 0 to 100 score for each dimension:
    // Min possible sum = 5 * 1 = 5, Max possible sum = 5 * 5 = 25
    const riasecScores = {};
    for (const dim of ['R', 'I', 'A', 'S', 'E', 'C']) {
      const sum = dimensionSums[dim];
      const normalized = Math.round(((sum - 5) / (25 - 5)) * 100);
      riasecScores[dim] = Math.max(0, Math.min(100, normalized));
    }

    // Generate student embedding based on RIASEC profile and student metadata
    const embeddingInput = {
      riasecScores,
      bacTrack: student.bacTrack,
      stage: student.stage,
      preferences: student.preferences
    };
    const embedding = await llmClient.generateEmbedding(embeddingInput);

    // Save riasecScores and embedding on the student
    const updatedStudent = await prisma.student.update({
      where: { id: student.id },
      data: {
        riasecScores,
        embedding
      }
    });

    return {
      studentId: updatedStudent.id,
      riasecScores,
      primaryProfile: Object.entries(riasecScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([dim]) => dim)
        .join('-')
    };
  }
}

export default new AssessmentService();
