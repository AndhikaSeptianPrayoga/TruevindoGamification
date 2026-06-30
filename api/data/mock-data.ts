import type {
  AnswerDistribution,
  AnswerOption,
  ParticipantStanding,
  QuizDetail,
  QuizSummary,
  SessionQuestionState,
  SessionState,
  SessionStatus,
} from '../../shared/types/game.js'

const now = new Date().toISOString()

const quizCatalog: QuizDetail[] = [
  {
    id: 'quiz-corporate-values',
    title: 'Corporate Values Sprint',
    description:
      'A live quiz for internal teams focused on workplace culture, compliance, and business strategy.',
    status: 'published',
    questionCount: 5,
    participantCount: 128,
    updatedAt: now,
    questions: [
      {
        id: 'cv-1',
        quizId: 'quiz-corporate-values',
        orderNo: 1,
        text: 'What is the top priority of compliance onboarding in the first 30 days?',
        imageUrl:
          'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Completing every mandatory module and passing the evaluation',
          B: 'Memorizing the org chart',
          C: 'Changing department policies',
          D: 'Submitting the annual budget',
        },
        correctOption: 'A',
        durationSeconds: 20,
      },
      {
        id: 'cv-2',
        quizId: 'quiz-corporate-values',
        orderNo: 2,
        text: 'What is the best indicator of a successful internal townhall?',
        imageUrl:
          'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'The amount of stage decoration',
          B: 'Audience participation and retention of the key message',
          C: 'The amount of snacks served',
          D: 'The color of the presentation template',
        },
        correctOption: 'B',
        durationSeconds: 25,
      },
      {
        id: 'cv-3',
        quizId: 'quiz-corporate-values',
        orderNo: 3,
        text: 'When escalating an operational incident, what is the most appropriate first step?',
        imageUrl:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Wait for an update from leadership',
          B: 'Hide the incident details',
          C: 'Log the incident and activate the official escalation path',
          D: 'Broadcast it to every public group',
        },
        correctOption: 'C',
        durationSeconds: 20,
      },
      {
        id: 'cv-4',
        quizId: 'quiz-corporate-values',
        orderNo: 4,
        text: 'Which behavior best reflects a culture of accountability?',
        imageUrl:
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Blaming other teams when targets are missed',
          B: 'Owning mistakes and proposing concrete fixes',
          C: 'Avoiding decisions to stay safe',
          D: 'Waiting for someone else to act first',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'cv-5',
        quizId: 'quiz-corporate-values',
        orderNo: 5,
        text: 'What is the primary goal of a quarterly performance review?',
        imageUrl:
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'To rank employees for layoffs',
          B: 'To align on goals, feedback, and growth opportunities',
          C: 'To reduce the training budget',
          D: 'To compare salaries publicly',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
    ],
  },
  {
    id: 'quiz-sales-kickoff',
    title: 'Sales Kickoff Challenge',
    description:
      'A corporate quiz template for sales events, channel partners, and product knowledge.',
    status: 'published',
    questionCount: 5,
    participantCount: 64,
    updatedAt: now,
    questions: [
      {
        id: 'sk-1',
        quizId: 'quiz-sales-kickoff',
        orderNo: 1,
        text: 'In a discovery call, what should a salesperson do most?',
        imageUrl:
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Talk about pricing immediately',
          B: 'Listen and ask questions about the customer needs',
          C: 'Demo every single feature',
          D: 'Push for a signature on the spot',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'sk-2',
        quizId: 'quiz-sales-kickoff',
        orderNo: 2,
        text: 'What does "MQL" stand for in a sales funnel?',
        imageUrl:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Marketing Qualified Lead',
          B: 'Monthly Quota Limit',
          C: 'Major Quality Level',
          D: 'Managed Quote List',
        },
        correctOption: 'A',
        durationSeconds: 20,
      },
      {
        id: 'sk-3',
        quizId: 'quiz-sales-kickoff',
        orderNo: 3,
        text: 'Which approach handles a price objection best?',
        imageUrl:
          'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Drop the price right away',
          B: 'End the conversation',
          C: 'Reframe the conversation around value and ROI',
          D: 'Ignore the objection',
        },
        correctOption: 'C',
        durationSeconds: 25,
      },
      {
        id: 'sk-4',
        quizId: 'quiz-sales-kickoff',
        orderNo: 4,
        text: 'What is the main purpose of a CRM system?',
        imageUrl:
          'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'To store and track customer relationships and deals',
          B: 'To design marketing posters',
          C: 'To process payroll',
          D: 'To host the company website',
        },
        correctOption: 'A',
        durationSeconds: 20,
      },
      {
        id: 'sk-5',
        quizId: 'quiz-sales-kickoff',
        orderNo: 5,
        text: 'Closing a deal is most effective when you:',
        imageUrl:
          'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Create urgency with false deadlines',
          B: 'Summarize value and confirm the next concrete step',
          C: 'Keep adding new features to discuss',
          D: 'Wait silently for the customer to decide',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
    ],
  },
  {
    id: 'quiz-product-knowledge',
    title: 'Product Knowledge Mastery',
    description:
      'Test how well your team understands the product portfolio, positioning, and key use cases.',
    status: 'published',
    questionCount: 5,
    participantCount: 92,
    updatedAt: now,
    questions: [
      {
        id: 'pk-1',
        quizId: 'quiz-product-knowledge',
        orderNo: 1,
        text: 'What is a "value proposition"?',
        imageUrl:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'The list of all product features',
          B: 'The clear benefit a product gives a specific customer',
          C: 'The price of the product',
          D: 'The company logo and slogan',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'pk-2',
        quizId: 'quiz-product-knowledge',
        orderNo: 2,
        text: 'Who is best described as the "target persona"?',
        imageUrl:
          'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Anyone who can pay',
          B: 'The CEO of every company',
          C: 'A semi-fictional profile of the ideal customer',
          D: 'The product manager',
        },
        correctOption: 'C',
        durationSeconds: 20,
      },
      {
        id: 'pk-3',
        quizId: 'quiz-product-knowledge',
        orderNo: 3,
        text: 'What is an MVP in product development?',
        imageUrl:
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Most Valuable Player',
          B: 'Minimum Viable Product',
          C: 'Maximum Value Plan',
          D: 'Marketing Visibility Program',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'pk-4',
        quizId: 'quiz-product-knowledge',
        orderNo: 4,
        text: 'A competitive differentiator is something that:',
        imageUrl:
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Every competitor also offers',
          B: 'Sets your product meaningfully apart from alternatives',
          C: 'Only the finance team cares about',
          D: 'Is always about the lowest price',
        },
        correctOption: 'B',
        durationSeconds: 25,
      },
      {
        id: 'pk-5',
        quizId: 'quiz-product-knowledge',
        orderNo: 5,
        text: 'What does a product roadmap communicate?',
        imageUrl:
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'The direction and priorities of the product over time',
          B: 'The office seating plan',
          C: 'The exact source code',
          D: 'The daily lunch menu',
        },
        correctOption: 'A',
        durationSeconds: 20,
      },
    ],
  },
  {
    id: 'quiz-cyber-security',
    title: 'Cyber Security Awareness',
    description:
      'A security-awareness quiz covering phishing, passwords, and safe handling of company data.',
    status: 'published',
    questionCount: 5,
    participantCount: 210,
    updatedAt: now,
    questions: [
      {
        id: 'sec-1',
        quizId: 'quiz-cyber-security',
        orderNo: 1,
        text: 'You receive an urgent email asking for your password. What should you do?',
        imageUrl:
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Reply with the password quickly',
          B: 'Click the link to verify',
          C: 'Report it as phishing and do not respond',
          D: 'Forward it to all colleagues',
        },
        correctOption: 'C',
        durationSeconds: 20,
      },
      {
        id: 'sec-2',
        quizId: 'quiz-cyber-security',
        orderNo: 2,
        text: 'Which is the strongest password practice?',
        imageUrl:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Reuse one easy password everywhere',
          B: 'Use a long unique passphrase with a password manager',
          C: 'Write it on a sticky note on your monitor',
          D: 'Use your birthdate',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'sec-3',
        quizId: 'quiz-cyber-security',
        orderNo: 3,
        text: 'What does MFA add to your account security?',
        imageUrl:
          'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'A second verification factor beyond the password',
          B: 'A faster internet connection',
          C: 'More storage space',
          D: 'Automatic spelling correction',
        },
        correctOption: 'A',
        durationSeconds: 20,
      },
      {
        id: 'sec-4',
        quizId: 'quiz-cyber-security',
        orderNo: 4,
        text: 'On public Wi-Fi, the safest way to access company systems is to:',
        imageUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Connect directly without protection',
          B: 'Use the company VPN',
          C: 'Disable your firewall for speed',
          D: 'Share the network with strangers',
        },
        correctOption: 'B',
        durationSeconds: 25,
      },
      {
        id: 'sec-5',
        quizId: 'quiz-cyber-security',
        orderNo: 5,
        text: 'You find a USB drive in the parking lot. What is the safe action?',
        imageUrl:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Plug it into your work laptop to check it',
          B: 'Hand it to IT security without plugging it in',
          C: 'Take it home and use it',
          D: 'Plug it into a shared meeting-room PC',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
    ],
  },
  {
    id: 'quiz-team-building',
    title: 'Team Building Trivia',
    description:
      'A light, fun trivia round to energize team offsites, retreats, and casual gatherings.',
    status: 'draft',
    questionCount: 5,
    participantCount: 0,
    updatedAt: now,
    questions: [
      {
        id: 'tb-1',
        quizId: 'quiz-team-building',
        orderNo: 1,
        text: 'In a brainstorming session, the best early rule is to:',
        imageUrl:
          'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Criticize every idea immediately',
          B: 'Welcome all ideas without judging them yet',
          C: 'Only let managers speak',
          D: 'Pick the first idea and stop',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'tb-2',
        quizId: 'quiz-team-building',
        orderNo: 2,
        text: 'What makes feedback most useful to a teammate?',
        imageUrl:
          'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'It is vague and general',
          B: 'It is specific, timely, and actionable',
          C: 'It is given only once a year',
          D: 'It focuses on personality, not behavior',
        },
        correctOption: 'B',
        durationSeconds: 20,
      },
      {
        id: 'tb-3',
        quizId: 'quiz-team-building',
        orderNo: 3,
        text: 'A "retrospective" meeting is mainly used to:',
        imageUrl:
          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Reflect on what went well and what to improve',
          B: 'Plan the company holiday party',
          C: 'Assign blame for failures',
          D: 'Review individual salaries',
        },
        correctOption: 'A',
        durationSeconds: 20,
      },
      {
        id: 'tb-4',
        quizId: 'quiz-team-building',
        orderNo: 4,
        text: 'Psychological safety in a team means people feel safe to:',
        imageUrl:
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Speak up, ask questions, and admit mistakes',
          B: 'Skip every meeting',
          C: 'Ignore deadlines',
          D: 'Avoid talking to each other',
        },
        correctOption: 'A',
        durationSeconds: 25,
      },
      {
        id: 'tb-5',
        quizId: 'quiz-team-building',
        orderNo: 5,
        text: 'Which is a healthy way to resolve a team conflict?',
        imageUrl:
          'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1200&q=80',
        options: {
          A: 'Avoid the person involved',
          B: 'Escalate loudly in public',
          C: 'Discuss openly and focus on the shared goal',
          D: 'Pretend nothing happened',
        },
        correctOption: 'C',
        durationSeconds: 20,
      },
    ],
  },
]

