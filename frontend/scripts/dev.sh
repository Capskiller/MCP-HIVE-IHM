#!/bin/bash
# =============================================================================
# Start development server
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🚀 Starting MCP-HIVE-IHM development server..."
echo ""

docker compose up frontend-dev
