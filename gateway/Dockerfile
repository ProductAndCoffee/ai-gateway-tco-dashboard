FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