function cloneQuiz<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function recalculateQuizSummary(quiz: QuizDetail): QuizDetail {
  return {
    ...quiz,
    questionCount: quiz.questions.length,
    updatedAt: new Date().toISOString(),
    questions: quiz.questions
      .map((question, index) => ({
        ...question,
        quizId: quiz.id,
        orderNo: index + 1,
      }))
      .sort((left, right) => left.orderNo - right.orderNo),
  }
}

export function buildEmptyQuestion(quizId: string, orderNo: number) {
  return {
    id: `q-${Math.random().toString(36).slice(2, 10)}`,
    quizId,
    orderNo,
    text: '',
    imageUrl: '',
    options: {
      A: '',
      B: '',
      C: '',
      D: '',
    },
    correctOption: 'A' as const,
    durationSeconds: 20,
  }
}

const participants: ParticipantStanding[] = [
  { id: 'p-1', displayName: 'Andini', score: 1840, rank: 1, streak: 3, connected: true },
  { id: 'p-2', displayName: 'Bagas', score: 1760, rank: 2, streak: 2, connected: true },
  { id: 'p-3', displayName: 'Citra', score: 1700, rank: 3, streak: 2, connected: true },
  { id: 'p-4', displayName: 'Dimas', score: 1560, rank: 4, streak: 1, connected: true },
  { id: 'p-5', displayName: 'Evelyn', score: 1490, rank: 5, streak: 1, connected: false },
]

