cd backend

# Install Node.js dependencies
npm install

# Start the Node backend server
npm start

########

cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev

#########

cd python_agent

# 1. Create and activate a virtual environment
python -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# 2. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 3. Ingest document corpus into Chroma vector database
python build_vectorstore.py

# 5. Start the FastAPI Agent service
python main.py

# Force upgrade setuptools and pip cleanly first
python -m pip install --upgrade pip setuptools

# Re-run your requirements installation
pip install -r requirements.txt