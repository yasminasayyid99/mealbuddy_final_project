# MealBuddy - Social Dining Platform

A modern dining event organization and social platform based on React and Flask, enabling users to easily create, participate in, and manage various food gathering activities.

## 🚀 Tech Stack

### Frontend Technologies
- **React 18.2.0** - Modern frontend framework
- **Vite 5.4.0** - Fast build tool and development server
- **Socket.IO Client 4.8.1** - Real-time communication client
- **Native CSS** - Responsive UI design
- **JavaScript ES6+** - Modern JavaScript features

### Backend Technologies
- **Flask 2.3.3** - Python lightweight web framework
- **Flask-SQLAlchemy 3.0.5** - ORM database operations
- **Flask-JWT-Extended 4.5.3** - JWT authentication
- **Flask-SocketIO 5.3.6** - WebSocket real-time communication
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **Flask-Migrate 4.0.5** - Database migration
- **SQLite** - Lightweight database
- **Werkzeug 2.3.7** - WSGI utility library
- **Pillow 10.0.1** - Image processing
- **bcrypt 4.0.1** - Password encryption

### AI Integration
- **ChatAnywhere API** - GPT-3.5-turbo model
- **Intelligent Recommendation System** - Restaurant and event recommendations based on user preferences

## 📁 Project Structure

```
mealbuddy_final/
├── backend/                 # Flask backend service
│   ├── models/             # Data models
│   │   ├── user.py        # User model
│   │   ├── event.py       # Event model
│   │   └── chat.py        # Chat message model
│   ├── routes/             # API routes
│   │   ├── auth.py        # Authentication APIs
│   │   ├── events.py      # Event-related APIs
│   │   ├── chat.py        # Chat-related APIs
│   │   ├── ai.py          # AI assistant APIs
│   │   ├── upload.py      # File upload APIs
│   │   └── users.py       # User-related APIs
│   ├── services/           # Business services
│   │   └── ai_service.py  # AI service integration
│   ├── utils/              # Utility functions
│   │   ├── helpers.py     # Helper functions
│   │   └── validators.py  # Data validation
│   ├── app.py             # Flask application main file
│   ├── config.py          # Configuration file
│   ├── database.py        # Database configuration
│   └── requirements.txt   # Python dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   │   └── api.js    # API client
│   │   ├── hooks/         # React Hooks
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # Application entry point
│   ├── package.json       # Node.js dependencies
│   └── vite.config.js     # Vite configuration
└── README.md              # Project documentation
```

## 🗄️ Database Structure

### User Table
```sql
CREATE TABLE user (
    id VARCHAR(36) PRIMARY KEY,           -- UUID primary key
    username VARCHAR(80) UNIQUE NOT NULL, -- Username
    email VARCHAR(120) UNIQUE NOT NULL,   -- Email
    password_hash VARCHAR(255) NOT NULL,  -- Encrypted password
    avatar VARCHAR(255) DEFAULT '',       -- Avatar URL
    bio TEXT DEFAULT '',                  -- Personal bio
    dietary_preferences JSON DEFAULT '[]', -- Dietary preferences (JSON array)
    location VARCHAR(255) DEFAULT '',     -- Location information
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Event Table
```sql
CREATE TABLE event (
    id VARCHAR(36) PRIMARY KEY,           -- UUID primary key
    title VARCHAR(200) NOT NULL,          -- Event title
    description TEXT DEFAULT '',          -- Event description
    category VARCHAR(50) NOT NULL,        -- Event category
    date DATETIME NOT NULL,               -- Event date
    time VARCHAR(20) NOT NULL,            -- Event time
    location VARCHAR(255) NOT NULL,       -- Event location
    max_participants INTEGER DEFAULT 10,  -- Maximum participants
    budget_per_person FLOAT DEFAULT 0.0,  -- Budget per person
    image VARCHAR(255) DEFAULT '',        -- Event image URL
    status VARCHAR(20) DEFAULT 'active',  -- Status (active/cancelled/completed)
    creator_id VARCHAR(36) NOT NULL,      -- Creator ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES user(id)
);
```

### Chat Message Table
```sql
CREATE TABLE chat_message (
    id VARCHAR(36) PRIMARY KEY,           -- UUID primary key
    content TEXT NOT NULL,                -- Message content
    message_type VARCHAR(20) DEFAULT 'text', -- Message type (text/image/system)
    sender_id VARCHAR(36) NOT NULL,       -- Sender ID
    event_id VARCHAR(36) NOT NULL,        -- Associated event ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES user(id),
    FOREIGN KEY (event_id) REFERENCES event(id)
);
```

### Association Tables
```sql
-- Event participants association table
CREATE TABLE event_participants (
    user_id VARCHAR(36),
    event_id VARCHAR(36),
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (event_id) REFERENCES event(id)
);