const emptyDistribution: AnswerDistribution[] = [
  { option: 'A', count: 0 },
  { option: 'B', count: 0 },
  { option: 'C', count: 0 },
  { option: 'D', count: 0 },
]

function buildQuestionForQuiz(
  quiz: QuizDetail,
  questionIndex: number,
  deadlineOffsetMs = 18000,
): SessionQuestionState | null {
  if (!quiz.questions.length) {
    return null
  }

  const safeIndex = Math.min(Math.max(questionIndex, 0), quiz.questions.length - 1)
  const active = quiz.questions[safeIndex]

  return {
    questionId: active.id,
    text: active.text,
    imageUrl: active.imageUrl,
    options: active.options,
    durationSeconds: active.durationSeconds,
    deadlineAt: new Date(Date.now() + deadlineOffsetMs).toISOString(),
    questionNumber: safeIndex + 1,
    totalQuestions: quiz.questions.length,
  }
}

export function getQuizSummaries(): QuizSummary[] {
  return quizCatalog.map(({ questions, ...quiz }) => cloneQuiz(quiz))
}

export function getQuizDetail(quizId: string): QuizDetail | undefined {
  const quiz = quizCatalog.find((item) => item.id === quizId)
  return quiz ? cloneQuiz(quiz) : undefined
}

