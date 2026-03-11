'use client'; // Modified

import FileManager from '@/components/FileManager';
import { useEffect, useRef, useState } from 'react';

  type Phase = 'Analysis' | 'Planning' | 'Implementation' | 'Verification';
  type PhaseStatus = 'pending' | 'running' | 'completed' | 'approved';

  interface AgentConfig {
    role: string;
    goal: string;
    backstory: string;
  }

  const agentImages: Record<string, string> = {
    'AI Product Owner': '/agent-product-owner.png',
    'AI Architect': '/agent-architect.png',
    'Tech Spec Generator': '/agent-tech-lead.png',
    'Ticket Generator': '/agent-ticket-gen.png',
    'Ticket Orchestrator': '/agent-ticket-orch.png', // Operator
    'Test Generator': '/agent-test-gen.png', // VR
  };

  export default function Dashboard() {
    const [activePhase, setActivePhase] = useState<Phase>('Analysis');
    const [projectId, setProjectId] = useState<string>(`project-${new Date().toISOString().slice(0, 10)}`);
    const [phaseStatuses, setPhaseStatuses] = useState<Record<Phase, PhaseStatus>>({
      Analysis: 'pending',
      Planning: 'pending',
      Implementation: 'pending',
      Verification: 'pending'
    });
    
    const [transcriptId, setTranscriptId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [logs, setLogs] = useState<string[]>([
      '[SYSTEM] Dashboard initialized ready.',
      '[SYSTEM] Waiting for call transcript upload...',
    ]);
    const [agents, setAgents] = useState<Record<string, AgentConfig>>({});
    const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'logs' | 'chat'>('logs');
  const logsEndRef = useRef<HTMLDivElement>(null);

    const phases: Phase[] = ['Analysis', 'Planning', 'Implementation', 'Verification'];

    useEffect(() => {
      // Fetch agents configuration
      const fetchAgents = async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const response = await fetch(`${API_URL}/agents`);
          if (response.ok) {
            const data = await response.json();
            setAgents(data);
          }
        } catch (error) {
          console.error('Failed to fetch agents:', error);
        }
      };
      fetchAgents();
    }, []);

    useEffect(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (message: string) => {
      setLogs(prev => [...prev, message]);
    };

    const parseAgentActivity = (line: string) => {
      // Robust ANSI stripping regex
      // eslint-disable-next-line no-control-regex
      const cleanLine = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
      
      // CrewAI log pattern for working agent
      // Example: [DEBUG]: == Working Agent: Product Owner
      
      // Strategy 1: Reverse lookup - check if line contains known agent roles
      // This is more robust against format changes
      const knownRoles = Object.values(agents).map(a => a.role);
      for (const role of knownRoles) {
          // Create variants: "AI Product Owner" -> "Product Owner"
          const variants = [role, role.replace(/^AI\s+/, '')];
          
          for (const variant of variants) {
              if (variant.length < 3) continue;
              
              // Check if line mentions this agent in a "working" context
              // Matches: "Working Agent: Product Owner", "Agent Product Owner starting", etc.
              const pattern = new RegExp(`(?:Working|Agent).*?${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
              
              if (pattern.test(cleanLine)) {
                  console.log('[DEBUG] Matched known agent in log:', role);
                  setActiveAgent(role);
                  return; // Found a match, stop processing
              }
          }
      }

      // Strategy 2: Regex extraction (Fallback)
      // Also handle: "Agent: Product Owner" or similar variations
      let detectedName: string | null = null;
      
      const patterns = [
        /Working Agent:\s*(.+?)(?:\s*$|\s*\[)/i,
        /Agent:\s*(.+?)(?:\s*$|\s*\[)/i,
        /^\[.*?\]\s*(\w[\w\s]*?)\s*is working/i
      ];

      for (const pattern of patterns) {
        const match = cleanLine.match(pattern);
        if (match && match[1]) {
            detectedName = match[1].trim();
            break;
        }
      }
      
      if (detectedName) {
        // const detectedName = match[1].trim(); // Removed, using variable
        console.log('[DEBUG] Detected agent name from log:', detectedName);

        // Find matching agent in config (flexible matching)
        const agentEntry = Object.values(agents).find(a => {
            const configRole = a.role.toLowerCase();
            const logRole = detectedName!.toLowerCase();
            return configRole === logRole || configRole.includes(logRole) || logRole.includes(configRole);
        });

        if (agentEntry) {
            console.log('[DEBUG] Matched with config agent:', agentEntry.role);
            setActiveAgent(agentEntry.role);
        } else {
             // Fallback: try to set exactly what we found if no config match (might match UI if state is loose)
             console.log('[DEBUG] No config match, using detected name:', detectedName);
             setActiveAgent(detectedName);
        }
      }
    };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    addLog(`[UPLOAD] Uploading file: ${file.name}...`);
    
    const formData = new FormData();
    formData.append('file', file);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_URL}/upload_transcript`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setTranscriptId(data.transcript_id);
      addLog(`[SYSTEM] Upload successful. Transcript ID: ${data.transcript_id}`);
      addLog(`[SYSTEM] Ready to start Analysis phase.`);
    } catch (error) {
      addLog(`[ERROR] Upload failed: ${error}`);
      addLog(`[HINT] Ensure backend is running at ${API_URL}`);
    }
  };

  const runPhase = async (phase: Phase) => {
    if (!transcriptId) {
      addLog('[ERROR] No transcript uploaded.');
      return;
    }

    setPhaseStatuses(prev => ({ ...prev, [phase]: 'running' }));
    setActiveAgent(null);
    addLog(`[SYSTEM] Starting ${phase} phase...`);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const endpoint = phase.toLowerCase();
      const response = await fetch(`${API_URL}/design/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript_id: transcriptId, project_id: projectId }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        lines.filter(line => line.trim()).forEach(line => {
          parseAgentActivity(line);
          addLog(`[${phase.toUpperCase()}] ${line}`);
        });
      }

      if (buffer.trim()) {
        addLog(`[${phase.toUpperCase()}] ${buffer.trim()}`);
      }

      setPhaseStatuses(prev => ({ ...prev, [phase]: 'completed' }));
      addLog(`[SYSTEM] ${phase} phase completed. Waiting for approval.`);

    } catch (error) {
      addLog(`[ERROR] Phase ${phase} failed: ${error}`);
      setPhaseStatuses(prev => ({ ...prev, [phase]: 'pending' })); // Reset or error state
    }
  };

  const approvePhase = () => {
    const currentIndex = phases.indexOf(activePhase);
    setPhaseStatuses(prev => ({ ...prev, [activePhase]: 'approved' }));
    addLog(`[SYSTEM] ${activePhase} phase approved.`);

    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      setActivePhase(nextPhase);
      addLog(`[SYSTEM] Ready to start ${nextPhase} phase.`);
    } else {
      addLog('[SYSTEM] All phases completed and approved!');
    }
  };

  const currentStatus = phaseStatuses[activePhase];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30 relative">
      <header className="flex items-center justify-between px-4 h-[50px] border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <img src="/logo-big-office.png" alt="Software Agency Crew Logo" className="h-8 w-auto" />
            <div className="h-3 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
                 <button className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800">
                    <span>Configurations</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                 </button>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-medium text-green-400">System Online</span>
            </div>

            <button className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800" aria-label="Settings">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
            </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-50px)] overflow-hidden">
        
        {/* Left Column: Controls & Status */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto h-full pr-2">
          
          {/* Project Setup */}
          <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Project Settings</h2>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Project Name (ID)</label>
                    <input 
                        type="text" 
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>
          </section>

          {/* File Upload Area */}
          <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-1 shadow-sm">
            <div 
              className={`
                relative rounded-lg border-2 border-dashed p-8 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center gap-4 cursor-pointer
                ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'}
                ${transcriptId ? 'border-green-500/50 bg-green-500/5' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <svg className={`w-6 h-6 ${transcriptId ? 'text-green-500' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {transcriptId ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  )}
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {transcriptId ? 'Transcript Uploaded' : 'Upload Call Transcript'}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {transcriptId ? 'Ready to process' : 'Drag and drop or click to browse'}
                </p>
              </div>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileSelect}
                disabled={!!transcriptId}
              />
            </div>
          </section>

          {/* Progress Stepper */}
          <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6">Project Phase</h2>
            <div className="space-y-0 relative">
              {/* Vertical Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-zinc-800 z-0"></div>
              
              {phases.map((phase, index) => {
                const isActive = activePhase === phase;
                const status = phaseStatuses[phase];
                const isCompleted = status === 'completed' || status === 'approved';
                const isPending = status === 'pending';
                const isRunning = status === 'running';

                return (
                  <div key={phase} className="relative z-10 flex items-start gap-4 pb-8 last:pb-0 group">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 shrink-0 bg-zinc-900
                      ${isActive || isRunning ? 'border-blue-500 text-blue-500 shadow-lg shadow-blue-500/20' : ''}
                      ${status === 'approved' ? 'border-green-500 text-green-500 bg-green-500/10' : ''}
                      ${status === 'completed' ? 'border-yellow-500 text-yellow-500' : ''}
                      ${isPending && !isActive ? 'border-zinc-700 text-zinc-600' : ''}
                    `}>
                      {status === 'approved' ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="pt-1">
                      <h3 className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                        {phase}
                      </h3>
                      {isRunning && (
                        <p className="text-xs text-blue-400 mt-1 animate-pulse">Processing...</p>
                      )}
                      {status === 'completed' && (
                        <p className="text-xs text-yellow-400 mt-1">Waiting Approval</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Action Buttons */}
          <section className="grid grid-cols-1 gap-3">
            {currentStatus === 'pending' && (
              <button 
                onClick={() => runPhase(activePhase)}
                disabled={!transcriptId}
                className={`
                  flex items-center justify-center gap-2 w-full font-medium py-3 px-4 rounded-lg shadow-lg transition-all active:scale-[0.98]
                  ${!transcriptId 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}
                `}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start {activePhase}
              </button>
            )}
            
            {currentStatus === 'running' && (
              <button disabled className="flex items-center justify-center gap-2 w-full bg-zinc-800 text-zinc-400 font-medium py-3 px-4 rounded-lg border border-zinc-700 cursor-wait">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Processing...
              </button>
            )}

            {currentStatus === 'completed' && (
              <button 
                onClick={approvePhase}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve & Continue
              </button>
            )}

            {currentStatus === 'approved' && (
               <div className="text-center text-sm text-green-500 font-medium py-2">
                 Phase Approved
               </div>
            )}
          </section>

        </div>

        {/* Middle Column: File Manager & Terminal */}
        <div className="lg:col-span-6 flex flex-col gap-4 h-full overflow-hidden pb-4">
           <div className="h-3/5 min-h-0 shrink-0">
               <FileManager projectId={projectId} />
           </div>
           <div className="bg-black rounded-xl border border-zinc-800 shadow-2xl flex flex-col flex-1 overflow-hidden min-h-0 shrink-0">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                  <button
                    onClick={() => setViewMode('logs')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === 'logs' 
                        ? 'bg-zinc-800 text-zinc-200 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Terminal Logs
                  </button>
                  <button
                    onClick={() => setViewMode('chat')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === 'chat' 
                        ? 'bg-zinc-800 text-zinc-200 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Team Chat
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">
                  {viewMode === 'logs' ? 'crew-engine-output' : 'crew-chat-channel'}
                </span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
              {/* Logs View */}
              {viewMode === 'logs' && (
                <div className="absolute inset-0 p-6 overflow-y-auto font-mono text-sm space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <span className="text-zinc-600 select-none w-8 text-right shrink-0">{i + 1}</span>
                      <span className={`break-words ${
                        log.includes('[SYSTEM]') ? 'text-blue-400' :
                        log.includes('[UPLOAD]') ? 'text-yellow-400' :
                        log.includes('[ERROR]') ? 'text-red-400' :
                        log.includes('[ANALYSIS]') ? 'text-purple-400' :
                        log.includes('[PLANNING]') ? 'text-cyan-400' :
                        log.includes('[IMPLEMENTATION]') ? 'text-orange-400' :
                        log.includes('[VERIFICATION]') ? 'text-emerald-400' :
                        'text-zinc-300'
                      }`}>
                        {log}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} className="flex gap-3">
                    <span className="text-zinc-600 select-none w-8 text-right shrink-0">{logs.length + 1}</span>
                    <span className="text-zinc-500 animate-pulse">_</span>
                  </div>
                </div>
              )}

              {/* Chat View */}
              {viewMode === 'chat' && (
                <div className="absolute inset-0 flex flex-col bg-zinc-950/50">
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-xs font-bold text-blue-400">
                        PM
                      </div>
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-zinc-300">Product Owner</span>
                          <span className="text-[10px] text-zinc-600">Just now</span>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 text-sm text-zinc-300">
                          I've analyzed the requirements. We should focus on the core user flow first.
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-xs font-bold text-purple-400">
                        YOU
                      </div>
                      <div className="flex flex-col gap-1 max-w-[80%] items-end">
                         <div className="flex items-baseline gap-2 flex-row-reverse">
                          <span className="text-xs font-bold text-zinc-300">User</span>
                          <span className="text-[10px] text-zinc-600">Just now</span>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-sm text-blue-100">
                          Sounds good. Let's proceed with the authentication module.
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type a message to the crew..." 
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Right Column: Agents */}
      <div className="lg:col-span-3 h-full overflow-y-auto pb-4 pr-2">
          {Object.keys(agents).length > 0 && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              {Object.values(agents).map((agent, i) => {
                const isActive = activeAgent && (
                    activeAgent.toLowerCase() === agent.role.trim().toLowerCase() ||
                    agent.role.trim().toLowerCase().includes(activeAgent.toLowerCase()) ||
                    activeAgent.toLowerCase().includes(agent.role.trim().toLowerCase())
                );
                
                if (isActive) {
                    // console.log('[DEBUG] Active agent rendered:', agent.role);
                }

                const agentImage = agentImages[agent.role.trim()];

                return (
                  <div 
                    key={i} 
                    className={`
                      flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-300
                      ${isActive 
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10 scale-105 z-10' 
                        : 'bg-zinc-900 border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'}
                    `}
                  >
                    <div 
                      className={`
                        w-20 h-20 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 overflow-hidden
                        ${!agentImage && isActive ? 'bg-blue-500 text-white animate-pulse' : ''}
                        ${!agentImage && !isActive ? 'bg-zinc-800 text-zinc-500' : ''}
                        ${agentImage && isActive ? 'ring-2 ring-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : ''}
                        ${agentImage ? 'bg-zinc-800' : ''}
                      `}
                      style={agentImage ? {
                          backgroundImage: `url(${agentImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          imageRendering: 'pixelated'
                      } : {}}
                    >
                      {!agentImage && agent.role.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="text-center w-full">
                      <p className={`text-xs font-medium truncate w-full ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                        {agent.role}
                      </p>
                      {isActive && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-200"></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      </main>
    </div>
  );
}
