import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper to generate deterministic normalized 16-dimensional vector
function generateDeterministicEmbedding(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
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

async function main() {
  console.log('🌱 Starting OrientCompanion database seed...');

  // Clean existing data in reverse order of dependencies
  await prisma.chatMessage.deleteMany();
  await prisma.studyTask.deleteMany();
  await prisma.studyPlan.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.mockExam.deleteMany();
  await prisma.question.deleteMany();
  await prisma.concours.deleteMany();
  await prisma.mentorshipSession.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.studentChecklistItem.deleteMany();
  await prisma.studentApplication.deleteMany();
  await prisma.gradeGoal.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.studentGrade.deleteMany();
  await prisma.admissionRequirement.deleteMany();
  await prisma.historicalCutoff.deleteMany();
  await prisma.requiredDocument.deleteMany();
  await prisma.applicationProcess.deleteMany();
  await prisma.filiere.deleteMany();
  await prisma.school.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.student.deleteMany();
  await prisma.counselor.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Database cleaned.');

  // 1. Seed Plans
  const freePlan = await prisma.plan.create({
    data: {
      code: 'FREE',
      name: 'Formule Découverte (Gratuit)',
      priceMad: 0,
      durationDays: 365
    }
  });

  const premiumPlan = await prisma.plan.create({
    data: {
      code: 'PREMIUM',
      name: 'Concours Companion Premium',
      priceMad: 199,
      durationDays: 90
    }
  });

  console.log('✅ Subscription plans seeded.');

  // 2. Seed Users
  const passwordAdmin = await bcrypt.hash('Admin123!', 10);
  const passwordCounselor = await bcrypt.hash('Counselor123!', 10);
  const passwordStudent = await bcrypt.hash('Student123!', 10);

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@orientcompanion.ma',
      passwordHash: passwordAdmin,
      firstName: 'Directeur',
      lastName: 'Orientation',
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  // 2 Counselors
  const counselor1User = await prisma.user.create({
    data: {
      email: 'counselor1@orientcompanion.ma',
      passwordHash: passwordCounselor,
      firstName: 'Fatima-Zahra',
      lastName: 'Amrani',
      role: 'COUNSELOR',
      status: 'ACTIVE'
    }
  });

  const counselor1 = await prisma.counselor.create({
    data: {
      userId: counselor1User.id,
      specialties: ['Ingénierie', 'CPGE', 'Grandes Écoles Scientifiques'],
      bio: 'Conseillère d’orientation certifiée avec 10 ans d’expérience dans les parcours post-bac scientifiques au Maroc.'
    }
  });

  // Availability slots for Counselor 1 (Monday & Wednesday)
  await prisma.availabilitySlot.createMany({
    data: [
      { counselorId: counselor1.id, dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      { counselorId: counselor1.id, dayOfWeek: 3, startTime: '14:00', endTime: '17:00' }
    ]
  });

  const counselor2User = await prisma.user.create({
    data: {
      email: 'counselor2@orientcompanion.ma',
      passwordHash: passwordCounselor,
      firstName: 'Youssef',
      lastName: 'Chraibi',
      role: 'COUNSELOR',
      status: 'ACTIVE'
    }
  });

  const counselor2 = await prisma.counselor.create({
    data: {
      userId: counselor2User.id,
      specialties: ['Commerce', 'Management', 'Études Médicales'],
      bio: 'Spécialiste de l’orientation en gestion, commerce international et filières de santé.'
    }
  });

  await prisma.availabilitySlot.createMany({
    data: [
      { counselorId: counselor2.id, dayOfWeek: 2, startTime: '10:00', endTime: '13:00' },
      { counselorId: counselor2.id, dayOfWeek: 4, startTime: '15:00', endTime: '18:00' }
    ]
  });

  // 3 Students
  // Student 1: Pre-Bac SM_A with good grades
  const student1User = await prisma.user.create({
    data: {
      email: 'student1@orientcompanion.ma',
      passwordHash: passwordStudent,
      firstName: 'Hamza',
      lastName: 'Bennani',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const student1 = await prisma.student.create({
    data: {
      userId: student1User.id,
      bacTrack: 'SM_A',
      bacYear: 2024,
      region: 'Casablanca-Settat',
      stage: 'PRE_BAC',
      preferences: {
        preferredCities: ['Casablanca', 'Rabat'],
        interests: ['Intelligence Artificielle', 'Mathématiques', 'Génie Logiciel']
      },
      riasecScores: { R: 45, I: 90, A: 35, S: 50, E: 65, C: 75 },
      embedding: generateDeterministicEmbedding('Hamza Bennani SM_A Informatique Math')
    }
  });

  // Assign Free Plan to Student 1
  await prisma.subscription.create({
    data: {
      userId: student1User.id,
      planId: freePlan.id,
      status: 'ACTIVE',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  });

  // Grades for Student 1
  await prisma.studentGrade.createMany({
    data: [
      { studentId: student1.id, subjectCode: 'MATH', gradeValue: 17.5, period: 'S1' },
      { studentId: student1.id, subjectCode: 'PC', gradeValue: 16.5, period: 'S1' },
      { studentId: student1.id, subjectCode: 'FR', gradeValue: 15.0, period: 'REGIONAL' },
      { studentId: student1.id, subjectCode: 'EN', gradeValue: 16.0, period: 'S1' },
      { studentId: student1.id, subjectCode: 'SVT', gradeValue: 14.5, period: 'S1' }
    ]
  });

  // Student 2: Post-Bac PC Premium User
  const student2User = await prisma.user.create({
    data: {
      email: 'student2@orientcompanion.ma',
      passwordHash: passwordStudent,
      firstName: 'Sara',
      lastName: 'El Fassi',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const student2 = await prisma.student.create({
    data: {
      userId: student2User.id,
      bacTrack: 'PC',
      bacYear: 2023,
      region: 'Rabat-Salé-Kénitra',
      stage: 'CONCOURS_PREP',
      preferences: {
        preferredCities: ['Rabat', 'Marrakech'],
        interests: ['Médecine', 'Biologie', 'Pharmacie']
      },
      riasecScores: { R: 55, I: 85, A: 40, S: 80, E: 50, C: 60 },
      embedding: generateDeterministicEmbedding('Sara El Fassi PC Medecine Biologie')
    }
  });

  // Premium Subscription for Student 2
  const subStudent2 = await prisma.subscription.create({
    data: {
      userId: student2User.id,
      planId: premiumPlan.id,
      status: 'ACTIVE',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.payment.create({
    data: {
      userId: student2User.id,
      subscriptionId: subStudent2.id,
      amountMad: 199.0,
      provider: 'SIMULATED',
      status: 'SUCCESS'
    }
  });

  await prisma.studentGrade.createMany({
    data: [
      { studentId: student2.id, subjectCode: 'SVT', gradeValue: 17.0, period: 'NATIONAL' },
      { studentId: student2.id, subjectCode: 'PC', gradeValue: 16.0, period: 'NATIONAL' },
      { studentId: student2.id, subjectCode: 'MATH', gradeValue: 15.5, period: 'NATIONAL' },
      { studentId: student2.id, subjectCode: 'FR', gradeValue: 16.5, period: 'REGIONAL' }
    ]
  });

  // Student 3: Eco track student
  const student3User = await prisma.user.create({
    data: {
      email: 'student3@orientcompanion.ma',
      passwordHash: passwordStudent,
      firstName: 'Omar',
      lastName: 'Tazi',
      role: 'STUDENT',
      status: 'ACTIVE'
    }
  });

  const student3 = await prisma.student.create({
    data: {
      userId: student3User.id,
      bacTrack: 'ECO',
      bacYear: 2024,
      region: 'Tanger-Tétouan-Al Hoceïma',
      stage: 'PRE_BAC',
      preferences: {
        preferredCities: ['Tanger', 'Casablanca'],
        interests: ['Finance', 'Gestion', 'Marketing', 'Commerce International']
      },
      riasecScores: { R: 30, I: 60, A: 45, S: 70, E: 90, C: 85 },
      embedding: generateDeterministicEmbedding('Omar Tazi ECO Finance Commerce Management')
    }
  });

  await prisma.subscription.create({
    data: {
      userId: student3User.id,
      planId: freePlan.id,
      status: 'ACTIVE',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('✅ Users (Admin, 2 Counselors, 3 Students) seeded.');

  // 3. Seed Schools & 20 Moroccan Filières
  const schoolsData = [
    {
      name: 'Faculté des Sciences et Techniques de Settat',
      acronym: 'FST Settat',
      type: 'PUBLIC',
      city: 'Settat',
      region: 'Casablanca-Settat',
      website: 'https://fsts.ac.ma',
      description: 'Établissement public de l’Université Hassan 1er offrant des formations universitaires scientifiques et techniques.'
    },
    {
      name: 'École Nationale des Sciences Appliquées de Marrakech',
      acronym: 'ENSA Marrakech',
      type: 'PUBLIC',
      city: 'Marrakech',
      region: 'Marrakech-Safi',
      website: 'https://ensa.uca.ma',
      description: 'Grande école d’ingénieurs publique marocaine affiliée à l’Université Cadi Ayyad.'
    },
    {
      name: 'École Nationale de Commerce et de Gestion de Casablanca',
      acronym: 'ENCG Casablanca',
      type: 'PUBLIC',
      city: 'Casablanca',
      region: 'Casablanca-Settat',
      website: 'https://encgcasa.ac.ma',
      description: 'École leader dans les formations managériales, financières et commerciales au Maroc.'
    },
    {
      name: 'École Nationale Supérieure d’Informatique et d’Analyse des Systèmes',
      acronym: 'ENSIAS Rabat',
      type: 'PUBLIC',
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      website: 'https://ensias.um5.ac.ma',
      description: 'Pôle d’excellence national pour l’ingénierie informatique, l’IA, et la cybersécurité.'
    },
    {
      name: 'Faculté de Médecine et de Pharmacie de Rabat',
      acronym: 'FMP Rabat',
      type: 'PUBLIC',
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      website: 'https://fmp.um5.ac.ma',
      description: 'La plus ancienne faculté de médecine du Maroc, formant les futurs médecins et pharmaciens.'
    },
    {
      name: 'Institut Agronomique et Vétérinaire Hassan II',
      acronym: 'IAV Hassan II',
      type: 'PUBLIC',
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      website: 'https://iav.ac.ma',
      description: 'Institut polytechnique national spécialisé dans les sciences de la vie, de l’agronomie et de la topographie.'
    },
    {
      name: 'Centre de Classes Préparatoires Moulay Youssef',
      acronym: 'CPGE Moulay Youssef',
      type: 'PUBLIC',
      city: 'Rabat',
      region: 'Rabat-Salé-Kénitra',
      website: 'https://cpge.ac.ma',
      description: 'Centre historique d’excellence préparant aux concours des Grandes Écoles marocaines et françaises.'
    }
  ];

  const createdSchools = {};
  for (const s of schoolsData) {
    const school = await prisma.school.create({ data: s });
    createdSchools[s.acronym] = school;

    // Standard required documents for each school
    await prisma.requiredDocument.createMany({
      data: [
        { schoolId: school.id, name: 'Attestation du Baccalauréat', isMandatory: true, description: 'Copie certifiée conforme du Baccalauréat', howToObtain: 'Lycée d’origine', order: 1 },
        { schoolId: school.id, name: 'Relevé de notes du Bac (Régional & National)', isMandatory: true, description: 'Relevé officiel délivré par l’Académie', howToObtain: 'Direction provinciale / Académie', order: 2 },
        { schoolId: school.id, name: 'Copie de la Carte d’Identité Nationale (CIN)', isMandatory: true, description: 'Copie recto-verso de la CNIE', howToObtain: 'DGSN', order: 3 },
        { schoolId: school.id, name: 'Photos d’identité récentes', isMandatory: true, description: '2 photos format 35x45 mm fond blanc', howToObtain: 'Photographe', order: 4 }
      ]
    });

    // Standard application process
    await prisma.applicationProcess.create({
      data: {
        schoolId: school.id,
        year: 2024,
        openDate: new Date('2024-05-15T00:00:00Z'),
        closeDate: new Date('2024-06-30T23:59:59Z'),
        concoursDate: new Date('2024-07-20T08:30:00Z'),
        officialLink: s.website,
        steps: [
          { stepNumber: 1, title: 'Candidature en ligne', description: 'Inscription sur la plateforme officielle Tawjihi / Concours', date: '15 Mai - 30 Juin' },
          { stepNumber: 2, title: 'Affichage des listes de présélection', description: 'Publication des seuils et des convoqués au concours écrit', date: '10 Juillet' },
          { stepNumber: 3, title: 'Épreuve écrite (Concours)', description: 'Passation des épreuves écrites selon les centres retenus', date: '20 Juillet' },
          { stepNumber: 4, title: 'Dépôt définitif du dossier', description: 'Remise des pièces originales et inscription administrative', date: '25-30 Juillet' }
        ]
      }
    });
  }

  console.log('✅ Schools, required documents, and processes seeded.');

  // Filières definitions (~20 Moroccan filières)
  const filieresData = [
    // FST Settat
    {
      schoolAcronym: 'FST Settat',
      name: 'Licence Sciences et Techniques - Mathématiques, Informatique, Physique (MIP)',
      description: 'Tronc commun scientifique préparant aux licences d’informatique, mathématiques appliquées et génie logiciel.',
      level: 'BAC+3',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 60, I: 90, A: 20, S: 30, E: 40, C: 70 },
      tags: ['informatique', 'physique', 'maths', 'fst'],
      minAverage: 13.5,
      subjectWeights: { MATH: 0.5, PC: 0.3, SVT: 0.2 },
      cutoffs: [14.1, 13.8, 13.5]
    },
    {
      schoolAcronym: 'FST Settat',
      name: 'Licence Sciences et Techniques - Biologie, Chimie, Géologie (BCG)',
      description: 'Parcours axé sur les biotechnologies, la chimie verte et les sciences environnementales.',
      level: 'BAC+3',
      requiredBacTracks: ['SVT', 'PC', 'SM_A'],
      riasecProfile: { R: 65, I: 85, A: 25, S: 40, E: 30, C: 60 },
      tags: ['biologie', 'chimie', 'environnement', 'fst'],
      minAverage: 12.5,
      subjectWeights: { SVT: 0.45, PC: 0.35, MATH: 0.2 },
      cutoffs: [13.2, 12.8, 12.4]
    },
    {
      schoolAcronym: 'FST Settat',
      name: 'Licence Sciences et Techniques - Génie Électrique & Mécanique (GEGM)',
      description: 'Formation dédiée aux systèmes mécatroniques, automatique et énergies renouvelables.',
      level: 'BAC+3',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC', 'STE', 'STM'],
      riasecProfile: { R: 85, I: 80, A: 20, S: 30, E: 45, C: 60 },
      tags: ['mécanique', 'électrique', 'automatique', 'fst'],
      minAverage: 13.0,
      subjectWeights: { MATH: 0.4, PC: 0.4, STE: 0.2 },
      cutoffs: [13.6, 13.2, 13.0]
    },

    // ENSA Marrakech
    {
      schoolAcronym: 'ENSA Marrakech',
      name: 'Génie Informatique & Intelligence Artificielle',
      description: 'Diplôme d’Ingénieur d’État formant des spécialistes en développement logiciel, Cloud computing et IA.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 50, I: 95, A: 35, S: 40, E: 65, C: 75 },
      tags: ['informatique', 'ia', 'cloud', 'ingénieur', 'ensa'],
      minAverage: 15.0,
      subjectWeights: { MATH: 0.5, PC: 0.3, FR: 0.1, EN: 0.1 },
      cutoffs: [15.8, 15.5, 15.2]
    },
    {
      schoolAcronym: 'ENSA Marrakech',
      name: 'Génie Industriel et Logistique',
      description: 'Management de la chaîne logistique, optimisation des processus de fabrication et lean management.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC', 'STM'],
      riasecProfile: { R: 60, I: 75, A: 30, S: 50, E: 80, C: 80 },
      tags: ['industrie', 'logistique', 'management', 'ingénieur'],
      minAverage: 14.5,
      subjectWeights: { MATH: 0.4, PC: 0.3, FR: 0.15, EN: 0.15 },
      cutoffs: [15.0, 14.7, 14.3]
    },
    {
      schoolAcronym: 'ENSA Marrakech',
      name: 'Génie Réseaux et Télécommunications',
      description: 'Architecture des réseaux haut débit, cybersécurité des infrastructures et 5G/IoT.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 65, I: 85, A: 25, S: 35, E: 55, C: 70 },
      tags: ['réseaux', 'télécoms', 'cybersécurité', 'ingénieur'],
      minAverage: 14.0,
      subjectWeights: { MATH: 0.45, PC: 0.35, EN: 0.2 },
      cutoffs: [14.6, 14.2, 14.0]
    },

    // ENCG Casablanca
    {
      schoolAcronym: 'ENCG Casablanca',
      name: 'Gestion Financière et Comptable (GFC)',
      description: 'Parcours d’excellence en finance d’entreprise, marchés de capitaux et ingénierie financière.',
      level: 'BAC+5',
      requiredBacTracks: ['ECO', 'SGC', 'SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 25, I: 70, A: 25, S: 50, E: 85, C: 95 },
      tags: ['finance', 'comptabilité', 'banque', 'encg'],
      minAverage: 14.5,
      subjectWeights: { MATH: 0.4, FR: 0.3, EN: 0.3 },
      cutoffs: [15.2, 14.9, 14.4]
    },
    {
      schoolAcronym: 'ENCG Casablanca',
      name: 'Commerce International & Supply Chain',
      description: 'Négociation internationale, droit commercial mondial et logistique export.',
      level: 'BAC+5',
      requiredBacTracks: ['ECO', 'SGC', 'SM_A', 'PC', 'LETTRES'],
      riasecProfile: { R: 20, I: 60, A: 45, S: 75, E: 95, C: 65 },
      tags: ['commerce', 'international', 'négociation', 'langues'],
      minAverage: 14.0,
      subjectWeights: { FR: 0.35, EN: 0.35, MATH: 0.3 },
      cutoffs: [14.7, 14.3, 14.0]
    },
    {
      schoolAcronym: 'ENCG Casablanca',
      name: 'Audit et Contrôle de Gestion (ACG)',
      description: 'Pilotage des performances d’entreprise, audit interne et conformité réglementaire.',
      level: 'BAC+5',
      requiredBacTracks: ['ECO', 'SGC', 'SM_A', 'PC'],
      riasecProfile: { R: 20, I: 75, A: 20, S: 45, E: 80, C: 95 },
      tags: ['audit', 'contrôle', 'gestion', 'conseil'],
      minAverage: 14.2,
      subjectWeights: { MATH: 0.4, FR: 0.3, EN: 0.3 },
      cutoffs: [14.8, 14.5, 14.1]
    },

    // ENSIAS Rabat
    {
      schoolAcronym: 'ENSIAS Rabat',
      name: 'Génie Logiciel (GL)',
      description: 'Conception d’architectures logicielles modernes, microservices, DevOps et méthodes agiles.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 40, I: 95, A: 40, S: 45, E: 70, C: 80 },
      tags: ['logiciel', 'devops', 'web', 'architecture', 'ensias'],
      minAverage: 16.0,
      subjectWeights: { MATH: 0.6, PC: 0.3, EN: 0.1 },
      cutoffs: [16.5, 16.2, 16.0]
    },
    {
      schoolAcronym: 'ENSIAS Rabat',
      name: 'Sécurité des Systèmes d’Information & Cyber-défense',
      description: 'Audit de sécurité, cryptographie appliquée, tests d’intrusion et gouvernance de la cybersécurité.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 55, I: 95, A: 30, S: 30, E: 65, C: 85 },
      tags: ['cybersécurité', 'hacking', 'crypto', 'sécurité'],
      minAverage: 16.2,
      subjectWeights: { MATH: 0.55, PC: 0.35, EN: 0.1 },
      cutoffs: [16.8, 16.4, 16.1]
    },
    {
      schoolAcronym: 'ENSIAS Rabat',
      name: 'Data Science & Cloud Computing',
      description: 'Big Data, Machine Learning, architectures distribuées Cloud (AWS, Azure) et gouvernance des données.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B'],
      riasecProfile: { R: 45, I: 95, A: 35, S: 35, E: 65, C: 85 },
      tags: ['data science', 'cloud', 'machine learning', 'big data'],
      minAverage: 16.5,
      subjectWeights: { MATH: 0.65, PC: 0.25, EN: 0.1 },
      cutoffs: [17.1, 16.8, 16.4]
    },

    // FMP Rabat
    {
      schoolAcronym: 'FMP Rabat',
      name: 'Doctorat en Médecine Générale',
      description: 'Formation médicale complète en 6 années préparant à la pratique clinique et aux spécialités.',
      level: 'BAC+6',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC', 'SVT'],
      riasecProfile: { R: 60, I: 95, A: 30, S: 90, E: 55, C: 75 },
      tags: ['santé', 'médecine', 'clinique', 'fmp'],
      minAverage: 15.5,
      subjectWeights: { SVT: 0.35, PC: 0.35, MATH: 0.2, FR: 0.1 },
      cutoffs: [16.2, 15.9, 15.4]
    },
    {
      schoolAcronym: 'FMP Rabat',
      name: 'Doctorat en Médecine Dentaire',
      description: 'Chirurgie dentaire, soins prothétiques, orthodontie et réhabilitation bucco-dentaire.',
      level: 'BAC+6',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC', 'SVT'],
      riasecProfile: { R: 80, I: 85, A: 50, S: 80, E: 50, C: 70 },
      tags: ['dentaire', 'chirurgie', 'santé', 'soins'],
      minAverage: 15.0,
      subjectWeights: { SVT: 0.35, PC: 0.35, MATH: 0.2, FR: 0.1 },
      cutoffs: [15.6, 15.3, 15.0]
    },
    {
      schoolAcronym: 'FMP Rabat',
      name: 'Diplôme de Docteur en Pharmacie',
      description: 'Sciences du médicament, pharmacologie hospitalière, officine et industrie pharmaceutique.',
      level: 'BAC+6',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC', 'SVT'],
      riasecProfile: { R: 55, I: 90, A: 25, S: 75, E: 65, C: 85 },
      tags: ['pharmacie', 'chimie', 'médicament', 'santé'],
      minAverage: 14.8,
      subjectWeights: { PC: 0.4, SVT: 0.3, MATH: 0.2, FR: 0.1 },
      cutoffs: [15.3, 14.9, 14.7]
    },

    // IAV Hassan II Rabat
    {
      schoolAcronym: 'IAV Hassan II',
      name: 'Ingénierie Agronomique',
      description: 'Gestion des cultures durables, sécurité alimentaire, agro-technologies et protection des végétaux.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC', 'SVT'],
      riasecProfile: { R: 85, I: 85, A: 30, S: 50, E: 60, C: 65 },
      tags: ['agronomie', 'agriculture', 'écologie', 'iav'],
      minAverage: 14.0,
      subjectWeights: { SVT: 0.35, PC: 0.35, MATH: 0.3 },
      cutoffs: [14.6, 14.2, 13.9]
    },
    {
      schoolAcronym: 'IAV Hassan II',
      name: 'Génie Rural et Gestion de l’Eau',
      description: 'Hydraulique agricole, barrages, gestion des ressources hydriques et aménagement du territoire.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 85, I: 85, A: 25, S: 40, E: 65, C: 70 },
      tags: ['eau', 'hydraulique', 'environnement', 'ingénieur'],
      minAverage: 14.2,
      subjectWeights: { MATH: 0.45, PC: 0.4, SVT: 0.15 },
      cutoffs: [14.8, 14.5, 14.1]
    },
    {
      schoolAcronym: 'IAV Hassan II',
      name: 'Sciences Géomatiques et Ingénierie Topographique',
      description: 'SIG, télédétection par satellites, cartographie spatiale et cadastre foncier.',
      level: 'BAC+5',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 75, I: 90, A: 40, S: 30, E: 55, C: 75 },
      tags: ['géomatique', 'satellite', 'topographie', 'sig'],
      minAverage: 14.5,
      subjectWeights: { MATH: 0.5, PC: 0.35, EN: 0.15 },
      cutoffs: [15.1, 14.7, 14.3]
    },

    // CPGE Moulay Youssef Rabat
    {
      schoolAcronym: 'CPGE Moulay Youssef',
      name: 'MPSI - Mathématiques, Physique et Sciences de l’Ingénieur',
      description: 'Cycle préparatoire d’élite aux concours d’entrée des Grandes Écoles marocaines et françaises (CNC, Polytechnique, Mines-Ponts).',
      level: 'BAC+2',
      requiredBacTracks: ['SM_A', 'SM_B'],
      riasecProfile: { R: 45, I: 95, A: 20, S: 25, E: 50, C: 85 },
      tags: ['cpge', 'mpsi', 'maths', 'concours', 'excellence'],
      minAverage: 16.5,
      subjectWeights: { MATH: 0.6, PC: 0.3, FR: 0.05, EN: 0.05 },
      cutoffs: [17.3, 17.0, 16.7]
    },
    {
      schoolAcronym: 'CPGE Moulay Youssef',
      name: 'PCSI - Physique, Chimie et Sciences de l’Ingénieur',
      description: 'Préparation scientifique approfondie orientée vers la physique expérimentale et la chimie industrielle.',
      level: 'BAC+2',
      requiredBacTracks: ['SM_A', 'SM_B', 'PC'],
      riasecProfile: { R: 65, I: 90, A: 20, S: 25, E: 50, C: 75 },
      tags: ['cpge', 'pcsi', 'chimie', 'physique', 'concours'],
      minAverage: 15.5,
      subjectWeights: { PC: 0.45, MATH: 0.45, FR: 0.05, EN: 0.05 },
      cutoffs: [16.2, 15.8, 15.5]
    }
  ];

  for (const f of filieresData) {
    const school = createdSchools[f.schoolAcronym];
    const embedding = generateDeterministicEmbedding(`${f.name} ${f.tags.join(' ')} ${f.schoolAcronym}`);

    const filiere = await prisma.filiere.create({
      data: {
        schoolId: school.id,
        name: f.name,
        description: f.description,
        level: f.level,
        requiredBacTracks: f.requiredBacTracks,
        riasecProfile: f.riasecProfile,
        tags: f.tags,
        embedding
      }
    });

    // Admission Requirements
    await prisma.admissionRequirement.create({
      data: {
        filiereId: filiere.id,
        year: 2024,
        minAverage: f.minAverage,
        selectionMode: 'MIXED',
        subjectWeights: f.subjectWeights,
        minSubjectGrades: { MATH: 10.0 },
        sourceUrl: `${school.website}/admissions`
      }
    });

    // 3 Historical Cutoffs (SAMPLE DATA)
    const years = [2023, 2022, 2021];
    for (let i = 0; i < years.length; i++) {
      await prisma.historicalCutoff.create({
        data: {
          filiereId: filiere.id,
          year: years[i],
          cutoffScore: f.cutoffs[i],
          source: 'SAMPLE DATA (Ministère ENSUP / Orientation Maroc)'
        }
      });
    }
  }

  console.log(`✅ ${filieresData.length} Moroccan filières seeded with admission requirements & historical cutoffs.`);

  // 4. Seed 2 Concours, 40 Questions, 1 Mock Exam
  // Concours 1: ENSA Maroc
  const concoursENSA = await prisma.concours.create({
    data: {
      name: 'Concours Commun ENSA Maroc',
      examDate: new Date('2024-07-20T08:30:00Z'),
      subjects: ['MATH', 'PHYSICS', 'FRANCAIS', 'ANGLAIS'],
      description: 'Concours écrit commun aux Réseaux des Écoles Nationales des Sciences Appliquées du Maroc.'
    }
  });

  // Concours 2: Médecine FMP/FMD
  const concoursMed = await prisma.concours.create({
    data: {
      name: 'Concours d’Accès aux Facultés de Médecine et Pharmacie (FMP/FMD)',
      examDate: new Date('2024-07-25T08:00:00Z'),
      subjects: ['SVT', 'CHIMIE', 'PHYSIQUE', 'MATH'],
      description: 'Épreuve écrite nationale unifiée pour les Facultés de Médecine, Pharmacie et Médecine Dentaire.'
    }
  });

  // 20 Questions for ENSA
  const ensaQuestions = [];
  for (let i = 1; i <= 20; i++) {
    const isMath = i <= 6;
    const isPhysics = i > 6 && i <= 12;
    const isFr = i > 12 && i <= 16;
    const subject = isMath ? 'MATH' : isPhysics ? 'PHYSICS' : isFr ? 'FRANCAIS' : 'ANGLAIS';
    const topic = isMath ? 'Analyse & Intégrales' : isPhysics ? 'Électrocinétique RLC' : isFr ? 'Compréhension de texte' : 'Grammar & Vocabulary';

    ensaQuestions.push({
      concoursId: concoursENSA.id,
      subjectCode: subject,
      topic,
      difficulty: i % 3 === 0 ? 'HARD' : i % 2 === 0 ? 'MEDIUM' : 'EASY',
      statement: `Question ${i} (${subject}) - Déterminer la valeur ou la proposition exacte selon les données du problème.`,
      options: [
        `Option A: Solution standard de type 1 pour la question ${i}`,
        `Option B: Solution exacte et rigoureuse vérifiant les hypothèses`,
        `Option C: Solution alternative divergente`,
        `Option D: Aucune des réponses précédentes`
      ],
      correctOption: 1, // Option B is correct for sample questions
      explanation: `Démonstration détaillée: En appliquant le théorème fondamental associé à ${topic}, la réponse correcte est la proposition B.`
    });
  }

  const createdEnsaQuestions = [];
  for (const q of ensaQuestions) {
    const record = await prisma.question.create({ data: q });
    createdEnsaQuestions.push(record);
  }

  // 20 Questions for Médecine
  for (let i = 1; i <= 20; i++) {
    const isSvt = i <= 6;
    const isChimie = i > 6 && i <= 12;
    const isPhys = i > 12 && i <= 16;
    const subject = isSvt ? 'SVT' : isChimie ? 'CHIMIE' : isPhys ? 'PHYSIQUE' : 'MATH';
    const topic = isSvt ? 'Génétique humaine et méiose' : isChimie ? 'Cinétique chimique et pH' : isPhys ? 'Ondes mécaniques progressives' : 'Probabilités conditionnelles';

    await prisma.question.create({
      data: {
        concoursId: concoursMed.id,
        subjectCode: subject,
        topic,
        difficulty: i % 3 === 0 ? 'HARD' : 'MEDIUM',
        statement: `Question médicale ${i} (${subject}) - Identifier le mécanisme biologique ou physico-chimique approprié.`,
        options: [
          `Option A: Hypothèse clinique non vérifiée`,
          `Option B: Proposition exacte conforme au cours du Baccalauréat`,
          `Option C: Effet secondaire ou mécanisme erroné`,
          `Option D: Paramètre nul`
        ],
        correctOption: 1,
        explanation: `Justification médicale: La réaction biochimique ou génétique dans le cas de ${topic} confirme la proposition B.`
      }
    });
  }

  console.log('✅ 40 Concours sample questions created across ENSA and Médecine.');

  // Mock Exam for ENSA Maroc (120 minutes, 20 questions)
  const questionIds = createdEnsaQuestions.map(q => q.id);
  await prisma.mockExam.create({
    data: {
      concoursId: concoursENSA.id,
      title: 'Concours Blanc Officiel ENSA 2024 - Session Complète',
      durationMinutes: 120,
      questionIds
    }
  });

  console.log('✅ Mock Exam for ENSA created.');
  console.log('🎉 OrientCompanion database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
