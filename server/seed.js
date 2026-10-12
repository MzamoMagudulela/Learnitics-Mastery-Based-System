const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Configure reliable DNS servers for Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in restricted environments
}

dotenv.config({ path: path.join(__dirname, '.env') });

const {
  User,
  UserProfile,
  Course,
  Module,
  CourseEnrollment,
  Lesson,
  LessonProgress,
  Quiz,
  Question,
  AnswerOption,
  QuizAttempt,
  AttemptAnswer,
  Achievement,
  UserAchievement,
} = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/learnitics';

async function seedDatabase(options = {}) {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('--- Connecting to MongoDB ---');
      await mongoose.connect(MONGO_URI);
      console.log(`Connected to: ${MONGO_URI}`);
    } else {
      console.log('--- Using active MongoDB connection ---');
    }

    console.log('\n--- Clearing existing data from all 14 collections ---');
    await Promise.all([
      User.deleteMany({}),
      UserProfile.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      CourseEnrollment.deleteMany({}),
      Lesson.deleteMany({}),
      LessonProgress.deleteMany({}),
      Quiz.deleteMany({}),
      Question.deleteMany({}),
      AnswerOption.deleteMany({}),
      QuizAttempt.deleteMany({}),
      AttemptAnswer.deleteMany({}),
      Achievement.deleteMany({}),
      UserAchievement.deleteMany({}),
    ]);
    console.log('Cleared all collections.');

    console.log('\n--- Hashing Passwords ---');
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const teacherPasswordHash = await bcrypt.hash('TeacherPass123!', 10);
    const studentPasswordHash = await bcrypt.hash('StudentPass123!', 10);

    // 1. Create 1 Admin
    console.log('--- Seeding Admin ---');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@learnitics.com',
      password: adminPasswordHash,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
    });
    await UserProfile.create({
      user: adminUser._id,
      bio: 'Learnitics platform administrator managing institutional mastery frameworks and analytics.',
      headline: 'Chief Learning Systems Officer',
      streakCount: 42,
      totalPoints: 12500,
      masteryLevel: 'master',
      preferences: { notifications: true, theme: 'dark' },
    });

    // 2. Create 2 Teachers
    console.log('--- Seeding Teachers ---');
    const teacher1 = await User.create({
      name: 'Dr. Alan Turing',
      email: 'teacher@learnitics.com',
      password: teacherPasswordHash,
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isActive: true,
    });
    await UserProfile.create({
      user: teacher1._id,
      bio: 'Senior Software Architect specializing in Full-Stack distributed systems and reactive web patterns.',
      headline: 'Full-Stack Software Architecture Lead',
      streakCount: 28,
      totalPoints: 8900,
      masteryLevel: 'master',
      preferences: { notifications: true, theme: 'system' },
    });

    const teacher2 = await User.create({
      name: 'Prof. Ada Lovelace',
      email: 'ada.lovelace@learnitics.edu',
      password: teacherPasswordHash,
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isActive: true,
    });
    await UserProfile.create({
      user: teacher2._id,
      bio: 'Computer Science Professor passionate about mastery learning, algorithm design, and microservices.',
      headline: 'Professor of Algorithmic Foundations & Cloud Systems',
      streakCount: 35,
      totalPoints: 9400,
      masteryLevel: 'master',
      preferences: { notifications: true, theme: 'light' },
    });

    // 3. Create 16 Students
    console.log('--- Seeding 16 Students ---');
    const studentData = [
      { name: 'Alex Johnson', email: 'student@learnitics.com', streak: 7, points: 1450, level: 'advanced' },
      { name: 'Beatriz Santos', email: 'beatriz@learnitics.edu', streak: 4, points: 980, level: 'intermediate' },
      { name: 'Chen Wei', email: 'chen@learnitics.edu', streak: 12, points: 2100, level: 'master' },
      { name: 'Daphne Moreau', email: 'daphne@learnitics.edu', streak: 3, points: 720, level: 'beginner' },
      { name: 'Ethan Miller', email: 'ethan@learnitics.edu', streak: 6, points: 1250, level: 'intermediate' },
      { name: 'Fatima Al-Mansoor', email: 'fatima@learnitics.edu', streak: 9, points: 1820, level: 'advanced' },
      { name: 'Gabriel Rossi', email: 'gabriel@learnitics.edu', streak: 2, points: 540, level: 'beginner' },
      { name: 'Hana Tanaka', email: 'hana@learnitics.edu', streak: 8, points: 1640, level: 'advanced' },
      { name: 'Isaac Newton', email: 'isaac@learnitics.edu', streak: 15, points: 2850, level: 'master' },
      { name: 'Julia Kim', email: 'julia@learnitics.edu', streak: 5, points: 1100, level: 'intermediate' },
      { name: 'Kofi Mensah', email: 'kofi@learnitics.edu', streak: 4, points: 890, level: 'beginner' },
      { name: 'Larissa Ivanova', email: 'larissa@learnitics.edu', streak: 11, points: 2300, level: 'master' },
      { name: 'Marcus Vance', email: 'marcus@learnitics.edu', streak: 1, points: 350, level: 'beginner' },
      { name: 'Nadia Patel', email: 'nadia@learnitics.edu', streak: 6, points: 1320, level: 'intermediate' },
      { name: 'Oscar Lindqvist', email: 'oscar@learnitics.edu', streak: 8, points: 1750, level: 'advanced' },
      { name: 'Priya Sharma', email: 'priya@learnitics.edu', streak: 10, points: 2050, level: 'master' },
    ];

    const students = [];
    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i];
      const studentUser = await User.create({
        name: s.name,
        email: s.email,
        password: studentPasswordHash,
        role: 'student',
        avatar: `https://images.unsplash.com/photo-${1500000000000 + i * 12345}?w=150`,
        isActive: true,
      });

      await UserProfile.create({
        user: studentUser._id,
        bio: `Mastery-oriented student focused on deep comprehension and skill retention.`,
        headline: `Aspiring Software Engineer & Lifelong Learner`,
        streakCount: s.streak,
        totalPoints: s.points,
        masteryLevel: s.level,
        preferences: { notifications: true, theme: 'system' },
      });

      students.push(studentUser);
    }
    console.log(`Created ${students.length} students with profiles.`);

    // 4. Create 8 Achievements
    console.log('--- Seeding 8 Achievements ---');
    const achievementDefinitions = [
      {
        title: 'First Quiz Passed',
        slug: 'first-quiz-passed',
        description: 'Demonstrate initial mastery by achieving a passing score on your first module assessment.',
        badgeIcon: 'Award',
        category: 'quiz',
        criteriaType: 'quiz_passed',
        criteriaValue: 1,
        points: 50,
      },
      {
        title: '5-Day Streak',
        slug: '5-day-streak',
        description: 'Demonstrated exceptional consistency by learning 5 consecutive calendar days in a row.',
        badgeIcon: 'Flame',
        category: 'streak',
        criteriaType: 'streak_days',
        criteriaValue: 5,
        points: 100,
      },
      {
        title: 'Score 100%',
        slug: 'score-100',
        description: 'Attain flawless mastery by answering every question correctly on a module quiz.',
        badgeIcon: 'Zap',
        category: 'quiz',
        criteriaType: 'perfect_score',
        criteriaValue: 100,
        points: 150,
      },
      {
        title: 'Course Completed',
        slug: 'course-completed',
        description: 'Demonstrate holistic competency by mastering all modules and checkpoints across an entire course.',
        badgeIcon: 'CheckCircle',
        category: 'course',
        criteriaType: 'course_completed',
        criteriaValue: 1,
        points: 300,
      },
      {
        title: 'Mastery Champion',
        slug: 'mastery-champion',
        description: 'Earn mastery verification (>= 80%) across 5 distinct module checkpoints.',
        badgeIcon: 'Trophy',
        category: 'mastery',
        criteriaType: 'mastery_achieved',
        criteriaValue: 5,
        points: 250,
      },
      {
        title: 'Speed Learner',
        slug: 'speed-learner',
        description: 'Attain passing mastery on an assessment in under 180 seconds with focused precision.',
        badgeIcon: 'Clock',
        category: 'quiz',
        criteriaType: 'speed_learner',
        criteriaValue: 180,
        points: 75,
      },
      {
        title: 'Knowledge Explorer',
        slug: 'knowledge-explorer',
        description: 'Complete 10 interactive text and video lessons across your enrolled courses.',
        badgeIcon: 'BookOpen',
        category: 'general',
        criteriaType: 'quiz_count',
        criteriaValue: 10,
        points: 80,
      },
      {
        title: 'First Attempt Ace',
        slug: 'first-attempt-ace',
        description: 'Conquer a mastery checkpoint quiz on your very first try without requiring remediation.',
        badgeIcon: 'Target',
        category: 'quiz',
        criteriaType: 'first_attempt_pass',
        criteriaValue: 1,
        points: 120,
      },
    ];

    const achievements = await Achievement.insertMany(achievementDefinitions);
    console.log(`Created ${achievements.length} achievements.`);

    // 5. Create 3 Courses with Modules, Lessons, Quizzes, Questions & AnswerOptions
    console.log('--- Seeding 3 Courses ---');

    const courseData = [
      {
        title: 'Mastering Full-Stack MERN Architecture',
        slug: 'mastering-full-stack-mern-architecture',
        description: 'Comprehensive mastery-based curriculum covering Node.js event loops, MongoDB optimization, Express middleware security, and scalable React design patterns.',
        instructor: teacher1._id,
        category: 'Web Development',
        level: 'intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
        status: 'published',
        passingScore: 80,
        modules: [
          {
            title: 'Node.js Core Architecture & Non-Blocking I/O',
            description: 'Understand the V8 engine, libuv event loop, worker threads, and asynchronous flow control.',
            order: 1,
            lessons: [
              {
                title: 'The Libuv Event Loop & Microtask Queue',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/PNa9OMajw9w',
                duration: 18,
                content: '# The Libuv Event Loop\n\nNode.js uses an event-driven architecture that delegates asynchronous operations to the underlying libuv C library.\n\n### Phases of the Event Loop:\n1. **Timers**: `setTimeout`, `setInterval` callbacks.\n2. **Pending Callbacks**: I/O errors and deferrals.\n3. **Idle, Prepare**: Internal subsystem handling.\n4. **Poll**: Retrieve new I/O events.\n5. **Check**: `setImmediate` executions.\n6. **Close Callbacks**: Socket cleanup.',
                order: 1,
              },
              {
                title: 'Streams, Buffers and Backpressure Handling',
                contentType: 'text',
                duration: 14,
                content: '# Node.js Streams & Backpressure\n\nWhen reading large files or handling network chunks, buffers and streams prevent memory exhaustion.\n\n```javascript\nconst fs = require("fs");\nconst readStream = fs.createReadStream("large.csv");\nconst writeStream = fs.createWriteStream("output.csv");\nreadStream.pipe(writeStream);\n```\n\nBackpressure occurs when the consumer cannot process data as fast as the producer sends it.',
                order: 2,
              },
              {
                title: 'Process Management, Clusters & Worker Threads',
                contentType: 'text',
                duration: 16,
                content: '# Clustering & Multithreading\n\nNode.js is single-threaded on the JavaScript execution side, but child processes and worker threads allow true parallel CPU-bound execution across multi-core processors.',
                order: 3,
              },
            ],
            quiz: {
              title: 'Node.js Foundations Mastery Checkpoint',
              passingPercentage: 80,
              questions: [
                {
                  text: 'Which internal library powers the event loop and asynchronous I/O in Node.js?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Libuv is the multi-platform support library written in C that handles the event loop and asynchronous operations.',
                  options: [
                    { text: 'libuv', isCorrect: true },
                    { text: 'V8 Engine', isCorrect: false },
                    { text: 'ChakraCore', isCorrect: false },
                    { text: 'Babel Core', isCorrect: false },
                  ],
                },
                {
                  text: 'Which queue has higher priority than standard timer callbacks in Node.js?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'process.nextTick queue and Promise microtasks execute immediately after the current operation finishes, before the next event loop phase.',
                  options: [
                    { text: 'Microtask Queue (process.nextTick & Promises)', isCorrect: true },
                    { text: 'Poll Queue', isCorrect: false },
                    { text: 'Check Queue (setImmediate)', isCorrect: false },
                    { text: 'Idle Queue', isCorrect: false },
                  ],
                },
                {
                  text: 'In Node.js, the method to schedule a callback to run immediately in the check phase is named _______ (case-sensitive).',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'setImmediate executes scripts in the check phase of the event loop.',
                  options: [
                    { text: 'setImmediate', isCorrect: true },
                  ],
                },
                {
                  text: 'What happens when a writable stream returns false from write()?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Returning false indicates backpressure: the internal buffer is full and the producer should pause until the drain event fires.',
                  options: [
                    { text: 'Backpressure is signaled and the producer should pause', isCorrect: true },
                    { text: 'The stream has permanently crashed', isCorrect: false },
                    { text: 'The data is immediately discarded', isCorrect: false },
                    { text: 'Node exits with error code 1', isCorrect: false },
                  ],
                },
                {
                  text: 'Which Node.js core module allows creating separate JavaScript execution threads sharing memory via SharedArrayBuffer?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'worker_threads module provides true threads for CPU-bound computation.',
                  options: [
                    { text: 'worker_threads', isCorrect: true },
                  ],
                },
                {
                  text: 'Which function runs first when both are scheduled concurrently from the main script?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'process.nextTick executes before any new phase of the event loop, taking precedence over setImmediate.',
                  options: [
                    { text: 'process.nextTick()', isCorrect: true },
                    { text: 'setImmediate()', isCorrect: false },
                    { text: 'setTimeout(cb, 1000)', isCorrect: false },
                    { text: 'They execute in non-deterministic order', isCorrect: false },
                  ],
                },
              ],
            },
          },
          {
            title: 'Mongoose Schema Design & High-Performance Data Modeling',
            description: 'Master embedding vs referencing, indexing strategies, compound indexes, and aggregation pipelines.',
            order: 2,
            lessons: [
              {
                title: 'Embedding vs Referencing in Document Databases',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/bEB_Vd1hH_Y',
                duration: 20,
                content: '# Embedding vs Referencing\n\nChoose embedding for 1:few relationships that are always retrieved together. Choose referencing for 1:many and many:many relationships to avoid document bloat beyond the 16MB BSON limit.',
                order: 1,
              },
              {
                title: 'Compound Indexing & Query Optimization (Explain Plans)',
                contentType: 'text',
                duration: 15,
                content: '# Mongoose Indexing Strategies\n\nUnderstand ESR rule (Equality, Sort, Range) when structuring compound indexes for maximum index scan efficiency (`IXSCAN` over `COLLSCAN`).',
                order: 2,
              },
              {
                title: 'Mastering the MongoDB Aggregation Pipeline',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/vx1C8eyiqkg',
                duration: 22,
                content: '# MongoDB Aggregation\n\nLeverage `$match`, `$group`, `$lookup`, and `$facet` stages for multi-dimensional analytics.',
                order: 3,
              },
            ],
            quiz: {
              title: 'MongoDB & Mongoose Architecture Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'What is the maximum BSON document size limit in MongoDB?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'MongoDB enforces a 16 Megabyte maximum document size limit to prevent runaway memory usage.',
                  options: [
                    { text: '16 Megabytes (16MB)', isCorrect: true },
                    { text: '64 Megabytes (64MB)', isCorrect: false },
                    { text: '4 Megabytes (4MB)', isCorrect: false },
                    { text: '2 Gigabytes (2GB)', isCorrect: false },
                  ],
                },
                {
                  text: 'According to MongoDB indexing best practices, what does the ESR rule stand for?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'ESR stands for Equality first, Sort second, and Range third in compound index ordering.',
                  options: [
                    { text: 'Equality, Sort, Range', isCorrect: true },
                    { text: 'Entity, Schema, Relation', isCorrect: false },
                    { text: 'Execution, Search, Retrieval', isCorrect: false },
                    { text: 'Embed, Shard, Replicate', isCorrect: false },
                  ],
                },
                {
                  text: 'To inspect whether a query uses an index or a collection scan, we call the _______ method on the cursor.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'The explain() method returns query plan details including winningPlan, IXSCAN, and COLLSCAN.',
                  options: [
                    { text: 'explain', isCorrect: true },
                  ],
                },
                {
                  text: 'Which aggregation pipeline stage is used to perform a left outer join to an unsharded collection?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: '$lookup performs a left outer join to another collection in the same database.',
                  options: [
                    { text: '$lookup', isCorrect: true },
                    { text: 'lookup', isCorrect: true },
                  ],
                },
                {
                  text: 'In Mongoose schemas, which option automatically adds createdAt and updatedAt fields?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Passing { timestamps: true } in the schema options creates createdAt and updatedAt fields.',
                  options: [
                    { text: '{ timestamps: true }', isCorrect: true },
                    { text: '{ autoDates: true }', isCorrect: false },
                    { text: '{ trackTime: true }', isCorrect: false },
                    { text: '{ auditTrail: true }', isCorrect: false },
                  ],
                },
                {
                  text: 'When should document referencing be prioritized over embedding?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'When parent documents reference hundreds or thousands of child items that grow unboundedly, referencing prevents reaching the 16MB document cap.',
                  options: [
                    { text: 'When child documents grow unboundedly (1:N large relationships)', isCorrect: true },
                    { text: 'When child data is small and rarely updated', isCorrect: false },
                    { text: 'When atomic single-document updates are strictly needed', isCorrect: false },
                    { text: 'When sub-millisecond read speed is the single priority', isCorrect: false },
                  ],
                },
              ],
            },
          },
          {
            title: 'Building Scalable REST APIs with Express & JWT Auth',
            description: 'Implement stateless token authentication, role-based authorization guards, and input sanitization.',
            order: 3,
            lessons: [
              {
                title: 'JWT Anatomy, Cryptographic Signing & Refresh Rotations',
                contentType: 'text',
                duration: 18,
                content: '# JSON Web Tokens\n\nA JWT consists of three base64url encoded parts: Header, Payload, and Signature.\n\n```text\nheader.payload.signature\n```\n\nAlways store refresh tokens with short expiry windows and enforce rotation.',
                order: 1,
              },
              {
                title: 'Express Middleware Pipelines & Error Interceptors',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/lY6icfhap2o',
                duration: 25,
                content: '# Express Middleware Architecture\n\nExpress middleware functions have access to the `req`, `res`, and `next` parameters. Centralized error handling middleware must define 4 arguments: `(err, req, res, next)`.',
                order: 2,
              },
              {
                title: 'Defensive Security with Helmet, Rate Limiting & Input Validation',
                contentType: 'text',
                duration: 15,
                content: '# Defensive API Hardening\n\nUse `helmet` to configure secure HTTP headers (CSP, HSTS, X-Content-Type-Options) and `express-validator` to sanitize user input against injection attacks.',
                order: 3,
              },
            ],
            quiz: {
              title: 'API Architecture & Security Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'How many parameters must an Express error-handling middleware function declare to be recognized by Express?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Express requires exactly 4 arguments: (err, req, res, next) to treat a function as an error handler.',
                  options: [
                    { text: '4 arguments (err, req, res, next)', isCorrect: true },
                    { text: '3 arguments (req, res, next)', isCorrect: false },
                    { text: '2 arguments (err, req)', isCorrect: false },
                    { text: '1 argument (err)', isCorrect: false },
                  ],
                },
                {
                  text: 'Which HTTP header is standard for transmitting a Bearer JWT token in API requests?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Authorization header holds the Bearer token string.',
                  options: [
                    { text: 'Authorization', isCorrect: true },
                    { text: 'authorization', isCorrect: true },
                  ],
                },
                {
                  text: 'What algorithm is most commonly used for symmetric HMAC secret signing in JSON Web Tokens?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'HS256 (HMAC with SHA-256) is the industry standard symmetric signing algorithm.',
                  options: [
                    { text: 'HS256', isCorrect: true },
                    { text: 'RS512', isCorrect: false },
                    { text: 'AES256', isCorrect: false },
                    { text: 'MD5', isCorrect: false },
                  ],
                },
                {
                  text: 'Why should sensitive secrets like user passwords NEVER be placed in a standard JWT payload?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'The JWT payload is only Base64URL-encoded, not encrypted; anyone who intercepts it can read its contents directly.',
                  options: [
                    { text: 'Payload is encoded in Base64URL and readable by anyone without a key', isCorrect: true },
                    { text: 'JWT payloads can only store integers', isCorrect: false },
                    { text: 'Express automatically crashes if passwords are in tokens', isCorrect: false },
                    { text: 'The payload is discarded by the browser', isCorrect: false },
                  ],
                },
                {
                  text: 'The security middleware package that sets secure HTTP response headers in Express is named _______.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Helmet is the de-facto security header middleware for Express.',
                  options: [
                    { text: 'helmet', isCorrect: true },
                  ],
                },
                {
                  text: 'Which status code should be returned when an authentication token is missing or completely invalid?',
                  type: 'mcq',
                  points: 1,
                  explanation: '401 Unauthorized indicates that the request lacks valid authentication credentials.',
                  options: [
                    { text: '401 Unauthorized', isCorrect: true },
                    { text: '403 Forbidden', isCorrect: false },
                    { text: '404 Not Found', isCorrect: false },
                    { text: '500 Server Error', isCorrect: false },
                  ],
                },
              ],
            },
          },
          {
            title: 'React State Management, Custom Hooks & Component Architecture',
            description: 'Build robust single-page applications with declarative React patterns, custom hooks, and context-driven state.',
            order: 4,
            lessons: [
              {
                title: 'The React Lifecycle, Reconciliation & Virtual DOM',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/7YhdqIR2Yzo',
                duration: 20,
                content: '# Virtual DOM & Diffing Algorithm\n\nReact uses fiber nodes to compare virtual DOM trees and apply the minimum necessary mutations to the real DOM.',
                order: 1,
              },
              {
                title: 'Custom Hooks for Reusable Data Fetching & Business Logic',
                contentType: 'text',
                duration: 15,
                content: '# Custom Hooks\n\nCustom hooks are JavaScript functions whose names start with `use` and that may call other Hooks, isolating side effects and state transitions cleanly.',
                order: 2,
              },
              {
                title: 'Context API vs External State Stores (Mastery Architecture)',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/35lXWvCuM8o',
                duration: 24,
                content: '# State Architecture\n\nEvaluate when React Context is sufficient vs when external stores are needed to prevent widespread component re-renders.',
                order: 3,
              },
            ],
            quiz: {
              title: 'React Mastery & Component Architecture Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'What rule must all custom React hook functions follow regarding their naming convention?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Custom hooks must start with the prefix "use" so React lint rules can identify them.',
                  options: [
                    { text: 'They must start with the word "use" (e.g., useAuth)', isCorrect: true },
                    { text: 'They must end with "Hook"', isCorrect: false },
                    { text: 'They must start with a capital letter', isCorrect: false },
                    { text: 'They must be declared inside an async function', isCorrect: false },
                  ],
                },
                {
                  text: 'Which React hook is used to perform side effects such as data fetching or subscriptions?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'useEffect handles side-effects in functional components.',
                  options: [
                    { text: 'useEffect', isCorrect: true },
                  ],
                },
                {
                  text: 'What does passing an empty dependency array `[]` to `useEffect` signify?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'An empty dependency array causes the effect to run exactly once when the component mounts and cleans up on unmount.',
                  options: [
                    { text: 'The effect runs only once when the component mounts', isCorrect: true },
                    { text: 'The effect runs on every single render', isCorrect: false },
                    { text: 'The effect is permanently disabled', isCorrect: false },
                    { text: 'The effect runs asynchronously in a web worker', isCorrect: false },
                  ],
                },
                {
                  text: 'Which hook should you use to memoize an expensive calculation between re-renders?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'useMemo caches the result of a calculation between renders.',
                  options: [
                    { text: 'useMemo', isCorrect: true },
                  ],
                },
                {
                  text: 'What is the primary benefit of React Virtual DOM reconciliation?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'By diffing lightweight in-memory representations, React batches and minimizes slow real DOM reflows and repaints.',
                  options: [
                    { text: 'Minimizing expensive direct DOM mutations and layout reflows', isCorrect: true },
                    { text: 'Bypassing JavaScript execution in the browser', isCorrect: false },
                    { text: 'Encrypting client state from cross-site scripts', isCorrect: false },
                    { text: 'Allowing direct database connections from React components', isCorrect: false },
                  ],
                },
                {
                  text: 'Which React hook provides access to the context values without using Consumer components?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'useContext accepts a context object and returns the current context value.',
                  options: [
                    { text: 'useContext', isCorrect: true },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Algorithmic Thinking & Mastery Problem Solving',
        slug: 'algorithmic-thinking-and-mastery-problem-solving',
        description: 'Rigorous exploration of asymptotic analysis, recursion, linear and non-linear data structures, and optimal dynamic programming solutions.',
        instructor: teacher2._id,
        category: 'Computer Science',
        level: 'beginner',
        thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc141e6c382?w=600',
        status: 'published',
        passingScore: 80,
        modules: [
          {
            title: 'Asymptotic Analysis & Big-O Computational Theory',
            description: 'Learn time and space complexity models, amortized bounds, and best/worst/average case reasoning.',
            order: 1,
            lessons: [
              {
                title: 'Order of Growth & Formal Big-O Definitions',
                contentType: 'text',
                duration: 15,
                content: '# Asymptotic Notation\n\nBig-O represents the upper bound on the growth rate of an algorithm as the input size n approaches infinity.',
                order: 1,
              },
              {
                title: 'Space Complexity & Call Stack Overhead',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/D6xkbGLQesk',
                duration: 18,
                content: '# Space Complexity Analysis\n\nUnderstand memory consumption beyond auxiliary variables, including recursive call frames and memory allocations.',
                order: 2,
              },
              {
                title: 'Amortized Analysis with Dynamic Arrays',
                contentType: 'text',
                duration: 14,
                content: '# Amortized Bounds\n\nWhile pushing to an array occasionally triggers an O(N) array resize, the amortized cost per push operation remains strictly O(1).',
                order: 3,
              },
            ],
            quiz: {
              title: 'Big-O & Asymptotic Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'What is the time complexity of searching for an element in a balanced Binary Search Tree with N nodes?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'A balanced BST halves the search space each step, yielding O(log N) time complexity.',
                  options: [
                    { text: 'O(log N)', isCorrect: true },
                    { text: 'O(1)', isCorrect: false },
                    { text: 'O(N)', isCorrect: false },
                    { text: 'O(N log N)', isCorrect: false },
                  ],
                },
                {
                  text: 'What is the average time complexity of accessing an element in an array by its index?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Array index lookups are direct memory offsets, requiring constant O(1) time.',
                  options: [
                    { text: 'O(1)', isCorrect: true },
                    { text: '1', isCorrect: true },
                    { text: 'O(log n)', isCorrect: false },
                  ],
                },
                {
                  text: 'Which asymptotic notation describes a strict lower bound on algorithm runtime?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Big-Omega (Ω) denotes the asymptotic lower bound.',
                  options: [
                    { text: 'Big-Omega (Ω)', isCorrect: true },
                    { text: 'Big-O (O)', isCorrect: false },
                    { text: 'Big-Theta (Θ)', isCorrect: false },
                    { text: 'Little-o', isCorrect: false },
                  ],
                },
                {
                  text: 'What is the worst-case time complexity of standard Bubble Sort on an array of size N?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Bubble sort compares every adjacent pair, taking O(N^2) quadratic time.',
                  options: [
                    { text: 'O(N^2)', isCorrect: true },
                    { text: 'O(n^2)', isCorrect: true },
                    { text: 'O(N*N)', isCorrect: true },
                  ],
                },
                {
                  text: 'Why does inserting into an end of a dynamic array have an amortized time complexity of O(1)?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Doubling the array capacity occurs infrequently enough that doubling costs are distributed across many O(1) insertions.',
                  options: [
                    { text: 'Expensive resizes happen exponentially less frequently as capacity doubles', isCorrect: true },
                    { text: 'Operating systems reserve unlimited contiguous memory', isCorrect: false },
                    { text: 'Compilers convert arrays into linked lists automatically', isCorrect: false },
                    { text: 'It requires zero CPU cycles', isCorrect: false },
                  ],
                },
                {
                  text: 'If an algorithm contains two nested loops each running from 1 to N, its time complexity is _______ (e.g. O(N^2)).',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Two nested loops over N elements result in N * N = O(N^2).',
                  options: [
                    { text: 'O(N^2)', isCorrect: true },
                    { text: 'O(n^2)', isCorrect: true },
                  ],
                },
              ],
            },
          },
          {
            title: 'Linear Data Structures: Stacks, Queues & Linked Lists',
            description: 'Design memory-efficient lists, LIFO and FIFO primitives, and understand pointer manipulation.',
            order: 2,
            lessons: [
              {
                title: 'Singly vs Doubly Linked Lists & Sentinel Nodes',
                contentType: 'text',
                duration: 16,
                content: '# Linked Lists\n\nLinked lists allow O(1) insertions and deletions given an iterator pointer, with no contiguous memory requirement.',
                order: 1,
              },
              {
                title: 'Stack Applications: Parsing Expressions & Call Stack Simulation',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/F1F2imiOJfk',
                duration: 20,
                content: '# Stacks & Evaluators\n\nExplore how monotonic stacks and parenthesis validators use Last-In-First-Out semantics to solve matching problems in linear time.',
                order: 2,
              },
            ],
            quiz: {
              title: 'Linear Structures Mastery Checkpoint',
              passingPercentage: 80,
              questions: [
                {
                  text: 'Which data structure follows the Last-In, First-Out (LIFO) access pattern?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Stacks operate under LIFO semantics.',
                  options: [
                    { text: 'Stack', isCorrect: true },
                    { text: 'Queue', isCorrect: false },
                    { text: 'Binary Tree', isCorrect: false },
                    { text: 'Hash Table', isCorrect: false },
                  ],
                },
                {
                  text: 'What data structure is typically used to implement Breadth-First Search (BFS) graph traversal?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'A queue maintains nodes in the order they were discovered for BFS.',
                  options: [
                    { text: 'Queue', isCorrect: true },
                    { text: 'queue', isCorrect: true },
                  ],
                },
                {
                  text: 'What is the time complexity of deleting the head element in a non-empty Singly Linked List?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Updating the head pointer to head.next requires only O(1) constant time.',
                  options: [
                    { text: 'O(1)', isCorrect: true },
                    { text: 'O(N)', isCorrect: false },
                    { text: 'O(log N)', isCorrect: false },
                    { text: 'O(N^2)', isCorrect: false },
                  ],
                },
                {
                  text: 'A double-ended queue that allows insertion and removal at both ends is commonly called a _______.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Deque (double-ended queue) supports O(1) push and pop from both ends.',
                  options: [
                    { text: 'deque', isCorrect: true },
                    { text: 'Deque', isCorrect: true },
                  ],
                },
                {
                  text: 'Which technique is ideal for detecting a cycle in a linked list with O(1) memory?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Floyd\'s Tortoise and Hare algorithm uses two pointers moving at different speeds to detect cycles in O(1) space.',
                  options: [
                    { text: "Floyd's Tortoise and Hare (Two-Pointer Cycle Detection)", isCorrect: true },
                    { text: 'Binary Search', isCorrect: false },
                    { text: 'Recursion with Memoization', isCorrect: false },
                    { text: 'Quickselect', isCorrect: false },
                  ],
                },
                {
                  text: 'What condition causes a circular queue with fixed array buffer to become full?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'When (rear + 1) % capacity equals the front index, the buffer has reached maximum capacity.',
                  options: [
                    { text: '(rear + 1) % capacity === front', isCorrect: true },
                    { text: 'front === 0', isCorrect: false },
                    { text: 'rear === capacity', isCorrect: false },
                    { text: 'front === rear', isCorrect: false },
                  ],
                },
              ],
            },
          },
          {
            title: 'Divide & Conquer, Recursion & Sorting In-Depth',
            description: 'Master recurrence relations, Merge Sort, Quick Sort invariants, and binary search edge cases.',
            order: 3,
            lessons: [
              {
                title: 'The Master Theorem for Divide-and-Conquer Recurrences',
                contentType: 'text',
                duration: 18,
                content: '# Master Theorem\n\nT(n) = aT(n/b) + f(n). Compare f(n) with n^(log_b(a)) to derive closed-form asymptotic solutions immediately.',
                order: 1,
              },
              {
                title: 'Quick Sort: Hoare vs Lomuto Partitioning Invariants',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/Hoixgm4-P4M',
                duration: 22,
                content: '# Partitioning Invariants\n\nStudy why Hoare partitioning performs 3x fewer swaps on average compared to Lomuto partitioning schemes.',
                order: 2,
              },
              {
                title: 'Merge Sort: Stability, Inversions & Out-of-Core Processing',
                contentType: 'text',
                duration: 16,
                content: '# Stable Sorting\n\nMerge Sort guarantees O(N log N) runtime in all cases and preserves the relative order of duplicate keys (stability).',
                order: 3,
              },
            ],
            quiz: {
              title: 'Divide & Conquer Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'What is the guaranteed worst-case time complexity of Merge Sort on an array of size N?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Merge sort always divides the array evenly and takes O(N) to merge, guaranteeing O(N log N).',
                  options: [
                    { text: 'O(N log N)', isCorrect: true },
                    { text: 'O(N^2)', isCorrect: false },
                    { text: 'O(N)', isCorrect: false },
                    { text: 'O(log N)', isCorrect: false },
                  ],
                },
                {
                  text: 'A sorting algorithm that preserves the original relative order of elements with equal keys is described as _______.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'A stable sorting algorithm preserves the relative order of identical elements.',
                  options: [
                    { text: 'stable', isCorrect: true },
                    { text: 'Stable', isCorrect: true },
                  ],
                },
                {
                  text: 'What is the worst-case time complexity of Quick Sort when selecting an extremal pivot on already sorted data?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'When the partition is maximally unbalanced (0 and N-1 elements), Quick Sort degrades to quadratic O(N^2) time.',
                  options: [
                    { text: 'O(N^2)', isCorrect: true },
                    { text: 'O(N log N)', isCorrect: false },
                    { text: 'O(N)', isCorrect: false },
                    { text: 'O(1)', isCorrect: false },
                  ],
                },
                {
                  text: 'Which sorting algorithm achieves O(N log N) worst-case time while operating in-place with O(1) auxiliary space?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Heap Sort achieves O(N log N) worst-case without requiring additional array allocations.',
                  options: [
                    { text: 'Heap Sort', isCorrect: true },
                    { text: 'Merge Sort', isCorrect: false },
                    { text: 'Counting Sort', isCorrect: false },
                    { text: 'Radix Sort', isCorrect: false },
                  ],
                },
                {
                  text: 'What mathematical theorem provides a cookbook method for solving recurrences of the form T(n) = aT(n/b) + f(n)?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'The Master Theorem solves divide-and-conquer recurrence relations.',
                  options: [
                    { text: 'Master Theorem', isCorrect: true },
                    { text: 'master theorem', isCorrect: true },
                    { text: 'Master theorem', isCorrect: true },
                  ],
                },
                {
                  text: 'What is the minimum number of comparisons required to find both the minimum and maximum of an unsorted array of N elements?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'By comparing elements in pairs first, we can find both min and max in 3n/2 - 2 comparisons.',
                  options: [
                    { text: '3n/2 - 2 comparisons', isCorrect: true },
                    { text: '2n comparisons', isCorrect: false },
                    { text: 'n comparisons', isCorrect: false },
                    { text: 'n log n comparisons', isCorrect: false },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        title: 'Cloud Computing, DevOps & Microservices Architecture',
        slug: 'cloud-computing-devops-and-microservices-architecture',
        description: 'Industrial-grade guide to containerization, Kubernetes orchestrations, automated CI/CD pipelines, and high-reliability distributed systems.',
        instructor: teacher1._id,
        category: 'Cloud & DevOps',
        level: 'advanced',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
        status: 'published',
        passingScore: 80,
        modules: [
          {
            title: 'Docker Containers, Multi-Stage Builds & Isolation',
            description: 'Dive into Linux namespaces, cgroups, layered union filesystems, and production image slimming.',
            order: 1,
            lessons: [
              {
                title: 'Namespaces & Control Groups: How Containers Actually Work',
                contentType: 'text',
                duration: 18,
                content: '# Linux Namespaces & CGroups\n\nContainers are not lightweight virtual machines; they are isolated Linux processes running on the host kernel using PID, NET, MNT, and IPC namespaces.',
                order: 1,
              },
              {
                title: 'Multi-Stage Dockerfiles for 90% Smaller Artifacts',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/wGzTki5Cg2g',
                duration: 22,
                content: '# Multi-Stage Docker Builds\n\nSeparate your build environment (Node SDK, dev dependencies, compilers) from the slim runtime Alpine environment to minimize attack surface and image size.',
                order: 2,
              },
              {
                title: 'Docker Compose for Local Microservice Orchestration',
                contentType: 'text',
                duration: 15,
                content: '# Multi-Container Networks\n\nDefine networks, volume mounts, and service health checks declaratively in `docker-compose.yml`.',
                order: 3,
              },
            ],
            quiz: {
              title: 'Containerization Mastery Checkpoint',
              passingPercentage: 80,
              questions: [
                {
                  text: 'Which underlying Linux kernel mechanism restricts and meters CPU, memory, and disk I/O for container processes?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'cgroups (control groups) manage and allocate hardware resource limits to processes.',
                  options: [
                    { text: 'Control Groups (cgroups)', isCorrect: true },
                    { text: 'Namespaces', isCorrect: false },
                    { text: 'SELinux', isCorrect: false },
                    { text: 'AppArmor', isCorrect: false },
                  ],
                },
                {
                  text: 'The Linux kernel feature that isolates process views (such as process trees and network devices) is called _______.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'Namespaces isolate system resources per container.',
                  options: [
                    { text: 'namespaces', isCorrect: true },
                    { text: 'Namespaces', isCorrect: true },
                  ],
                },
                {
                  text: 'Why are multi-stage Docker builds recommended for production web applications?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Multi-stage builds exclude compilers, source files, and devDependencies from final images, drastically reducing size and CVE vulnerabilities.',
                  options: [
                    { text: 'They strip build dependencies, minimizing image size and attack surface', isCorrect: true },
                    { text: 'They eliminate the need for a Docker daemon', isCorrect: false },
                    { text: 'They allow running Windows containers directly on Linux kernels', isCorrect: false },
                    { text: 'They automatically encrypt container memory', isCorrect: false },
                  ],
                },
                {
                  text: 'In a Dockerfile, which instruction specifies the executable that always runs when the container starts?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'ENTRYPOINT sets the default command and parameters.',
                  options: [
                    { text: 'ENTRYPOINT', isCorrect: true },
                    { text: 'entrypoint', isCorrect: true },
                  ],
                },
                {
                  text: 'What happens to data written inside a container writable layer when the container is deleted without a volume mount?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Container layers are ephemeral; without persistent volumes, all non-persisted modifications are permanently lost.',
                  options: [
                    { text: 'The data is permanently lost with the container', isCorrect: true },
                    { text: 'The data is saved to /tmp on the host automatically', isCorrect: false },
                    { text: 'The data is committed to a new Docker image', isCorrect: false },
                    { text: 'The data is synced to cloud storage', isCorrect: false },
                  ],
                },
                {
                  text: 'Which signal does Docker send by default to initiate graceful shutdown before forcing SIGKILL?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'SIGTERM is sent first to give processes time to gracefully stop.',
                  options: [
                    { text: 'SIGTERM', isCorrect: true },
                    { text: 'sigterm', isCorrect: true },
                  ],
                },
              ],
            },
          },
          {
            title: 'Kubernetes Cluster Architecture, Pods & Deployments',
            description: 'Master the Control Plane, kubelet, etcd, Pod lifecycles, Services, and Declarative manifests.',
            order: 2,
            lessons: [
              {
                title: 'The Kubernetes Control Plane: API Server, etcd, and Schedulers',
                contentType: 'text',
                duration: 20,
                content: '# Kubernetes Control Plane\n\nThe API Server acts as the central gateway. `etcd` maintains consistent cluster state as a distributed key-value store using Raft consensus.',
                order: 1,
              },
              {
                title: 'Pods, ReplicaSets and Zero-Downtime Rolling Updates',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/X48VuDVv0do',
                duration: 24,
                content: '# Deployments & Pods\n\nDeployments manage ReplicaSets, allowing declarative rolling updates with `maxSurge` and `maxUnavailable` settings to achieve zero downtime.',
                order: 2,
              },
              {
                title: 'Services, Ingress Controllers and Cluster Networking (CNI)',
                contentType: 'text',
                duration: 18,
                content: '# Cluster Networking\n\nExplore ClusterIP, NodePort, and LoadBalancer services along with Ingress Controllers routing external traffic to internal services.',
                order: 3,
              },
            ],
            quiz: {
              title: 'Kubernetes Architecture Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'Which Kubernetes component acts as the consistent and highly-available key-value store for all cluster data?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'etcd is the distributed key-value store holding the complete state of the Kubernetes cluster.',
                  options: [
                    { text: 'etcd', isCorrect: true },
                    { text: 'kube-scheduler', isCorrect: false },
                    { text: 'kubelet', isCorrect: false },
                    { text: 'CoreDNS', isCorrect: false },
                  ],
                },
                {
                  text: 'What is the smallest deployable computing unit that you can create and manage in Kubernetes?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'A Pod is the smallest execution unit in Kubernetes.',
                  options: [
                    { text: 'Pod', isCorrect: true },
                    { text: 'pod', isCorrect: true },
                  ],
                },
                {
                  text: 'Which Kubernetes Service type creates an external cloud load balancer and assigns a public IP address?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Type LoadBalancer provisions a cloud provider load balancer routing directly into the cluster.',
                  options: [
                    { text: 'LoadBalancer', isCorrect: true },
                    { text: 'ClusterIP', isCorrect: false },
                    { text: 'NodePort', isCorrect: false },
                    { text: 'ExternalName', isCorrect: false },
                  ],
                },
                {
                  text: 'The command-line tool used to communicate with the Kubernetes API server is named _______.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'kubectl is the official CLI tool for Kubernetes.',
                  options: [
                    { text: 'kubectl', isCorrect: true },
                  ],
                },
                {
                  text: 'What probe does Kubernetes use to determine whether a container is ready to start accepting network traffic?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'The readinessProbe indicates whether an application is initialized and capable of receiving traffic.',
                  options: [
                    { text: 'readinessProbe', isCorrect: true },
                    { text: 'livenessProbe', isCorrect: false },
                    { text: 'startupProbe', isCorrect: false },
                    { text: 'healthProbe', isCorrect: false },
                  ],
                },
                {
                  text: 'What happens when a livenessProbe consistently fails on a container?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'When a liveness probe fails, kubelet kills the container and initiates its restartPolicy.',
                  options: [
                    { text: 'Kubelet terminates the container and restarts it according to policy', isCorrect: true },
                    { text: 'Traffic is simply stopped without restarting the container', isCorrect: false },
                    { text: 'The entire worker node is rebooted', isCorrect: false },
                    { text: 'A new pod is spawned on another node while the broken one stays running', isCorrect: false },
                  ],
                },
              ],
            },
          },
          {
            title: 'CI/CD Pipelines, Zero-Downtime Releases & GitOps',
            description: 'Automate build, test, security scans, and progressive rollouts via ArgoCD and GitHub Actions.',
            order: 3,
            lessons: [
              {
                title: 'GitHub Actions: Matrix Testing & Automated Image Push',
                contentType: 'text',
                duration: 16,
                content: '# Continuous Integration\n\nBuild automated verification matrices testing your services across multiple Node versions and architectures before triggering container builds.',
                order: 1,
              },
              {
                title: 'Canary Deployments & Blue-Green Traffic Shifting',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/skmsMqiDpsE',
                duration: 20,
                content: '# Advanced Deployment Strategies\n\nRoute 5% of production traffic to canary replicas to observe error budgets and p99 latencies before full rollout.',
                order: 2,
              },
            ],
            quiz: {
              title: 'CI/CD & Release Engineering Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'Which deployment strategy provisions two identical environments and flips the router switch to redirect 100% of traffic instantaneously?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Blue-Green deployments maintain two identical environments, switching production router pointers for instantaneous release and instant rollback.',
                  options: [
                    { text: 'Blue-Green Deployment', isCorrect: true },
                    { text: 'Canary Deployment', isCorrect: false },
                    { text: 'Rolling Update', isCorrect: false },
                    { text: 'Recreate Deployment', isCorrect: false },
                  ],
                },
                {
                  text: 'The operational methodology that treats Git repositories as the single source of truth for declarative infrastructure is named _______.',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'GitOps uses Git as the declarative single source of truth.',
                  options: [
                    { text: 'GitOps', isCorrect: true },
                    { text: 'gitops', isCorrect: true },
                  ],
                },
                {
                  text: 'What is the primary risk of an in-place "Recreate" deployment strategy in production?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Recreate kills all existing instances before starting new ones, causing user-facing downtime.',
                  options: [
                    { text: 'Service downtime while all old pods terminate before new pods start', isCorrect: true },
                    { text: 'Double cloud hosting costs', isCorrect: false },
                    { text: 'Database corruption from concurrent connections', isCorrect: false },
                    { text: 'Inability to test with unit tests', isCorrect: false },
                  ],
                },
                {
                  text: 'In Canary deployments, what is typically shifted gradually to the new release version?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Canary releases shift a small percentage of live user traffic to monitor performance before full rollout.',
                  options: [
                    { text: 'A small percentage of production network traffic', isCorrect: true },
                    { text: 'The entire database cluster', isCorrect: false },
                    { text: 'The root DNS name servers', isCorrect: false },
                    { text: 'All Git branches', isCorrect: false },
                  ],
                },
                {
                  text: 'The declarative continuous delivery tool built natively for Kubernetes GitOps is named _______ (e.g. ArgoCD).',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'ArgoCD is the premier declarative GitOps continuous delivery tool for Kubernetes.',
                  options: [
                    { text: 'ArgoCD', isCorrect: true },
                    { text: 'argocd', isCorrect: true },
                    { text: 'Argo CD', isCorrect: true },
                  ],
                },
              ],
            },
          },
          {
            title: 'Observability, Distributed Tracing & Site Reliability Engineering',
            description: 'Implement Prometheus metrics, OpenTelemetry traces, structured JSON logging, and SLA/SLO alerts.',
            order: 4,
            lessons: [
              {
                title: 'The Three Pillars of Observability: Metrics, Traces & Logs',
                contentType: 'text',
                duration: 17,
                content: '# The Three Pillars\n\nMetrics quantify aggregate trends over time (gauges, counters, histograms). Traces track causal request journeys across network boundaries. Logs record contextual discrete events.',
                order: 1,
              },
              {
                title: 'Distributed Tracing with OpenTelemetry & Jaeger',
                contentType: 'video',
                videoUrl: 'https://www.youtube.com/embed/qYX75f8wQ1w',
                duration: 21,
                content: '# OpenTelemetry\n\nPropagate W3C TraceContext headers across microservice hops to correlate latency bottlenecks and database queries.',
                order: 2,
              },
              {
                title: 'SLIs, SLOs and Error Budgets for Resilient Engineering',
                contentType: 'text',
                duration: 15,
                content: '# Site Reliability Engineering\n\nDefine Service Level Indicators (SLI) such as percentage of requests faster than 200ms, and set Service Level Objectives (SLO) such as 99.9% uptime with calculated error budgets.',
                order: 3,
              },
            ],
            quiz: {
              title: 'Observability & SRE Mastery Quiz',
              passingPercentage: 80,
              questions: [
                {
                  text: 'What are the three canonical pillars of system observability?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'Metrics, Logs, and Traces constitute the three pillars of modern cloud observability.',
                  options: [
                    { text: 'Metrics, Logs, and Traces', isCorrect: true },
                    { text: 'CPU, RAM, and Disk', isCorrect: false },
                    { text: 'Build, Test, and Deploy', isCorrect: false },
                    { text: 'Security, Speed, and Stability', isCorrect: false },
                  ],
                },
                {
                  text: 'What does SLO stand for in Site Reliability Engineering?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'SLO stands for Service Level Objective.',
                  options: [
                    { text: 'Service Level Objective', isCorrect: true },
                    { text: 'Server Load Optimization', isCorrect: false },
                    { text: 'System Latency Overhead', isCorrect: false },
                    { text: 'Standard Logging Operation', isCorrect: false },
                  ],
                },
                {
                  text: 'The open standard framework providing vendor-neutral APIs and SDKs to instrument telemetry is named _______ (OpenTelemetry).',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'OpenTelemetry (OTel) is the CNCF open standard for telemetry instrumentation.',
                  options: [
                    { text: 'OpenTelemetry', isCorrect: true },
                    { text: 'opentelemetry', isCorrect: true },
                  ],
                },
                {
                  text: 'What is an Error Budget in SRE methodology?',
                  type: 'mcq',
                  points: 1,
                  explanation: 'An Error Budget is the allowable room for unreliability (100% minus SLO percentage) that product teams can spend on risky new feature deployments.',
                  options: [
                    { text: 'The allowable room for failure defined as 100% minus the SLO percentage', isCorrect: true },
                    { text: 'The financial budget allocated to pay for bug bounties', isCorrect: false },
                    { text: 'The maximum number of developer tickets in Jira', isCorrect: false },
                    { text: 'The server cost incurred when outages occur', isCorrect: false },
                  ],
                },
                {
                  text: 'Which Prometheus metric type represents a monotonically increasing counter that only ever goes up or resets to zero on restart?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'A Counter metric in Prometheus strictly increments.',
                  options: [
                    { text: 'Counter', isCorrect: true },
                    { text: 'counter', isCorrect: true },
                  ],
                },
                {
                  text: 'In distributed tracing, what term describes an individual unit of work or timed execution segment within a trace?',
                  type: 'fill-blank',
                  points: 1,
                  explanation: 'A Span represents an individual segment of execution in a trace tree.',
                  options: [
                    { text: 'Span', isCorrect: true },
                    { text: 'span', isCorrect: true },
                  ],
                },
              ],
            },
          },
        ],
      },
    ];

    const createdCourses = [];
    const allQuizzes = [];
    const allLessons = [];

    for (const c of courseData) {
      const course = await Course.create({
        title: c.title,
        slug: c.slug,
        description: c.description,
        instructor: c.instructor,
        category: c.category,
        level: c.level,
        thumbnail: c.thumbnail,
        status: c.status,
        passingScore: c.passingScore,
      });

      createdCourses.push(course);

      for (const m of c.modules) {
        const module = await Module.create({
          course: course._id,
          title: m.title,
          description: m.description,
          order: m.order,
          status: 'published',
        });

        // Seed Lessons
        for (const l of m.lessons) {
          const lesson = await Lesson.create({
            course: course._id,
            module: module._id,
            title: l.title,
            contentType: l.contentType,
            videoUrl: l.videoUrl || '',
            duration: l.duration,
            content: l.content,
            order: l.order,
          });
          allLessons.push(lesson);
        }

        // Seed Quiz
        const quiz = await Quiz.create({
          course: course._id,
          module: module._id,
          title: m.quiz.title,
          passingPercentage: m.quiz.passingPercentage,
          status: 'published',
          order: 1,
        });

        allQuizzes.push({ quiz, course, module });

        // Seed Questions and AnswerOptions
        for (let qIdx = 0; qIdx < m.quiz.questions.length; qIdx++) {
          const qData = m.quiz.questions[qIdx];
          const question = await Question.create({
            quiz: quiz._id,
            questionText: qData.text,
            questionType: qData.type,
            points: qData.points,
            explanation: qData.explanation,
            order: qIdx + 1,
          });

          for (let oIdx = 0; oIdx < qData.options.length; oIdx++) {
            const opt = qData.options[oIdx];
            await AnswerOption.create({
              question: question._id,
              optionText: opt.text,
              isCorrect: opt.isCorrect,
              order: oIdx + 1,
            });
          }
        }
      }
    }

    console.log(`Seeded ${createdCourses.length} courses with all modules, lessons, quizzes, questions, and answer options.`);

    // 6. Seed Realistic Student Enrollments, Progress, Quiz Attempts, and Achievements
    console.log('--- Seeding Student Enrollments, Progress, and Mastery Attempts ---');

    for (let sIdx = 0; sIdx < students.length; sIdx++) {
      const student = students[sIdx];

      // Enroll in Course 1 and Course 2
      const enrolledCourses = [createdCourses[0], createdCourses[1]];
      if (sIdx % 2 === 0) {
        enrolledCourses.push(createdCourses[2]); // Half enroll in Course 3 as well
      }

      for (const enrolledCourse of enrolledCourses) {
        const enrollment = await CourseEnrollment.create({
          user: student._id,
          course: enrolledCourse._id,
          status: sIdx % 4 === 0 ? 'completed' : 'active',
          progressPercentage: sIdx % 4 === 0 ? 100 : Math.min(95, (sIdx + 1) * 6),
          enrolledAt: new Date(Date.now() - (30 - sIdx) * 86400000),
          completedAt: sIdx % 4 === 0 ? new Date() : null,
        });

        // Mark some lessons completed
        const courseLessons = allLessons.filter(
          (l) => l.course.toString() === enrolledCourse._id.toString()
        );
        const completedCount = Math.floor((courseLessons.length * enrollment.progressPercentage) / 100);

        for (let lIdx = 0; lIdx < completedCount; lIdx++) {
          const targetLesson = courseLessons[lIdx];
          await LessonProgress.create({
            user: student._id,
            course: enrolledCourse._id,
            module: targetLesson.module,
            lesson: targetLesson._id,
            status: 'completed',
            completedAt: new Date(Date.now() - (20 - lIdx) * 86400000),
            timeSpent: targetLesson.duration * 60,
          });
        }

        // Create Quiz Attempts for the modules in this course
        const courseQuizzes = allQuizzes.filter(
          (q) => q.course._id.toString() === enrolledCourse._id.toString()
        );

        for (let qIdx = 0; qIdx < Math.min(courseQuizzes.length, Math.ceil(completedCount / 3)); qIdx++) {
          const { quiz, module } = courseQuizzes[qIdx];
          const questions = await Question.find({ quiz: quiz._id });
          const isHighPerformer = sIdx % 3 === 0;
          const scorePercent = isHighPerformer ? (sIdx % 6 === 0 ? 100 : 88) : 65;
          const passed = scorePercent >= quiz.passingPercentage;
          const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
          const score = Math.round((scorePercent / 100) * totalPoints);

          const attempt = await QuizAttempt.create({
            user: student._id,
            quiz: quiz._id,
            module: module._id,
            course: enrolledCourse._id,
            attemptNumber: 1,
            score,
            totalPoints,
            percentage: scorePercent,
            status: passed ? 'passed' : 'failed',
            passed,
            startedAt: new Date(Date.now() - 3600000 * 2),
            completedAt: new Date(Date.now() - 3600000 * 1.8),
            timeSpent: 120 + sIdx * 10,
          });

          // Create AttemptAnswers
          for (const question of questions) {
            const options = await AnswerOption.find({ question: question._id });
            const correctOpt = options.find((o) => o.isCorrect);
            const wrongOpt = options.find((o) => !o.isCorrect) || options[0];
            const answerCorrect = passed || Math.random() > 0.4;

            await AttemptAnswer.create({
              quizAttempt: attempt._id,
              question: question._id,
              selectedOption: question.questionType === 'mcq' ? (answerCorrect ? correctOpt?._id : wrongOpt?._id) : null,
              textAnswer: question.questionType === 'fill-blank' ? (answerCorrect ? correctOpt?.optionText || '' : 'incorrect') : '',
              isCorrect: answerCorrect,
              pointsAwarded: answerCorrect ? question.points : 0,
            });
          }

          // If passed, unlock First Quiz Passed achievement
          if (passed) {
            const firstQuizAch = achievements.find((a) => a.slug === 'first-quiz-passed');
            if (firstQuizAch) {
              await UserAchievement.findOneAndUpdate(
                { user: student._id, achievement: firstQuizAch._id },
                { user: student._id, achievement: firstQuizAch._id, earnedAt: new Date(), course: enrolledCourse._id },
                { upsert: true }
              );
            }
          }

          // If 100%, unlock Score 100%
          if (scorePercent === 100) {
            const perfectScoreAch = achievements.find((a) => a.slug === 'score-100');
            if (perfectScoreAch) {
              await UserAchievement.findOneAndUpdate(
                { user: student._id, achievement: perfectScoreAch._id },
                { user: student._id, achievement: perfectScoreAch._id, earnedAt: new Date(), course: enrolledCourse._id },
                { upsert: true }
              );
            }
          }
        }
      }

      // Check for streak achievement
      if (studentData[sIdx].streak >= 5) {
        const streakAch = achievements.find((a) => a.slug === '5-day-streak');
        if (streakAch) {
          await UserAchievement.findOneAndUpdate(
            { user: student._id, achievement: streakAch._id },
            { user: student._id, achievement: streakAch._id, earnedAt: new Date() },
            { upsert: true }
          );
        }
      }
    }

    console.log('Seeded realistic enrollments, lesson progress, attempts, answers, and user achievements.');

    console.log('\n=============================================');
    console.log('       LEARNITICS SEEDING COMPLETED          ');
    console.log('=============================================');
    console.log(`- 1 Admin User: admin@learnitics.com (Pass: AdminPass123!)`);
    console.log(`- 2 Teachers: teacher@learnitics.com, ada.lovelace@learnitics.edu (Pass: TeacherPass123!)`);
    console.log(`- 16 Students: student@learnitics.com ... priya@learnitics.edu (Pass: StudentPass123!)`);
    console.log(`- 3 Courses, 11 Modules, 30 Lessons, 11 Quizzes, 67 Questions, 240+ Options`);
    console.log(`- 8 System Achievement Definitions + unlocked student badges`);
    console.log('=============================================\n');

    if (require.main === module) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      console.error('\n❌ Could not connect to MongoDB at ' + MONGO_URI);
      console.error('\nReason: MongoDB is not running on your local machine (port 27017).\n');
      console.error('Quick Fix Options:');
      console.error('  1. Use free MongoDB Atlas (Cloud Database — Recommended):');
      console.error('     - Create a free database at https://www.mongodb.com/atlas');
      console.error('     - Add your connection string to server/.env:');
      console.error('       MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/learnitics\n');
      console.error('  2. If using local MongoDB on Windows:');
      console.error('     - Install MongoDB Community Server: https://www.mongodb.com/try/download/community');
      console.error('     - Start the Windows Service: net start MongoDB\n');
    } else {
      console.error('Seeding error:', error);
    }
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

