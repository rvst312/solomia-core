# AGENTS.md

## Project Overview
This is a monorepo for a Software Agency Crew, using Turborepo and pnpm workspaces.
- **Frontend (`apps/web`)**: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript.
- **Backend (`apps/api`)**: FastAPI, Python 3.10+, CrewAI integration.
- **Engine (`packages/crew-engine`)**: Core CrewAI logic (Crews and Flows).
- **Shared (`packages/shared-types`)**: Shared Python types/models.

## Coding Standards

### General
- **Clarity**: Use descriptive variable/function names (e.g., `getUserById` vs `get_user`).
- **Modularity**: Keep functions small and single-purpose.
- **Comments**: Explain *why*, not *what*, for complex logic.
- **Error Handling**: Implement robust error handling (try/except in Python, try/catch/boundaries in JS/TS).

### Frontend (Next.js / React)
- **Components**: Use functional components with Hooks.
- **Styling**: Use Tailwind CSS utility classes. Avoid inline styles.
- **State Management**: Prefer local state or Context API for simple needs; keep global state minimal.
- **TypeScript**: Use strict typing. Avoid `any`. Define interfaces/types for props and API responses.
- **File Structure**: Colocate components, styles, and tests where possible. Use `app/` directory conventions.

### Backend (FastAPI / Python)
- **Type Hints**: Use Python type hints everywhere.
- **Pydantic**: Use Pydantic models for request/response validation.
- **Async**: Use `async def` for I/O-bound operations (DB, API calls).
- **Structure**: Follow FastAPI best practices (routers, dependencies).
- **Dependencies**: Use dependency injection for services/db sessions.

### AI Engine (CrewAI)
- **Agents**: Define agents in `config/agents.yaml` or structured Python classes.
- **Tasks**: Define tasks in `config/tasks.yaml`.
- **Flows**: Ensure clear flow logic in `main.py` or dedicated flow files.

## Workflow
- **Changes**: Ensure new code does not break existing functionality.
- **Testing**: Add tests for new features where applicable.
- **Dependencies**: Check `package.json` or `requirements.txt` before adding new libraries.
