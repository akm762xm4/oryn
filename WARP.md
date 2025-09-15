# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Oryn is a modern real-time chat application built with the MERN stack (MongoDB, Express.js, React 19, Node.js) featuring AI integration, Socket.io for real-time communication, and a clean TypeScript implementation.

## Development Commands

### Frontend Development
```bash
# Start development server (React + Vite)
npm run dev

# Build for production 
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Development
```bash
# Start backend development server (with nodemon)
npm run server:dev

# Start backend production server
npm run server:start

# Install backend dependencies
npm run server:install
```

### Full Stack Development
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Run both frontend and backend concurrently
npm run dev:full
```

### Environment Setup
```bash
# Frontend environment
cp .env.example .env
# Edit VITE_API_URL (defaults to http://localhost:5000)

# Backend environment
cd server && cp .env.example .env
# Configure MongoDB, JWT secret, email service, OpenRouter API, Cloudinary
```

## Architecture Overview

### Frontend Architecture (`src/`)
- **State Management**: Zustand stores with persistence
  - `authStore.ts`: Authentication state, JWT token management
  - `chatStore.ts`: Real-time chat state, messages, conversations, online users
  - `themeStore.ts`: Dark/light theme preferences
  - `preferencesStore.ts`: User preferences
- **Real-time Communication**: Socket.io client wrapper (`lib/socket.ts`)
- **API Layer**: Axios instance with interceptors (`lib/api.ts`)
- **Routing**: React Router with lazy loading and auth guards
- **Styling**: Tailwind CSS 4.x with custom theme system

### Backend Architecture (`server/src/`)
- **Socket.io Integration**: Real-time messaging, typing indicators, presence tracking
- **Authentication**: JWT-based with middleware protection
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Multer + Cloudinary integration for image handling
- **AI Integration**: OpenRouter API for AI chat functionality
- **Email Service**: Nodemailer for OTP verification

### Key Patterns
1. **Real-time State Sync**: Socket events automatically update Zustand stores
2. **Optimistic Updates**: UI updates immediately, reverts on socket errors
3. **Connection Management**: Automatic reconnection and error handling
4. **Type Safety**: Full TypeScript coverage with shared type definitions

### Socket Events Architecture
**Client → Server**: `sendMessage`, `typing`, `markAsRead`, `joinConversation`
**Server → Client**: `newMessage`, `userTyping`, `userOnline/Offline`, `messageRead`

### Data Models
- **User**: Profile, online status, verification state
- **Conversation**: Participants, group settings, last message reference
- **Message**: Content, type (text/image/ai), read receipts, status tracking

### Authentication Flow
1. Register → Email OTP verification → Login
2. JWT token stored in localStorage/sessionStorage based on "Remember Me"
3. Socket authentication using JWT token
4. Automatic token refresh handling in API interceptors

### File Structure Conventions
- **Components**: Reusable UI components in `src/components/`
- **Pages**: Route-level components in `src/pages/`
- **Stores**: Zustand state management in `src/stores/`
- **Types**: Shared TypeScript definitions in `src/types/`
- **Utils**: Helper functions in `src/lib/`
- **Server Routes**: Express routes in `server/src/routes/`
- **Models**: Mongoose schemas in `server/src/models/`

### Development Workflow
1. Frontend runs on port 5173 (Vite dev server)
2. Backend runs on port 5000 (Express server)
3. Socket.io uses same port as backend (5000)
4. API calls use dynamic base URL (dev vs production)
5. CORS configured for Vercel deployments and local development

### Testing & Quality
- ESLint configuration with TypeScript and React rules
- Strict TypeScript configuration with path aliases
- No automated test suite currently implemented

### Deployment Architecture
- **Frontend**: Vercel deployment with environment variables
- **Backend**: Vercel serverless functions or traditional hosting
- **Database**: MongoDB Atlas for production
- **File Storage**: Cloudinary for image uploads
- **Real-time**: Socket.io with polling/websocket fallback
