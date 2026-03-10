# Software Agency Crew Monorepo

## Overview
This project establishes a scalable software agency architecture using CrewAI, managed as a monorepo with pnpm and Turborepo.

## Structure
- `apps/web`: Frontend in Next.js (React 19)
- `apps/api`: Backend in FastAPI (Python 3.10+)
- `packages/crew-engine`: Core CrewAI logic (Crews and Flows)
- `packages/shared-types`: Shared Pydantic models

## Getting Started

### Prerequisites
- Node.js & pnpm
- Python 3.10+ & pip

### Installation
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Setup Python environment (recommended to use virtualenv for each python package):
   - `packages/crew-engine`: `pip install -r requirements.txt` (create one if needed)
   - `apps/api`: `pip install -r requirements.txt`

### Running the Project
- Use `pnpm run dev` (if scripts are configured in root package.json) or run individually.

## Architecture
- **Monorepo**: Managed by Turborepo and pnpm workspaces.
- **Frontend**: Next.js app for user interface.
- **Backend**: FastAPI for exposing AI capabilities.
- **AI Engine**: CrewAI for orchestrating agents.

## Agents
- **Project Manager**: Orchestrates the development lifecycle.
- **Software Architect**: Designs scalable architectures.

## Usage
To run the Architect Agent with the prompt:
1. Navigate to `packages/crew-engine`.
2. Run `python main.py`.
