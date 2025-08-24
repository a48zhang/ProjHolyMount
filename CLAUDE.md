# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**英语学习平台 (English Learning Platform)** - A Next.js 15 application deployed on Cloudflare Workers with D1 database, featuring exam management, question banks, and student assessment.

## Architecture & Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS 4, Ant Design 5
- **Backend**: Cloudflare Workers (open-nextjs-cloudflare), D1 SQLite database
- **Authentication**: JWT tokens stored in localStorage, bcrypt for password hashing
- **Testing**: Tape.js for unit tests, c8 for coverage
- **Deployment**: Cloudflare Workers via open-nextjs-cloudflare

## Key Domain Concepts

### User Roles & Permissions
- **student**: Can take assigned exams, view results, access public exams
- **teacher**: Can create/manage exams and questions, grade submissions
- **admin**: Full access to all functionality including user management

### Exam Lifecycle
1. **Draft** → **Published** → **Closed** (status flow)
2. **Assignment**: Teachers assign exams to specific students
3. **Taking**: Students start exams within time windows
4. **Submission**: Auto-scored + manual grading for open-ended questions
5. **Results**: Students view scores and feedback

### Data Model
- **Users** (authentication, roles via user_roles table)
- **Questions** (JSON content, answer keys, rubrics)
- **Exams** (collections of questions with metadata)
- **Submissions** (student attempts with answers and scores)
- **Exam Assignments** (teacher → student mappings)

## Development Commands

### Core Commands
```bash
# Development server
npm run dev                    # Next.js dev server with turbopack

# Testing
npm run test:unit             # Run all unit tests
npm run test:frontend         # Run frontend-specific tests
npm run test:lib              # Run library utility tests
npm run coverage              # Generate coverage report

# Database
npm run db-reset              # Reset local D1 database with schema
npm run cf-typegen            # Generate Cloudflare types

# Deployment
npm run build                 # Build for production
npm run preview               # Preview on Cloudflare
npm run deploy                # Deploy to Cloudflare Workers

# Code quality
npm run lint                  # Run ESLint
npm run typecheck             # Type checking
```

### Single Test Commands
```bash
# Run specific test file
npm test -- tests/unit/api/exams_paper.test.ts
npm test -- tests/unit/frontend/utils/validation.test.ts

# Run test category
npm test -- tests/unit/api/          # All API tests
npm test -- tests/unit/frontend/     # All frontend tests
```

## API Structure

### RESTful API Routes
All routes follow `/api/[resource]/[id]/[action]` pattern:

**Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

**Exams**
- `GET /api/exams` - List exams (role-based filtering)
- `POST /api/exams` - Create new exam
- `GET /api/exams/[id]/paper` - Get exam questions for taking
- `POST /api/exams/[id]/start` - Start exam session
- `POST /api/exams/[id]/close` - Close exam
- `POST /api/exams/[id]/publish` - Publish exam

**Questions**
- `GET /api/questions` - List questions (author-filtered)
- `POST /api/questions` - Create question
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Delete question

**Submissions**
- `POST /api/submissions/[id]/submit` - Submit answers
- `GET /api/submissions/[id]/answers` - Get submission details
- `POST /api/submissions/[id]/score` - Grade submission (teacher)

### Authentication Context
All protected API routes use `getAuthContext()` which provides:
- `userId`, `username`, `email` - Basic user info
- `role` - 'student' | 'teacher' | 'admin'
- `plan` - 'free' | 'premium' (access control)
- `grade_level` - Student grade level filtering
- `env` - Cloudflare environment (DB, JWT_SECRET)

## File Structure

```
app/                          # Next.js App Router
├── api/                      # API routes (Cloudflare Workers)
│   ├── auth/                # Authentication endpoints
│   ├── exams/               # Exam management
│   ├── questions/           # Question bank
│   └── submissions/         # Student submissions
├── teacher/                 # Teacher dashboard pages
├── exams/                   # Student exam pages
├── practice/                # Practice mode
└── results/                 # Exam results

lib/                         # Shared utilities
├── auth.ts                  # Authentication helpers
├── http.ts                  # HTTP client utilities
├── logger.ts                # API logging
└── sanitize.ts              # HTML sanitization

tests/                       # Test suite
├── unit/api/               # API endpoint tests
├── unit/frontend/          # Frontend component tests
└── run.ts                  # Test runner
```

## Testing Strategy

### Test Categories
- **Unit Tests**: 180+ test cases across 25 files
- **API Tests**: Full CRUD testing for all endpoints
- **Frontend Tests**: Component rendering, utility functions
- **Coverage**: 85%+ frontend, 90%+ backend

### Test Patterns
- Use `tape` for assertions
- Mock Cloudflare context with test database
- Test both success and error paths
- Boundary testing for all validation rules

### Running Tests
```bash
# Development workflow
npm run typecheck && npm run lint && npm run test:unit

# Before commit
npm run ci  # Runs coverage + all tests
```

## Common Development Tasks

### Adding New API Endpoint
1. Create route file in `app/api/[resource]/[action]/route.ts`
2. Use `getAuthContext()` for authentication
3. Add validation and error handling
4. Write tests in `tests/unit/api/`
5. Update frontend components if needed

### Database Changes
1. Update `schema.sql` for schema changes
2. Run `npm run db-reset` to apply locally
3. Update wrangler.toml for production D1 binding
4. Test with both local and remote databases

### Frontend Components
- Use Ant Design components consistently
- Follow existing patterns in `components/` directory
- Add Suspense boundaries for async data loading
- Implement proper loading states

## Environment Setup

### Local Development
```bash
# Install dependencies
npm install

# Set up local D1 database
npm run db-reset

# Start development server
npm run dev
```

### Required Environment Variables
- `JWT_SECRET` - JWT signing key (set in Cloudflare dashboard)
- Database bindings configured in `wrangler.jsonc`

## Deployment Notes

### Cloudflare Configuration
- Uses D1 database binding: `DB`
- Static assets served via Cloudflare Workers
- Environment variables managed via Cloudflare dashboard
- Deploy with: `npm run deploy`

### Production Considerations
- All API routes automatically logged via `withApiLogging`
- Error handling includes 5xx error logging to `api_error_logs` table
- Rate limiting handled by Cloudflare Workers platform