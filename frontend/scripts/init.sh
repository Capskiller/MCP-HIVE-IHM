#!/bin/bash
# =============================================================================
# MCP-HIVE-IHM Frontend - Initialization Script
# Run this script to initialize the project with Docker
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🐳 MCP-HIVE-IHM Frontend Initialization"
echo "========================================"
echo ""

cd "$PROJECT_DIR"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Initialize project
echo "📦 Initializing Vite React TypeScript project..."
docker compose --profile init run --rm init

echo ""
echo "🎉 Initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Start development server:"
echo "     docker compose up frontend-dev"
echo ""
echo "  2. Open browser at:"
echo "     http://localhost:5173"
echo ""
echo "  3. Backend API should be running at:"
echo "     http://localhost:8000"
echo ""
