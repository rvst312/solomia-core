FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY apps/api/requirements.txt ./apps/api/requirements.txt
COPY packages/crew_engine/requirements.txt ./packages/crew_engine/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r apps/api/requirements.txt
RUN pip install --no-cache-dir -r packages/crew_engine/requirements.txt

# Copy application code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
