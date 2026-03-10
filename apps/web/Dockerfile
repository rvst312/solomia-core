FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm version management
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
