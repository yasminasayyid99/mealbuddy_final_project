# PostgreSQL Database Configuration Guide

## Problem Description
Your colleague modified the code without entering the venv environment, causing the database connection configuration to revert to SQLite. Now you need to reconfigure it for PostgreSQL.

## Solution

### 1. Database Configuration Updated
- ✅ `DATABASE_URL` in `.env` file has been updated to: `postgresql://mealbuddy_user:123456@localhost:5432/mealbuddy`
- ✅ Added `psycopg2-binary==2.9.7` to `requirements.txt`

### 2. Install PostgreSQL Packages in Miniconda Environment

#### Method 1: Use the provided installation script
```bash
# Give execution permission to the script
chmod +x install_postgresql.sh

# Run the installation script
./install_postgresql.sh
```

#### Method 2: Manual installation
```bash
# 1. Install PostgreSQL client library using conda
conda install -c conda-forge postgresql libpq-dev -y

# 2. Install Python PostgreSQL driver using pip
pip install psycopg2-binary==2.9.7
```

### 3. Verify Installation
```bash
# Check if installation was successful
pip list | grep psycopg
conda list | grep postgresql
```

### 4. Run the Application
```bash
# Enter backend directory
cd backend

# Run Flask application
python app.py
```

## Important Notes

1. **No need to enter venv**: You can install PostgreSQL packages directly in the miniconda environment
2. **Database connection**: Ensure PostgreSQL service is running and the `mealbuddy` database exists
3. **User permissions**: Ensure user `mealbuddy_user` has access permissions to the database

## Troubleshooting

### Connection Errors
If you encounter connection errors, please check:
- Is PostgreSQL service running: `brew services list | grep postgresql`
- Does the database exist: `psql -U mealbuddy_user -d mealbuddy -h localhost`
- Is the user password correct

### Package Installation Errors
If psycopg2 installation fails, you can try:
```bash
# Install system dependencies
brew install postgresql

# Then reinstall Python package
pip install psycopg2-binary
```