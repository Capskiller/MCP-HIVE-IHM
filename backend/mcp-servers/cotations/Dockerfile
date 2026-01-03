# MCP Server: PDF Cotations
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir mcp pypdf2

# Copy server code
COPY server.py .

CMD ["python", "server.py"]
