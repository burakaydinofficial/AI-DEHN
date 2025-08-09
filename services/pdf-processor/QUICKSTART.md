# 🚀 Quick Start Development Guide

This guide will get you up and running with the PDF Processor service in under 5 minutes.

## 🎯 Prerequisites

- Python 3.11+ 
- Make (optional, but recommended)
- Git

## ⚡ Super Quick Start (1 command)

```bash
make setup
```

This single command will:
- Check Python version
- Create virtual environment
- Install all dependencies
- Set up development tools

## 🏃 Running the Service

### Option 1: Development Server (Recommended)
```bash
make dev
# or
python run-dev.py
```

Features:
- 🔥 Hot-reload on file changes
- 📊 Enhanced logging
- 🛠️ Development mode enabled
- 🔍 Automatic dependency checking

### Option 2: Production Server
```bash
make run
# or  
python main.py
```

### Option 3: Docker Development
```bash
make docker-dev
# or
docker-compose -f docker-compose.dev.yml up --build
```

## 🧪 Testing Your Setup

1. **Start the server**:
   ```bash
   make dev
   ```

2. **Test the health endpoint**:
   ```bash
   curl http://localhost:3095/health
   ```

3. **Test PDF processing** (using example file):
   ```bash
   curl -X POST \
     -F "pdf=@../../example-files/example-flyer.pdf" \
     http://localhost:3095/process
   ```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make dev` | Start development server |
| `make test` | Run tests |
| `make lint` | Check code quality |
| `make format` | Format code |
| `make check` | Run all quality checks |

## 🔧 Development Features

### Hot Reload
The development server automatically restarts when you modify:
- `.py` files
- `requirements.txt`  
- Configuration files

### Code Quality Tools
- **Black**: Code formatting
- **isort**: Import sorting
- **Flake8**: Linting
- **MyPy**: Type checking
- **Pytest**: Testing

### Code Quality Tools
Run quality checks manually:
- `black .` - Code formatting
- `flake8 .` - Lint checks  
- `mypy .` - Type checking
- `pytest` - Test execution

## 📁 Project Structure

```
services/pdf-processor/
├── main.py              # Main application server
├── run-dev.py           # Development server with hot-reload
├── test_processor.py    # Test suite
├── requirements.txt     # Production dependencies
├── requirements-dev.txt # Development dependencies
├── Makefile            # Development commands
├── setup-dev-env.sh    # Environment setup script
├── Dockerfile          # Production container
└── docker-compose.dev.yml # Development container setup
```

## 🐛 Troubleshooting

### Python Version Issues
```bash
# Check your Python version
python3 --version

# If < 3.11, install newer version
# On macOS with Homebrew:
brew install python@3.11
```

### Virtual Environment Issues
```bash
# Clean and recreate environment
make clean-all
make setup
```

### Port Already in Use
```bash
# Find and kill process using port 3095
lsof -ti:3095 | xargs kill -9

# Or use different port
PORT=8081 make dev
```

### Permission Issues
```bash
# Make scripts executable
chmod +x setup-dev-env.sh
chmod +x run-dev.py
```

## 🎯 Next Steps

1. **Explore the API**: Check out the main endpoints in `main.py`
2. **Run Tests**: `make test` to ensure everything works
3. **Modify Code**: Edit files and watch hot-reload in action
4. **Add Features**: Follow the existing code patterns
5. **Submit Changes**: Run `black .`, `flake8 .`, and `pytest` before committing

## 🆘 Getting Help

- Check `make help` for all commands
- View `main.py` for API documentation
- Run `make status` to check environment
- Look at `test_processor.py` for usage examples

Happy coding! 🎉
