# MealBuddy Team Deployment Guide

## Prerequisites

Ensure your system has the following installed:
- **Node.js** (v16+)
- **Python** (v3.8+)
- **PostgreSQL** (v12+)
- **Miniconda** or **Anaconda**

## 🚀 Quick Start

### 1. Clone/Get Project Files
```bash
# If it's a Git repository
git clone <repository-url>
cd mealbuddy_final

# Or directly extract the provided file package
```

### 2. Backend Setup

#### 2.1 Install Python Dependencies
```bash
cd backend

# Using miniconda environment (recommended)
pip install -r requirements.txt

# Install PostgreSQL driver
pip install psycopg2-binary
```

#### 2.2 Database Configuration
```bash
# Install PostgreSQL (if not installed)
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database and user
psql postgres
```

Execute in PostgreSQL command line:
```sql
CREATE DATABASE mealbuddy;
CREATE USER mealbuddy_user WITH PASSWORD '123456';
GRANT ALL PRIVILEGES ON DATABASE mealbuddy TO mealbuddy_user;
\q
```

#### 2.3 Environment Variables Configuration
Ensure the `.env` file contains correct database connection information:
```env
DATABASE_URL=postgresql://mealbuddy_user:123456@localhost:5432/mealbuddy
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
CHATANYWHERE_API_KEY=your-api-key
CHATANYWHERE_BASE_URL=https://api.chatanywhere.tech/v1
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

#### 2.4 Database Migration
```bash
# Initialize database tables
python -c "from app import create_app; from database import db; app = create_app(); app.app_context().push(); db.create_all(); print('Database initialized successfully')"

# Or use migrations (if exists)
flask db upgrade
```

#### 2.5 Start Backend Service
```bash
python app.py
# Backend will run on http://localhost:3001
```

### 3. Frontend Setup

#### 3.1 Install Node.js Dependencies
```bash
cd ../frontend
npm install
```

#### 3.2 Environment Variables Configuration
Ensure the `.env` file is configured correctly:
```env
VITE_API_URL=http://localhost:3001/api
```

#### 3.3 Start Frontend Service
```bash
npm run dev
# Frontend will run on http://localhost:5173
```

## 🔧 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check PostgreSQL service status
brew services list | grep postgresql

# Restart PostgreSQL service
brew services restart postgresql

# Test database connection
psql -U mealbuddy_user -d mealbuddy -h localhost
```

### Python Package Installation Issues
```bash
# If psycopg2 installation fails
brew install postgresql
pip install psycopg2-binary

# Check installed packages
pip list | grep -i psycopg
```

### Port Conflict Issues
```bash
# Check port usage
lsof -i :3001  # Backend port
lsof -i :5173  # Frontend port

# Kill process occupying the port
kill -9 <PID>
```

## 📝 Installation Verification

1. **Backend Verification**: Visit http://localhost:3001/api/health
2. **Frontend Verification**: Visit http://localhost:5173
3. **Database Verification**: Check if corresponding tables are created in PostgreSQL

## 🎯 Production Environment Deployment

### Environment Variables
```bash
# Backend .env.production
FLASK_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database

# Frontend .env.production
VITE_API_URL=https://your-api-domain.com/api
```

### Build Commands
```bash
# Frontend build
cd frontend
npm run build

# Backend production run
cd backend
gunicorn -w 4 -b 0.0.0.0:3001 app:app
```

## 📞 Support

If you encounter issues, please check:
1. Whether all dependencies are correctly installed
2. Whether database connection is normal
3. Whether environment variables are configured correctly
4. Whether ports are occupied

---

**Note**: For first-time deployment, please ensure all steps are executed in order, especially database creation and configuration.