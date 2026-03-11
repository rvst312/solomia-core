import asyncio
import os
import queue
import sys
from typing import Any, Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Correct import path assuming the monorepo structure allows this or relative imports work
try:
    from packages.crew_engine.main import SoftwareAgencyCrew
except ImportError:
    # Fallback for when running from root
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
    from packages.crew_engine.main import SoftwareAgencyCrew

app = FastAPI(title="Software Agency API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for transcripts (for demo purposes)
transcripts: Dict[str, str] = {}

class DesignRequest(BaseModel):
    meeting_transcript: str

class PhaseRequest(BaseModel):
    transcript_id: str
    project_id: str = "default"

class ProjectRequest(BaseModel):
    name: str

def get_project_dir(project_id: str) -> str:
    if project_id == "default":
        return "output"
    return os.path.join("projects", project_id)

def read_file_content(filename: str) -> str:
    try:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                return f.read()
        return ""
    except Exception:
        return ""

class ThreadSafeQueueWriter:
    def __init__(self, q: queue.Queue):
        self.q = q
    
    def write(self, data: str):
        # Filter out uvicorn logs or empty lines if needed
        if data.strip():
            self.q.put(data)
    
    def flush(self):
        pass

import logging


class QueueLogger(logging.Handler):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue

    def emit(self, record):
        try:
            msg = self.format(record)
            if msg.strip():
                self.queue.put(msg + '\n')
        except Exception:
            self.handleError(record)

async def stream_crew_execution(crew_runner_func):
    q = queue.Queue()
    
    def run_crew_with_capture():
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        writer = ThreadSafeQueueWriter(q)
        sys.stdout = writer
        sys.stderr = writer
        
        # Add QueueLogger to capture logging output that might bypass sys.stderr
        root_logger = logging.getLogger()
        queue_handler = QueueLogger(q)
        queue_handler.setFormatter(logging.Formatter('%(message)s'))
        root_logger.addHandler(queue_handler)
        
        try:
            return crew_runner_func()
        finally:
            root_logger.removeHandler(queue_handler)
            sys.stdout = original_stdout
            sys.stderr = original_stderr
            q.put(None)

    # Run in thread
    loop = asyncio.get_event_loop()
    future = loop.run_in_executor(None, run_crew_with_capture)
    
    while True:
        try:
            line = q.get_nowait()
            if line is None:
                break
            yield line
        except queue.Empty:
            if future.done():
                break
            await asyncio.sleep(0.1)
    
    try:
        crew_output = await future
        yield f"Phase Complete.\nResult:\n{str(crew_output)}\n"
    except Exception as e:
        yield f"Error running phase: {str(e)}\n"

@app.post("/projects")
async def create_project(request: ProjectRequest):
    project_dir = os.path.join("projects", request.name)
    try:
        os.makedirs(project_dir, exist_ok=True)
        return {"project_id": request.name, "message": "Project created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files/{project_id}")
async def list_files(project_id: str):
    project_dir = get_project_dir(project_id)
    if not os.path.exists(project_dir):
        # Create default if not exists
        os.makedirs(project_dir, exist_ok=True)
    
    files = []
    for root, dirs, filenames in os.walk(project_dir):
        rel_root = os.path.relpath(root, project_dir)
        if rel_root == ".":
            rel_root = ""
        
        for filename in filenames:
            rel_path = os.path.join(rel_root, filename)
            files.append({
                "name": filename,
                "path": rel_path,
                "type": "file"
            })
        for dirname in dirs:
             rel_path = os.path.join(rel_root, dirname)
             files.append({
                 "name": dirname,
                 "path": rel_path,
                 "type": "directory"
             })
    
    return {"files": files}

@app.get("/files/{project_id}/content")
async def get_file_content(project_id: str, path: str):
    project_dir = get_project_dir(project_id)
    full_path = os.path.join(project_dir, path)
    
    # Security check: ensure path is within project_dir
    if not os.path.abspath(full_path).startswith(os.path.abspath(project_dir)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    content = read_file_content(full_path)
    return {"content": content}

@app.get("/")
async def root():
    return {"message": "Welcome to Software Agency API"}

@app.get("/agents")
async def get_agents():
    try:
        crew = SoftwareAgencyCrew()
        return crew.get_agents_config()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_transcript")
async def upload_transcript(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = content.decode("utf-8")
        transcript_id = f"transcript_{len(transcripts) + 1}"
        transcripts[transcript_id] = text
        return {"transcript_id": transcript_id, "preview": text[:200]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@app.post("/design/analysis")
async def run_analysis(request: PhaseRequest):
    transcript_id = request.transcript_id
    project_id = request.project_id
    output_dir = get_project_dir(project_id)

    if transcript_id not in transcripts:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    transcript_text = transcripts[transcript_id]
    
    async def event_generator():
        yield f"Starting Analysis Phase for project {project_id}...\n"
        inputs = {'meeting_transcript': transcript_text}
        yield f"Running Analysis Crew with inputs: {inputs}\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew(output_dir=output_dir).run_analysis_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/design/planning")
async def run_planning(request: PhaseRequest):
    project_id = request.project_id
    output_dir = get_project_dir(project_id)

    async def event_generator():
        yield f"Starting Planning Phase for project {project_id}...\n"
        
        requirements = read_file_content(os.path.join(output_dir, 'requirements.md'))
        architecture = read_file_content(os.path.join(output_dir, 'architecture.md'))
        tech_specs = read_file_content(os.path.join(output_dir, 'tech_specs.md'))
        
        inputs = {
            'requirements_doc': requirements,
            'architecture_doc': architecture,
            'tech_specs': tech_specs
        }
        yield f"Loaded previous outputs. Running Planning Crew...\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew(output_dir=output_dir).run_planning_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/design/implementation")
async def run_implementation(request: PhaseRequest):
    project_id = request.project_id
    output_dir = get_project_dir(project_id)

    async def event_generator():
        yield f"Starting Implementation Phase for project {project_id}...\n"
        
        ticket_plan = read_file_content(os.path.join(output_dir, 'ticket_plan.md'))
        tickets = read_file_content(os.path.join(output_dir, 'tickets.json'))
        tech_specs = read_file_content(os.path.join(output_dir, 'tech_specs.md'))

        inputs = {
            'ticket_plan': ticket_plan,
            'tickets': tickets,
            'tech_specs': tech_specs
        }
        yield f"Loaded previous outputs. Running Implementation Crew...\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew(output_dir=output_dir).run_implementation_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/design/verification")
async def run_verification(request: PhaseRequest):
    project_id = request.project_id
    output_dir = get_project_dir(project_id)

    async def event_generator():
        yield f"Starting Verification Phase for project {project_id}...\n"
        
        implementation_report = read_file_content(os.path.join(output_dir, 'implementation_report.md'))
        test_plan = read_file_content(os.path.join(output_dir, 'test_plan.md'))
        
        inputs = {
            'implementation_report': implementation_report,
            'test_plan': test_plan
        }
        yield f"Loaded previous outputs. Running Verification Crew...\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew(output_dir=output_dir).run_verification_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
