# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Shiksha-Connect** is an AI-powered school attendance management system built for Indian educational institutions. The system features facial recognition-based attendance tracking, real-time analytics, and comprehensive student management.

### Technology Stack

- **Backend**: FastAPI (Python) with MongoDB database
- **Frontend**: React 19 with shadcn/ui components, TailwindCSS
- **Authentication**: Emergent Auth (OAuth with Google)
- **AI/ML**: OpenCV for facial recognition, Emergent LLM for analytics insights
- **Deployment**: Dockerized application on Emergent cloud platform
- **Build Tools**: CRACO for React, Yarn for package management

## Development Commands

### Frontend Development (React)
```bash
cd frontend
yarn install                    # Install dependencies
yarn start                     # Start dev server on localhost:3000
yarn build                     # Build for production
yarn test                      # Run tests
```

### Backend Development (FastAPI)
```bash
cd backend
pip install -r requirements.txt # Install Python dependencies
python -m uvicorn server:app --reload --port 8000  # Start dev server
python backend_test.py          # Run API tests
```

### Environment Setup
- Frontend: Requires `.env` file in `frontend/` with `REACT_APP_BACKEND_URL`
- Backend: Requires `.env` file in `backend/` with `MONGO_URL`, `DB_NAME`, `EMERGENT_LLM_KEY`, `CORS_ORIGINS`

### Testing
- Backend testing: `python backend_test.py` (tests API endpoints without authentication)
- Frontend testing: `yarn test` in frontend directory

## Architecture Patterns

### Backend Architecture (FastAPI)
- **Main App**: `backend/server.py` contains all API routes and core logic
- **Database Models**: Pydantic models for User, Student, AttendanceRecord
- **Authentication**: Session-based auth with Emergent Auth integration
- **API Structure**: RESTful endpoints under `/api` prefix
  - `/api/auth/*` - Authentication endpoints
  - `/api/students/*` - Student management
  - `/api/attendance/*` - Attendance tracking
  - `/api/analytics/*` - AI-powered analytics
  - `/api/classes` - Class and section management

### Frontend Architecture (React)
- **Router Setup**: React Router with protected routes requiring authentication
- **Component Structure**: 
  - `src/App.js` - Main app with routing and auth state management
  - `src/components/` - Page components (Dashboard, StudentManagement, Analytics, etc.)
  - `src/components/ui/` - shadcn/ui component library
- **State Management**: Local state with hooks, no global state library
- **Styling**: TailwindCSS with custom animations and gradients

### Authentication Flow
1. User clicks login → redirects to `auth.emergentagent.com`
2. After OAuth, redirects back with `session_id` in URL fragment
3. Frontend calls `/api/auth/session-data` with session ID
4. Backend validates with Emergent Auth and returns session token
5. Session token stored in secure cookies for subsequent requests

### Database Schema (MongoDB)
- **Users**: `{id, email, name, role, school_id, session_tokens, last_login}`
- **Students**: `{id, name, roll_number, class_name, section, photo_url, facial_embeddings, school_id}`
- **Attendance**: `{id, student_id, date, status, marked_by, method, confidence_score}`

### Key UI Components (shadcn/ui)
- All components in `src/components/ui/` follow shadcn/ui patterns
- Use `cn()` utility for conditional classes
- Components are fully customized with TailwindCSS
- Icons from Lucide React library

## Development Workflow

### Adding New Features
1. Backend: Add routes to `backend/server.py`, follow existing patterns
2. Frontend: Create components in appropriate directories
3. Use existing authentication and error handling patterns
4. Follow established naming conventions and code style

### Working with Student Photos
- Photos processed through OpenCV for facial recognition
- Base64 encoding for storage and display
- Facial embeddings generated but currently use placeholder values
- File upload handling in multipart/form-data format

### Analytics and AI Integration
- AI insights generated through Emergent LLM integration
- Real-time dashboard with attendance trends and statistics
- Chart components using Recharts library
- Responsive design with mobile-first approach

## Configuration Files

### Frontend Configuration
- `craco.config.js`: Custom webpack configuration with path aliases
- `tailwind.config.js`: Extended TailwindCSS with custom colors and animations
- `postcss.config.js`: PostCSS configuration for TailwindCSS

### Key Dependencies
- **Frontend**: React 19, React Router, Axios, Recharts, Framer Motion
- **Backend**: FastAPI, Motor (MongoDB), OpenCV, Pandas, Emergent integrations
- **UI Library**: Complete shadcn/ui component system with Radix UI primitives

## Emergent Platform Integration

This project is designed for the Emergent cloud platform:
- **Environment Image**: `fastapi_react_mongo_shadcn_base_image_cloud_arm:release-12092025-1`
- **Auth Integration**: Uses Emergent Auth service for OAuth
- **LLM Integration**: Uses Emergent LLM API for analytics insights
- **Deployment**: Configured for Emergent cloud deployment

## Important Notes

- All API calls include credentials for session management
- Error handling uses toast notifications via Sonner
- Mobile-responsive design with careful attention to Indian education context
- Code follows React 19 patterns with modern hooks and concurrent features
- Backend uses async/await patterns throughout FastAPI routes
- Database operations use Motor for async MongoDB interactions

## Common Development Tasks

### Adding a New API Endpoint
1. Add route function in `backend/server.py`
2. Include authentication decorator if required: `current_user: User = Depends(get_current_user)`
3. Follow existing error handling patterns
4. Update frontend API calls in appropriate component

### Adding New UI Components
1. Create component in appropriate directory under `src/components/`
2. Use existing shadcn/ui patterns and TailwindCSS classes
3. Import and use Lucide React icons consistently
4. Follow mobile-first responsive design patterns

### Modifying Student Data Schema
1. Update Pydantic models in `backend/server.py`
2. Update MongoDB queries and operations
3. Update frontend components to handle new fields
4. Test with existing data to ensure backward compatibility