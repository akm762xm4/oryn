# Oryn - MERN Stack Realtime Chat App

A modern, fast, and polished real‑time chat built with MERN + Socket.io.
Beautiful UI, mobile‑first UX, and practical features like media, groups,
AI assistant, export, and granular preferences.

## 🚀 Features

### Core Features

- **Authentication & User Management** - JWT-based auth with OTP email verification
- **Realtime Messaging** - Instant messaging with Socket.io
- **Conversations** - Direct messages and group chats
- **Online Presence** - See who's online/offline with last seen timestamps
- **Typing Indicators** - Real-time typing status
- **Message Status** - Sent, delivered, and read receipts
- **Search** - Search users and messages
- **Media Support** - Photo sharing
- **AI Chat** - Integrated OpenAI chat assistant
- **Security** - Rate limiting, input validation, and secure authentication
- **Notifications** - Real-time notifications for new messages

### UI/UX Features

- **Modern Minimal Design** - Clean 5-color theme
- **Dark/Light Mode** - Toggle between themes
- **Responsive Design** - Works on all devices
- **Smooth Animations** - Polished user experience

## ✨ What’s New

- Theme packs: 5 curated gradient themes with grain effect + themed bubbles
- Background picker with 2‑column responsive layout
- Full‑screen media viewer (+ close controls) and media modal close button
- Export chat (JSON download)
- About modal with quick links (README, Vercel, Render, License)
- Group info modal with member list and rename (real‑time update)
- Reply to messages (reply header + content) and quick reactions (👍 ❤️)
- Unseen message sync: unread badges update in real time across sessions
- Settings: Appearance toggle, Sound/Vibration switches
- Change password modal (server endpoint wired)
- Profile picture: rotate/toggle fit (auto‑orient on upload)
- Suggested users exclude existing conversations

## 🛠️ Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Socket.io Client** for real-time communication
- **Zustand** for state management
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend

- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email sending
- **OpenRouter API** for AI chat with multiple models
- **Multer** for file uploads
- **Helmet** for security headers
- **Rate limiting** for API protection

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- OpenAI API key (for AI chat)
- Email service credentials (Gmail recommended)

### Backend Setup

1. **Navigate to server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_super_secret_jwt_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   CLIENT_URL=http://localhost:5173
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to project root:**

   ```bash
   cd ..
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🚀 Usage

1. **Register a new account** with email verification
2. **Login** to access the chat interface
3. **Start a new chat** by searching for users
4. **Create group chats** with multiple participants
5. **Chat with AI** using the AI assistant feature
6. **Share photos** in conversations
7. **Toggle dark/light mode** for your preference

## 🔧 Configuration

### Email Setup (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

### OpenAI Setup

1. Create an account at [OpenAI](https://openai.com)
2. Generate an API key from the dashboard
3. Add the key to `OPENAI_API_KEY` in your `.env`

### MongoDB Setup

- **Local:** Install MongoDB and use `mongodb://localhost:27017/chatapp`
- **Cloud:** Use MongoDB Atlas and get your connection string

## 🎨 Color Theme

The app uses a minimal 5-color palette:

- **Primary:** Blue (#0066FF) - Main actions and branding
- **Secondary:** Light Gray (#F5F7FA) - Backgrounds and subtle elements
- **Accent:** Green (#16A34A) - Success states and online indicators
- **Neutral:** Dark Gray (#6B7280) - Text and secondary elements
- **Surface:** White/Dark (#FFFFFF/#111827) - Main backgrounds

## 📱 Features in Detail

### Authentication Flow

1. **Registration** → Email verification with OTP → Login
2. **JWT tokens** for secure API access
3. **Rate limiting** to prevent abuse
4. **Password hashing** with bcrypt

### Real-time Features

- **Instant messaging** with Socket.io
- **Online presence** tracking
- **Typing indicators** with auto-timeout
- **Message delivery** status
- **Real-time notifications**

### AI Integration

- **OpenAI GPT-3.5** integration
- **Context-aware** responses
- **Conversation history** for better responses
- **Fallback handling** for API errors

## 🔒 Security Features

- **JWT authentication** with secure tokens
- **Password hashing** with bcrypt
- **Rate limiting** on sensitive endpoints
- **Input validation** and sanitization
- **CORS protection**
- **Helmet** for security headers
- **File upload** size and type restrictions

## 🚀 Deployment

### Backend Deployment

1. Set up MongoDB Atlas or your preferred database
2. Configure environment variables for production
3. Deploy to Heroku, Railway, or your preferred platform
4. Update CORS settings for your frontend domain

### Frontend Deployment

1. Update `VITE_API_URL` to your backend URL
2. Build the project: `npm run build`
3. Deploy to Vercel, Netlify, or your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for the AI chat capabilities
- **Socket.io** for real-time communication
- **Tailwind CSS** for the styling system
- **React** and **Node.js** communities for excellent documentation

---

**Happy Chatting! 💬**
