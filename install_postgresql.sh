#!/bin/bash

# Script to install PostgreSQL related packages
# Can be run in miniconda environment

echo "Installing PostgreSQL related packages..."

# Install PostgreSQL client library using conda
conda install -c conda-forge postgresql libpq-dev -y

# Install Python PostgreSQL driver using pip
pip install psycopg2-binary==2.9.7

echo "PostgreSQL packages installation completed!"
echo "Now you can connect to PostgreSQL database."

# Display current Python environment information
echo "Current Python environment:"
which python
python --version

echo "Installed PostgreSQL related packages:"
pip list | grep -i psycopg
conda list | grep -i postgresql