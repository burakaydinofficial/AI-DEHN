@echo off
REM PDF Processor Development Environment Setup for Windows
REM This script sets up a Python virtual environment for the PDF processor service

echo 🐍 Setting up PDF Processor Development Environment...

REM Check if we're in the correct directory
if not exist "main.py" (
    echo ❌ Error: Please run this script from the services/pdf-processor directory
    echo Usage: cd services\pdf-processor && setup-dev-env.bat
    exit /b 1
)

REM Check Python version
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Python is not installed or not in PATH
    echo Please install Python 3.9+ and try again
    exit /b 1
)

echo ✅ Python is available

REM Create virtual environment
set VENV_NAME=venv
if exist "%VENV_NAME%" (
    echo ⚠️  Virtual environment already exists. Removing old environment...
    rmdir /s /q "%VENV_NAME%"
)

echo 📦 Creating virtual environment...
python -m venv "%VENV_NAME%"

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call "%VENV_NAME%\Scripts\activate.bat"

REM Upgrade pip
echo ⬆️  Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo 📚 Installing Python dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt
) else (
    echo ❌ Error: requirements.txt not found
    exit /b 1
)

REM Install development dependencies
echo 🛠️  Installing development dependencies...
pip install pytest pytest-cov black flake8 mypy

REM Create development requirements file
echo 📝 Creating development requirements file...
(
echo # Development dependencies
echo pytest^>=7.4.0
echo pytest-cov^>=4.1.0
echo black^>=23.7.0
echo flake8^>=6.0.0
echo mypy^>=1.5.0
echo.
echo # Testing utilities
echo httpx^>=0.24.0
echo pytest-asyncio^>=0.21.0
) > requirements-dev.txt

echo 💾 Installing development requirements...
pip install -r requirements-dev.txt

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo ⚙️  Creating .env file from template...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo ✅ Created .env file. Please review and update the values as needed.
    ) else (
        (
        echo # PDF Processor Environment Variables
        echo PORT=3095
        echo HOST=0.0.0.0
        echo DEBUG=true
        ) > .env
        echo ✅ Created basic .env file
    )
)

REM Create batch file for easy development startup
echo 📝 Creating development runner...
(
echo @echo off
echo REM Development runner for PDF processor
echo echo 🚀 Starting PDF Processor in Development Mode
echo echo 📡 Server will be available at: http://127.0.0.1:3095
echo echo 🔄 Auto-reload enabled
echo echo 🐛 Debug mode enabled
echo echo.
echo set DEBUG=true
echo set PORT=3095
echo set HOST=127.0.0.1
echo python main.py
) > run-dev.bat

echo ✅ Development environment setup complete!
echo.
echo 🎯 Next steps:
echo 1. Activate the virtual environment:
echo    venv\Scripts\activate.bat
echo.
echo 2. Start the development server:
echo    run-dev.bat
echo.
echo 3. Run tests:
echo    pytest
echo.
echo 4. Format code:
echo    black .
echo.
echo 🌐 The development server will run at: http://127.0.0.1:3095
