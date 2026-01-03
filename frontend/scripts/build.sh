#!/bin/bash
# =============================================================================
# Build production image
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🏗️  Building MCP-HIVE-IHM production image..."
echo ""

docker compose --profile production build frontend-prod

echo ""
echo "✅ Production build complete!"
echo ""
echo "To run production server:"
echo "  docker compose --profile production up frontend-prod"
echo ""