-- User saved events association table
CREATE TABLE saved_events (
    user_id VARCHAR(36),
    event_id VARCHAR(36),
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (event_id) REFERENCES event(id)
);
```

## 🔌 API Documentation

### Authentication (/api/auth)

#### POST /api/auth/register
User registration
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/login
User login
```json
{
  "username": "string",
  "password": "string"
}
```

#### POST /api/auth/logout
User logout (requires JWT Token)

#### GET /api/auth/profile
Get user profile (requires JWT Token)

### Events (/api/events)

#### GET /api/events
Get event list
- Query parameters: `page`, `per_page`, `keyword`, `filter`
- Supports pagination and keyword search

#### POST /api/events
Create new event (requires JWT Token)
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "location": "string",
  "max_participants": "integer",
  "budget_per_person": "float"
}
```

#### GET /api/events/{event_id}
Get event details

#### PUT /api/events/{event_id}
Update event information (requires JWT Token, creator only)

#### DELETE /api/events/{event_id}
Delete event (requires JWT Token, creator only)

#### POST /api/events/{event_id}/join
Join event (requires JWT Token)

#### POST /api/events/{event_id}/leave
Leave event (requires JWT Token)

#### POST /api/events/{event_id}/save
Save event (requires JWT Token)

#### DELETE /api/events/{event_id}/save
Unsave event (requires JWT Token)

#### GET /api/events/my-events
Get my created events (requires JWT Token)

### Chat (/api/chat)

#### GET /api/chat/conversations
Get chat conversation list (requires JWT Token)

#### GET /api/chat/{event_id}
Get event chat history (requires JWT Token)
- Query parameters: `page`, `per_page`

#### POST /api/chat/{event_id}
Send chat message (requires JWT Token)
```json
{
  "message": "string"
}
```

### AI Assistant (/api/ai)

#### POST /api/ai/chat
AI chat conversation (requires JWT Token)
```json
{
  "message": "string"
}
```

#### POST /api/ai/event-suggestions
Get event suggestions (requires JWT Token)
```json
{
  "category": "string",
  "participants_count": "integer"
}
```

### Users (/api/users)

#### GET /api/users/profile
Get user profile (requires JWT Token)

#### PUT /api/users/profile
Update user profile (requires JWT Token)
```json
{
  "username": "string",
  "email": "string",
  "bio": "string",
  "dietary_preferences": ["string"],
  "location": "string"
}
```

### File Upload (/api/upload)

#### POST /api/upload/avatar
Upload user avatar (requires JWT Token)
- Content-Type: multipart/form-data
- Field name: avatar

#### POST /api/upload/event
Upload event image (requires JWT Token)
- Content-Type: multipart/form-data
- Field name: image

#### GET /api/upload/uploads/{filename}
Get uploaded file

#### GET /api/upload/info
Get upload configuration information

### System Health Check

#### GET /api/health
System health status check

## 🚀 Quick Start

### Requirements
- **Python 3.8+** (recommended 3.9 or higher)
- **Node.js 16+** (recommended 18.x LTS)
- **npm 8+** or **yarn 1.22+**
- **Git** (for cloning the project)

### Project Clone

```bash
# Clone the project locally
git clone <repository-url>
cd mealbuddy_final
```

### Backend Environment Setup and Launch

#### 1. Enter backend directory
```bash
cd backend
```

#### 2. Create Python virtual environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Verify virtual environment is activated (should show (venv) in command line)
which python  # macOS/Linux
where python  # Windows
```

#### 3. Install Python dependencies
```bash
# Ensure pip is up to date
pip install --upgrade pip

# Install project dependencies
pip install -r requirements.txt
```

#### 4. Configure backend environment variables
Create `.env` file in `backend` directory:
```bash
# Create environment variables file
touch .env  # macOS/Linux
# or create file directly # Windows
```

Add the following configuration to `.env` file:
```env
# Application keys (please change to your own keys)
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too