export function createDraftQuiz(): QuizDetail {
  const draftQuiz: QuizDetail = {
    id: `quiz-${Math.random().toString(36).slice(2, 10)}`,
    title: 'New Truevindo Quiz',
    description: 'Add your corporate quiz description here.',
    status: 'draft',
    questionCount: 1,
    participantCount: 0,
    updatedAt: new Date().toISOString(),
    questions: [],
  }

  draftQuiz.questions = [buildEmptyQuestion(draftQuiz.id, 1)]
  const normalized = recalculateQuizSummary(draftQuiz)
  quizCatalog.unshift(normalized)
  return cloneQuiz(normalized)
}

export function saveQuizDetail(quizId: string, payload: QuizDetail): QuizDetail | undefined {
  const index = quizCatalog.findIndex((quiz) => quiz.id === quizId)

  if (index === -1) {
    return undefined
  }

  const normalized = recalculateQuizSummary({
    ...payload,
    id: quizId,
    questions: payload.questions.length ? payload.questions : [buildEmptyQuestion(quizId, 1)],
  })

  quizCatalog[index] = normalized
  return cloneQuiz(normalized)
}

export function updateQuizStatus(
  quizId: string,
  status: QuizDetail['status'],
): QuizDetail | undefined {
  const index = quizCatalog.findIndex((quiz) => quiz.id === quizId)

  if (index === -1) {
    return undefined
  }

  const updated = recalculateQuizSummary({
    ...quizCatalog[index],
    status,
  })

  quizCatalog[index] = updated
  return cloneQuiz(updated)
}

