import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bot, Send, User, Sparkles, AlertCircle, Loader } from 'lucide-react';

const AIAssistant = () => {
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Hello Investigator. I am TraceScope AI. Please select an active case context from the dropdown above, and ask me to summarize the risks or correlate findings from the forensic logs.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCases = async () => {
    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const response = await axios.get(`${baseUrl}/api/cases`);
      setCases(response.data);
      if (response.data.length > 0) {
        setActiveCaseId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeCaseId) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const baseUrl = window.location.port === '5173' ? 'http://localhost:5000' : '';
      const response = await axios.post(`${baseUrl}/api/ai/chat`, {
        case_id: activeCaseId,
        message: userMsg
      });

      // Simulate a slight delay for realistic typing effect
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: response.data.response }]);
        setIsTyping(false);
      }, 800);
      
    } catch (error) {
      console.error('Failed to communicate with AI:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'ai', content: 'There was an error communicating with the heuristic analysis engine.' }]);
    }
  };

  // Simple markdown-style parser for bold and newlines
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Header and Context Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ts-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-ts-purple" /> AI Investigation Assistant
          </h1>
          <p className="text-sm text-ts-text-muted mt-1">Chat with your forensic telemetry using the heuristic synthesis engine.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-ts-border shadow-sm">
          <span className="text-xs font-bold text-ts-text-muted uppercase">Context:</span>
          <select 
            value={activeCaseId} 
            onChange={(e) => setActiveCaseId(e.target.value)}
            className="bg-transparent border-none text-sm font-semibold text-ts-blue focus:ring-0 cursor-pointer"
          >
            <option value="" disabled>Select a Case</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Window */}
      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-ts-blue text-white' : 'bg-gradient-to-br from-ts-purple to-purple-600 text-white'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm ${
                msg.role === 'user' 
                  ? 'bg-ts-blue text-white rounded-tr-sm' 
                  : 'bg-white border border-ts-border text-ts-text rounded-tl-sm'
              }`}>
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ts-purple to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-ts-border rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <Loader className="w-4 h-4 text-ts-purple animate-spin" />
                <span className="text-xs text-ts-text-muted">Analyzing evidence graph...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-ts-border">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeCaseId ? "Ask AI to summarize findings or risks..." : "Select a case context first..."}
              disabled={!activeCaseId || isTyping}
              className="w-full bg-gray-50 border border-gray-300 text-ts-text text-sm rounded-xl focus:ring-ts-purple focus:border-ts-purple block p-4 pr-12 disabled:opacity-50 transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || !activeCaseId || isTyping}
              className="absolute right-2 p-2 bg-ts-purple text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {!activeCaseId && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> You must select a Case Context before chatting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
