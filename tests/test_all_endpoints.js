import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

async function runAllEndpointTests() {
  console.log('🚀 Starting Comprehensive End-to-End Test for All OrientCompanion Endpoints...\n');

  // Start app on ephemeral port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  const rootUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  async function testEndpoint(name, url, options = {}, expectedStatus = 200) {
    try {
      const res = await fetch(url, options);
      const data = await res.json().catch(() => null);

      if (res.status === expectedStatus && (data ? data.success !== false : true)) {
        console.log(`✅ [PASS] ${res.status} | ${name}`);
        passed++;
        return data;
      } else {
        console.error(`❌ [FAIL] ${res.status} (expected ${expectedStatus}) | ${name}`);
        console.error('   Response:', JSON.stringify(data, null, 2));
        failed++;
        return data;
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${name}:`, err.message);
      failed++;
      return null;
    }
  }

  try {
    // 1. Health Checks
    console.log('--- 1. Health Endpoints ---');
    await testEndpoint('GET /health', `${rootUrl}/health`);
    await testEndpoint('GET /api/v1/health', `${baseUrl}/health`);

    // 2. Auth Endpoints
    console.log('\n--- 2. Authentication Endpoints ---');
    const studentLogin = await testEndpoint('POST /auth/login (Student)', `${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@orientcompanion.ma', password: 'Student123!' })
    });
    const studentToken = studentLogin?.data?.accessToken;
    const refreshToken = studentLogin?.data?.refreshToken;

    const premiumLogin = await testEndpoint('POST /auth/login (Premium Student)', `${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student2@orientcompanion.ma', password: 'Student123!' })
    });
    const premiumToken = premiumLogin?.data?.accessToken;

    const counselorLogin = await testEndpoint('POST /auth/login (Counselor)', `${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'counselor1@orientcompanion.ma', password: 'Counselor123!' })
    });
    const counselorToken = counselorLogin?.data?.accessToken;

    const adminLogin = await testEndpoint('POST /auth/login (Admin)', `${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@orientcompanion.ma', password: 'Admin123!' })
    });
    const adminToken = adminLogin?.data?.accessToken;

    await testEndpoint('GET /auth/me', `${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    await testEndpoint('POST /auth/refresh', `${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    // 3. Students & Grades
    console.log('\n--- 3. Students & Grades Endpoints ---');
    await testEndpoint('GET /students/me', `${baseUrl}/students/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    await testEndpoint('PUT /students/me', `${baseUrl}/students/me`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stage: 'PRE_BAC',
        preferences: { interests: ['Génie Logiciel', 'Mathématiques'], preferredCities: ['Casablanca', 'Rabat'] }
      })
    });

    await testEndpoint('PUT /students/me/grades', `${baseUrl}/students/me/grades`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grades: [
          { subjectCode: 'MATH', gradeValue: 18.0, period: 'NATIONAL' },
          { subjectCode: 'PC', gradeValue: 17.0, period: 'NATIONAL' },
          { subjectCode: 'FR', gradeValue: 15.5, period: 'REGIONAL' },
          { subjectCode: 'EN', gradeValue: 16.5, period: 'S1' }
        ]
      })
    });

    await testEndpoint('GET /students/me/grades', `${baseUrl}/students/me/grades`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    await testEndpoint('GET /students/:id (Counselor view)', `${baseUrl}/students/1`, {
      headers: { Authorization: `Bearer ${counselorToken}` }
    });

    // 4. Assessment & Chatbot
    console.log('\n--- 4. Assessment & Chatbot Endpoints ---');
    await testEndpoint('GET /assessment/questionnaire', `${baseUrl}/assessment/questionnaire`);

    const answers = [];
    for (let i = 1; i <= 30; i++) {
      answers.push({ questionId: i, score: (i % 5) + 1 });
    }
    await testEndpoint('POST /assessment/submit', `${baseUrl}/assessment/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers })
    });

    await testEndpoint('POST /chatbot/message', `${baseUrl}/chatbot/message`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: 'test-session-1',
        content: 'Bonjour, je recherche les meilleures écoles d’ingénieurs post-bac au Maroc.'
      })
    });

    // 5. Recommendations
    console.log('\n--- 5. Hybrid Recommendation Pipeline ---');
    await testEndpoint('POST /recommendations/generate', `${baseUrl}/recommendations/generate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, 201);

    await testEndpoint('GET /recommendations/me', `${baseUrl}/recommendations/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    // 6. Grade Target Planner
    console.log('\n--- 6. Grade Target Planner Endpoints ---');
    // Clear previous test goals for student 1 to respect Free plan quota
    await prisma.gradeGoal.deleteMany({ where: { studentId: 1 } });

    await testEndpoint('POST /grade-planner/goals', `${baseUrl}/grade-planner/goals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filiereId: 4 })
    }, 201);

    await testEndpoint('GET /grade-planner/goals', `${baseUrl}/grade-planner/goals`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    await testEndpoint('POST /grade-planner/simulate', `${baseUrl}/grade-planner/simulate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filiereId: 4,
        hypotheticalGrades: { MATH: 18.0, PC: 17.0, FR: 15.0, EN: 16.0 }
      })
    });

    // 7. Schools & Filières Directory
    console.log('\n--- 7. Schools & Filières Directory ---');
    await testEndpoint('GET /schools', `${baseUrl}/schools`);
    await testEndpoint('GET /schools/1', `${baseUrl}/schools/1`);
    await testEndpoint('GET /schools/1/requirements', `${baseUrl}/schools/1/requirements`);
    await testEndpoint('GET /filieres?bacTrack=SM_A', `${baseUrl}/filieres?bacTrack=SM_A`);
    await testEndpoint('GET /filieres/4', `${baseUrl}/filieres/4`);

    // 8. Application Toolkit
    console.log('\n--- 8. Application Toolkit Endpoints ---');
    // Clear previous test applications for student 1 to avoid duplicate conflict
    await prisma.studentChecklistItem.deleteMany({ where: { application: { studentId: 1 } } });
    await prisma.studentApplication.deleteMany({ where: { studentId: 1 } });

    const createdApp = await testEndpoint('POST /applications', `${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filiereId: 4 })
    }, 201);

    await testEndpoint('GET /applications/me', `${baseUrl}/applications/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    if (createdApp?.data?.id) {
      await testEndpoint('GET /applications/:id/progress', `${baseUrl}/applications/${createdApp.data.id}/progress`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
    }

    // 9. Subscriptions
    console.log('\n--- 9. Subscriptions Endpoints ---');
    await testEndpoint('GET /plans', `${baseUrl}/plans`);
    await testEndpoint('GET /subscriptions/me', `${baseUrl}/subscriptions/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    // 10. Concours Companion (Premium)
    console.log('\n--- 10. Concours Companion Endpoints ---');
    await testEndpoint('GET /concours (Public)', `${baseUrl}/concours`);
    await testEndpoint('GET /concours/1 (Public)', `${baseUrl}/concours/1`);

    await testEndpoint('GET /question-bank (Premium)', `${baseUrl}/question-bank?concoursId=1&limit=5`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    });

    await testEndpoint('POST /study-plans (Premium)', `${baseUrl}/study-plans`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${premiumToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        concoursId: 1,
        hoursPerWeek: 10,
        examDate: '2027-07-20T08:30:00Z'
      })
    }, 201);

    await testEndpoint('GET /study-plans/me (Premium)', `${baseUrl}/study-plans/me`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    });

    const mockStart = await testEndpoint('POST /mock-exams/:id/start (Premium)', `${baseUrl}/mock-exams/1/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${premiumToken}` }
    });

    await testEndpoint('POST /mock-exams/:id/submit (Premium)', `${baseUrl}/mock-exams/1/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${premiumToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers: { '1': 1, '2': 1, '3': 0 } })
    });

    await testEndpoint('GET /exam-attempts/me (Premium)', `${baseUrl}/exam-attempts/me`, {
      headers: { Authorization: `Bearer ${premiumToken}` }
    });

    await testEndpoint('POST /tutor/ask (Premium question)', `${baseUrl}/tutor/ask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${premiumToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionId: 1 })
    });

    // 11. Mentorship
    console.log('\n--- 11. Mentorship Endpoints ---');
    await testEndpoint('GET /counselors/me/availability (Counselor)', `${baseUrl}/counselors/me/availability`, {
      headers: { Authorization: `Bearer ${counselorToken}` }
    });

    await testEndpoint('GET /mentorship/sessions', `${baseUrl}/mentorship/sessions`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    // 12. Notifications
    console.log('\n--- 12. Notifications Endpoints ---');
    await testEndpoint('GET /notifications', `${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    // 13. Admin Endpoints
    console.log('\n--- 13. Admin & Analytics Endpoints ---');
    await testEndpoint('GET /admin/stats (Admin)', `${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    await testEndpoint('GET /admin/users (Admin)', `${baseUrl}/admin/users?role=STUDENT`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log('\n======================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runAllEndpointTests();
