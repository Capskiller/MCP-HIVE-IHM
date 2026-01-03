# MCP-HIVE-SmartHub API Container
FROM python:3.12-slim AS base

WORKDIR /app

# Install system dependencies (including build tools for pyhive/sasl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    libsasl2-dev \
    libsasl2-modules \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY config/ ./config/

# Copy MCP servers for stdio transport
COPY mcp-servers/ ./mcp-servers/

# Production image
FROM base AS production

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Development image with hot reload
FROM base AS development

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
