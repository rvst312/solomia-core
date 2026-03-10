import asyncio
import os
import sys
import queue
from typing import Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
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

async def stream_crew_execution(crew_runner_func):
    q = queue.Queue()
    
    def run_crew_with_capture():
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        writer = ThreadSafeQueueWriter(q)
        sys.stdout = writer
        sys.stderr = writer
        try:
            return crew_runner_func()
        finally:
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
    if transcript_id not in transcripts:
        raise HTTPException(status_code=404, detail="Transcript not found")
    
    transcript_text = transcripts[transcript_id]
    
    async def event_generator():
        yield f"Starting Analysis Phase...\n"
        inputs = {'meeting_transcript': transcript_text}
        yield f"Running Analysis Crew with inputs: {inputs}\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew().run_analysis_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/design/planning")
async def run_planning(request: PhaseRequest):
    async def event_generator():
        yield f"Starting Planning Phase...\n"
        
        requirements = read_file_content('output/requirements.md')
        architecture = read_file_content('output/architecture.md')
        tech_specs = read_file_content('output/tech_specs.md')
        
        inputs = {
            'requirements_doc': requirements,
            'architecture_doc': architecture,
            'tech_specs': tech_specs
        }
        yield f"Loaded previous outputs. Running Planning Crew...\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew().run_planning_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/design/implementation")
async def run_implementation(request: PhaseRequest):
    async def event_generator():
        yield f"Starting Implementation Phase...\n"
        
        ticket_plan = read_file_content('output/ticket_plan.md')
        tickets = read_file_content('output/tickets.json')
        tech_specs = read_file_content('output/tech_specs.md')

        inputs = {
            'ticket_plan': ticket_plan,
            'tickets': tickets,
            'tech_specs': tech_specs
        }
        yield f"Loaded previous outputs. Running Implementation Crew...\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew().run_implementation_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

@app.post("/design/verification")
async def run_verification(request: PhaseRequest):
    async def event_generator():
        yield f"Starting Verification Phase...\n"
        
        implementation_report = read_file_content('output/implementation_report.md')
        test_plan = read_file_content('output/test_plan.md')
        
        inputs = {
            'implementation_report': implementation_report,
            'test_plan': test_plan
        }
        yield f"Loaded previous outputs. Running Verification Crew...\n"
        
        async for log in stream_crew_execution(lambda: SoftwareAgencyCrew().run_verification_phase(inputs=inputs)):
            yield log

    return StreamingResponse(event_generator(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