# AI service configuration (optional, configure if you need AI features)
CHATANYWHERE_API_KEY=your-chatanywhere-api-key
CHATANYWHERE_BASE_URL=https://api.chatanywhere.tech/v1

# Database configuration
DATABASE_URL=sqlite:///mealbuddy.db

# File upload configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Development environment configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

#### 5. Initialize database
```bash
# Initialize database table structure
python init_db.py

# Verify database creation success
ls -la instance/  # Should see mealbuddy.db file
```

#### 6. Start backend service
```bash
# Start Flask development server
python run.py

# Or use Flask command
# export FLASK_APP=app.py  # macOS/Linux
# set FLASK_APP=app.py     # Windows
# flask run --host=0.0.0.0 --port=3001
```

✅ Backend service will start at `http://localhost:3001`

### Frontend Environment Setup and Launch

#### 1. Open new terminal and enter frontend directory
```bash
# Keep backend service running, open new terminal window
cd frontend
```

#### 2. Install Node.js dependencies
```bash
# Install dependencies using npm
npm install

# Or use yarn (if you prefer yarn)
# yarn install

# Verify dependencies installation success
npm list --depth=0
```

#### 3. Configure frontend environment variables
Create `.env` file in `frontend` directory:
```bash
# Create environment variables file
touch .env  # macOS/Linux
```

Add the following configuration to `.env` file:
```env
# API service address
VITE_API_URL=http://localhost:3001

# Development environment configuration
VITE_NODE_ENV=development
```

#### 4. Start frontend development server
```bash
# Start Vite development server
npm run dev

# Or use yarn
# yarn dev
```

✅ Frontend application will start at `http://localhost:5173` (port may auto-adjust)

### 🎯 Installation Verification

1. **Backend Verification**:
   - Visit `http://localhost:3001/api/health`
   - Should see: `{"status": "healthy", "message": "MealBuddy Flask API is running"}`

2. **Frontend Verification**:
   - Visit `http://localhost:5173`
   - Should see MealBuddy homepage interface

3. **Feature Verification**:
   - Try registering a new user
   - Login to the system
   - Create a new event
   - Test chat functionality

### 🔧 Common Issues Resolution

#### Python-related Issues
```bash
# If encountering permission issues
sudo pip install -r requirements.txt  # Not recommended, use virtual environment instead

# If Python version incompatible
python3 -m venv venv  # Explicitly use Python3

# If pip installation is slow
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

#### Node.js-related Issues
```bash
# If npm installation is slow
npm install --registry https://registry.npmmirror.com

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Port Conflict Issues
```bash
# Check port usage
lsof -i :3001  # Check backend port
lsof -i :5173  # Check frontend port

# Kill occupying process
kill -9 <PID>

# Or start with different port
# Backend: modify port parameter in run.py
# Frontend: vite will automatically choose available port
```

### 📱 Production Environment Deployment

#### Frontend Build
```bash
cd frontend
npm run build
# Build files will be generated in dist/ directory
```

#### Backend Production Configuration
```bash
# Install production server
pip install gunicorn

# Start production server
gunicorn -w 4 -b 0.0.0.0:3001 app:app
```

### 🛠️ Recommended Development Tools

- **IDE**: VS Code, PyCharm, WebStorm
- **API Testing**: Postman, Insomnia
- **Database Management**: DB Browser for SQLite
- **Version Control**: Git + GitHub Desktop
- **Terminal**: iTerm2 (macOS), Windows Terminal (Windows)

## 📊 Experimental Report

### Project Overview

MealBuddy is a modern social dining platform designed to solve the pain points of organizing dining events for urban populations. By providing an intuitive interface, real-time chat functionality, and AI-powered recommendations, it enables users to easily create, discover, and participate in various food gathering activities.

### Core Feature Implementation

#### 1. User Authentication System
- **Technical Implementation**: JWT-based stateless authentication
- **Security Features**:
  - bcrypt password encryption
  - Automatic token expiration handling
  - Cross-origin security configuration
- **User Experience**:
  - Automatic login state persistence
  - Friendly error messages
  - Responsive login interface

#### 2. Event Management System
- **Feature Highlights**:
  - Event creation, editing, deletion
  - Multi-dimensional filtering and search
  - Event status management (active/cancelled/completed)
  - Participant management