export function duplicateQuiz(quizId: string): QuizDetail | undefined {
  const source = quizCatalog.find((quiz) => quiz.id === quizId)

  if (!source) {
    return undefined
  }

  const duplicatedId = `quiz-${Math.random().toString(36).slice(2, 10)}`
  const duplicated: QuizDetail = recalculateQuizSummary({
    ...cloneQuiz(source),
    id: duplicatedId,
    title: `${source.title} Copy`,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    questions: source.questions.map((question, index) => ({
      ...cloneQuiz(question),
      id: `q-${Math.random().toString(36).slice(2, 10)}`,
      quizId: duplicatedId,
      orderNo: index + 1,
    })),
  })

  quizCatalog.unshift(duplicated)
  return cloneQuiz(duplicated)
}

export function deleteQuiz(quizId: string): boolean {
  const index = quizCatalog.findIndex((quiz) => quiz.id === quizId)

  if (index === -1) {
    return false
  }

  quizCatalog.splice(index, 1)
  return true
}

interface BuildSessionStateOptions {
  quizId?: string
  sessionId?: string
  pinCode?: string
  status?: SessionStatus
  currentQuestionIndex?: number
  initialParticipants?: ParticipantStanding[]
}

export function buildSessionState({
  quizId = 'quiz-corporate-values',
  sessionId = 'session-truevindo-001',
  pinCode = '482913',
  status = 'waiting',
  currentQuestionIndex = 0,
  initialParticipants = participants,
}: BuildSessionStateOptions = {}): SessionState {
  const quiz = getQuizDetail(quizId) ?? cloneQuiz(quizCatalog[0])
  const questionIndex = Math.min(Math.max(currentQuestionIndex, 0), Math.max(quiz.questions.length - 1, 0))
  const activeQuestion = status === 'question_live' ? buildQuestionForQuiz(quiz, questionIndex, 25000) : null
  const resultQuestion = buildQuestionForQuiz(quiz, questionIndex)
  const correctOption = quiz.questions[questionIndex]?.correctOption ?? 'A'

  return {
    sessionId,
    quizId: quiz.id,
    pinCode,
    status,
    quizTitle: quiz.title,
    joinedParticipants: initialParticipants.length,
    currentQuestionIndex: questionIndex,
    totalQuestions: quiz.questions.length,
    responsesReceived: 0,
    leaderboard: initialParticipants,
    participants: initialParticipants,
    activeQuestion,
    answerDistribution: status === 'question_result' || status === 'leaderboard' || status === 'completed' ? emptyDistribution : [],
    lastResult:
      status === 'question_result'
        && resultQuestion
        ? {
            questionId: resultQuestion.questionId,
            selectedOption: correctOption,
            isCorrect: true,
            scoreAwarded: 892,
          }
        : undefined,
  }
}

export function createJoinState(
  participantId: string,
  displayName: string,
  baseState: SessionState,
): SessionState {
  const mergedParticipants = [
    { id: participantId, displayName, score: 0, rank: participants.length + 1, streak: 0, connected: true },
    ...baseState.participants.filter((participant) => participant.id !== participantId),
  ]

  return {
    ...baseState,
    participants: mergedParticipants,
    joinedParticipants: mergedParticipants.length,
    leaderboard: mergedParticipants,
  }
}

export function buildAnalyticsFromOption(selectedOption?: AnswerOption): AnswerDistribution[] {
  if (!selectedOption) {
    return emptyDistribution
  }

  return emptyDistribution.map((item) =>
    item.option === selectedOption ? { ...item, count: item.count + 1 } : item,
  )
}
