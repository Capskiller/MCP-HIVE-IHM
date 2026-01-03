# MCP Server: INSEE QPV Data
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir mcp pandas

# Copy server code
COPY server.py .

CMD ["python", "server.py"]