- **Technical Highlights**:
  - SQLAlchemy ORM relationship mapping
  - Paginated query optimization
  - Image upload and processing
  - Real-time status synchronization

#### 3. Real-time Chat System
- **Technical Architecture**:
  - Flask-SocketIO WebSocket communication
  - Event-based chat rooms
  - Message persistence storage
- **Feature Characteristics**:
  - Real-time message push
  - Chat history records
  - User online status
  - Message type support (text/image/system messages)

#### 4. AI Intelligent Assistant
- **Integration Solution**: ChatAnywhere API (GPT-3.5-turbo)
- **Application Scenarios**:
  - Restaurant recommendations
  - Event suggestions
  - Food consultation
  - Dining planning
- **Optimization Strategies**:
  - Context-aware conversations
  - User preference learning
  - Response time optimization

#### 5. File Upload System
- **Supported Formats**: PNG, JPG, JPEG, GIF
- **Security Measures**:
  - File type validation
  - File size limitation (16MB)
  - Secure filename handling
- **Storage Solution**: Local file system storage

### Technical Architecture Analysis

#### Frontend Architecture
- **Component-based Design**: React functional components + Hooks
- **State Management**: useState + useEffect local state management
- **API Communication**: Unified ApiService encapsulation
- **Styling Solution**: Native CSS + CSS variable theme system
- **Build Tool**: Vite for fast development and building

#### Backend Architecture
- **Framework Choice**: Flask lightweight framework, suitable for small to medium projects
- **Database Design**: SQLite + SQLAlchemy ORM
- **API Design**: RESTful API + Blueprint modularization
- **Authentication Scheme**: JWT stateless authentication
- **Real-time Communication**: WebSocket bidirectional communication

### Performance Optimization

#### Frontend Optimization
1. **Code Splitting**: Vite automatic code splitting
2. **Lazy Loading**: Component on-demand loading
3. **Caching Strategy**: localStorage local caching
4. **Network Optimization**: API request deduplication and error retry

#### Backend Optimization
1. **Database Optimization**:
   - Index optimization (username, email unique indexes)
   - Query optimization (paginated queries, relational queries)
   - Connection pool management
2. **API Optimization**:
   - Response data structure optimization
   - Unified error handling
   - Request parameter validation

### Security Considerations

1. **Authentication Security**:
   - JWT Token secure transmission
   - Password bcrypt encryption storage
   - Token expiration mechanism

2. **Data Security**:
   - SQL injection protection (ORM parameterized queries)
   - XSS protection (input validation and escaping)
   - CSRF protection (CORS configuration)

3. **File Security**:
   - File type whitelist
   - File size limitations
   - Secure filename handling

### Testing and Deployment

#### Development Testing
- **Functional Testing**: Manual testing of various functional modules
- **Compatibility Testing**: Multi-browser compatibility verification
- **Performance Testing**: Page loading speed and API response time

#### Deployment Solutions
- **Development Environment**: Local development server
- **Production Environment Recommendations**:
  - Frontend: Nginx static file service
  - Backend: Gunicorn + Nginx reverse proxy
  - Database: PostgreSQL or MySQL
  - Cache: Redis

### Project Highlights

1. **Modern Tech Stack**: React 18 + Latest Flask version
2. **Real-time Communication**: WebSocket real-time chat experience
3. **AI Integration**: Intelligent assistant enhances user experience
4. **Responsive Design**: Adapts to various device screens
5. **Modular Architecture**: Frontend-backend separation, easy to maintain and extend

### Future Improvement Directions

1. **Feature Extensions**:
   - Map integration (event location visualization)
   - Payment integration (AA payment functionality)
   - Social features (friend system, dynamic sharing)
   - Recommendation algorithms (intelligent recommendations based on user behavior)

2. **Technical Optimization**:
   - Microservice architecture refactoring
   - Containerized deployment (Docker)
   - Automated testing (unit tests, integration tests)
   - Monitoring and logging systems

3. **User Experience**:
   - PWA support (offline usage)
   - Push notifications
   - Multi-language support
   - Accessibility optimization

### Summary

The MealBuddy project successfully implements a fully functional social dining platform, demonstrating best practices in modern web development. Through the combination of React and Flask, it achieves an efficient frontend-backend separation architecture. The project reaches high standards in user experience, technical implementation, and security, providing users with a convenient dining event organization and social experience.

