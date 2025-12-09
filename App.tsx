
import React, { useState, useRef, useEffect } from 'react';
import { processFiles } from './utils/fileUtils';
import { sendMessageToGemini } from './services/geminiService';
import { Message, Attachment, LoadingState } from './types';
import { ContextAnalysis } from './utils/chandraAnalysis';
import ResponseRenderer from './components/ResponseRenderer';

// --- Icons ---
const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const BrainCircuitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c0 .039.029.1.087.168.06.068.169.132.311.132s.251-.064.311-.132c.058-.068.087-.129.087-.168L19.8 15.3M5 14.5l-1.402 1.402c0 .039-.029.1-.087.168-.06.068-.169.132-.311.132s-.251-.064-.311-.132c-.058-.068-.087-.129-.087-.168L5 14.5" />
    <circle cx="12" cy="12" r="3" className="opacity-50" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v.01" />
  </svg>
);

const ReticleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-blue-500 animate-spin-slow">
    <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </svg>
);


// --- Splash Screen Component ---
const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // slight delay after 100%
          return 100;
        }
        return prev + 2; // Speed of loader
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
        <div className="relative text-blue-400">
           <BrainCircuitIcon />
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight text-center">
        AMLA <span className="text-gray-500 text-lg font-light block md:inline md:ml-2">The Adaptive Learning Assistant</span>
      </h1>
      <p className="text-gray-400 text-sm mb-12 tracking-wider uppercase">Context before Code</p>
      
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-blue-400/80 font-mono animate-pulse">Initializing Learning Engine...</p>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "System Initialized. Multimodal inputs enabled.\n\nI am AMLA. I will analyze your learning context and adjust my support level accordingly. \n\nTo begin, please paste your code, upload an error screenshot, or describe your goal.",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  
  // Context Analysis State
  const [analysis, setAnalysis] = useState<ContextAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingState]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setLoadingState('uploading');
      const newAttachments = await processFiles(e.target.files);
      setAttachments(prev => [...prev, ...newAttachments]);
      setLoadingState('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!inputText.trim() && attachments.length === 0) || loadingState !== 'idle') return;

    const currentUserContent = inputText;
    const currentUserAttachments = [...attachments];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentUserContent,
      attachments: currentUserAttachments,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setLoadingState('thinking');

    try {
      const response = await sendMessageToGemini(messages, currentUserContent, currentUserAttachments);
      
      // Update Context Status
      if (response.analysis) {
        setAnalysis(response.analysis);
      }

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text || "Analysis complete. Proceeding...",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "System Error: Unable to complete analysis cycle. Please retry.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render Splash Logic
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // --- Main Layout ---
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md z-20 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-center">
            <BrainCircuitIcon />
          </div>
          <div>
            <h1 className="font-bold text-gray-100 tracking-tight">AMLA</h1>
            <div className="text-[10px] text-gray-500 font-mono leading-none">V3.1 // ADAPTIVE ENGINE</div>
          </div>
        </div>
        
        {/* Mobile: Simple Status Dot */}
        <div className="md:hidden flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${analysis ? 'bg-green-500' : 'bg-gray-600 animate-pulse'}`}></div>
        </div>
      </header>

      {/* Body: Flex container for Chat + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative min-w-0">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-8 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {msg.role === 'model' && (
                    <div className="flex-none w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mt-1">
                      <span className="text-indigo-400 text-[10px] font-bold">AI</span>
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] md:max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 justify-end">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-700 w-24 h-24 bg-gray-900">
                            {att.mimeType.startsWith('image/') ? (
                              <img src={att.previewUrl} alt="attachment" className="w-full h-full object-cover opacity-80" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs text-gray-400">
                                <span className="font-mono break-all">{att.mimeType.split('/')[1]}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600/90 text-white rounded-br-none backdrop-blur-sm' 
                        : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-none w-full'
                    }`}>
                      {msg.role === 'model' ? (
                        <ResponseRenderer content={msg.content} />
                      ) : (
                        <div className="whitespace-pre-wrap font-light">{msg.content}</div>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-600 px-1 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {loadingState === 'thinking' && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-none w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <ReticleIcon />
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-3 rounded-2xl rounded-bl-none bg-gray-900 border border-gray-800">
                    <span className="text-xs text-gray-400 font-mono animate-pulse">Analyzing Context...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        {/* Status Panel Sidebar (Desktop) */}
        <aside className="hidden md:block w-72 bg-gray-950/50 border-l border-gray-800 p-6 flex flex-col">
          <div className="mb-6 flex items-center gap-2 text-gray-400">
            <ReticleIcon />
            <h2 className="text-xs font-bold uppercase tracking-widest">Session Context</h2>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</div>
              <div className="text-sm font-mono text-green-400">
                {analysis ? "ADAPTIVE" : "AWAITING INPUT"}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Interaction Mode</div>
              <div className={`text-xs font-mono font-bold break-all ${
                analysis?.status_code.includes("SUPPORT") ? "text-yellow-400" :
                analysis?.status_code.includes("GUIDANCE") ? "text-blue-400" :
                "text-green-400"
              }`}>
                {analysis?.status_code || "N/A"}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Support Level</div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-800">
                  <div 
                    style={{ width: `${(analysis?.support_level || 0) * 100}%` }} 
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                      (analysis?.support_level || 0) > 0.6 ? 'bg-yellow-500' : 
                      (analysis?.support_level || 0) > 0.4 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                  ></div>
                </div>
                <div className="text-right text-xs font-mono text-gray-400">
                  {analysis?.support_level?.toFixed(2) || "0.00"}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
               <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tone</div>
               <div className="text-xs text-gray-300 capitalize">
                 {analysis?.dominant_mode || "-"}
               </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 text-[10px] text-gray-600 font-mono leading-relaxed">
             Context Engine active. Real-time adaptation enabled.
          </div>
        </aside>
      </div>

      {/* Footer / Input Area */}
      <footer className="flex-none p-4 md:p-6 bg-gray-950 border-t border-gray-800 z-20">
        <div className="max-w-3xl mx-auto">
          
          {attachments.length > 0 && (
            <div className="flex gap-3 mb-3 overflow-x-auto pb-2 scrollbar-hide">
              {attachments.map((att, i) => (
                <div key={i} className="relative flex-none w-16 h-16 rounded-md border border-gray-700 bg-gray-900 group">
                  {att.mimeType.startsWith('image/') ? (
                    <img src={att.previewUrl} className="w-full h-full object-cover rounded-md opacity-70" alt="preview" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-mono uppercase">
                      {att.mimeType.split('/')[1]}
                    </div>
                  )}
                  <button 
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                  >
                    <XMarkIcon />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 p-1.5 bg-gray-900 border border-gray-700 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all shadow-xl">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,video/mp4"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-all group relative"
              title="Upload files"
            >
              <PaperClipIcon />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700">
                Upload Files (PDF, Image, Code)
              </span>
            </button>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste code, upload your error image, or drag a PDF here to begin..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500 resize-none py-3.5 max-h-32 min-h-[50px] text-sm"
              rows={1}
              style={{ height: 'auto', minHeight: '50px' }}
            />
            
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && attachments.length === 0) || loadingState !== 'idle'}
              className="p-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-800 transition-all shadow-lg"
            >
              {loadingState === 'thinking' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <SendIcon />
              )}
            </button>
          </div>
          <div className="text-center mt-2 flex justify-center gap-4">
             <span className="text-[10px] text-gray-600 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
               Multimodal Ready
             </span>
             <span className="text-[10px] text-gray-600 flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
               Gemini 3 Pro
             </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
