'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { QueryResponse, ChatSession, ChatMessage } from '@/types';
import { LoadingSpinner } from './Loading';
import { ErrorAlert, SuccessAlert } from './Alert';
import {
  Send,
  Copy,
  Download,
  Plus,
  MessageSquare,
  Trash2,
  Database,
  Sparkles,
  Check,
  Code2,
  Table,
  TrendingUp,
  Package,
  Users,
  Search,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  response?: QueryResponse;
}

const SAMPLE_PROMPTS = [
  {
    icon: TrendingUp,
    title: 'Top Revenue Categories',
    prompt: 'Show all product categories and the total count of products in each category.',
    color: 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30',
  },
  {
    icon: Package,
    title: 'High-Value Inventory',
    prompt: 'Find the top 5 highest-priced products that currently have a stock quantity greater than 15.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    icon: Users,
    title: 'Top Spending Customers',
    prompt: 'List the top 5 customers who have spent the highest total amount on orders, along with their city and state.',
    color: 'from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30',
  },
  {
    icon: Database,
    title: 'Sales & Revenue Breakdown',
    prompt: 'What are the top 5 best-selling products based on total revenue generated? Include category name and quantity sold.',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
];

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await apiClient.getChatSessions();
      setSessions(data);
    } catch (err: unknown) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    if (activeSessionId === session.id) return;
    setActiveSessionId(session.id);
    setLoadingHistory(true);
    setError(null);
    try {
      const history = await apiClient.getChatMessages(session.id);
      const formatted: DisplayMessage[] = history.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
        response:
          m.role === 'assistant'
            ? {
                answer: m.content,
                session_id: m.session_id,
                sql: m.sql,
                columns: m.columns,
                rows: m.rows,
                row_count: m.row_count,
                status: m.status || 'success',
              }
            : undefined,
      }));
      setMessages(formatted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load session history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    try {
      await apiClient.deleteChatSession(sessionId);
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      loadSessions();
      setSuccess('Chat session deleted');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const handleSubmit = async (userPrompt?: string) => {
    const promptToSend = (userPrompt || input).trim();
    if (!promptToSend || loading) return;

    if (!userPrompt) setInput('');
    setError(null);

    setMessages((prev) => [...prev, { role: 'user', content: promptToSend }]);
    setLoading(true);

    try {
      const response = await apiClient.chat({
        message: promptToSend,
        session_id: activeSessionId || undefined,
        conversation_history: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      if (response.session_id && activeSessionId !== response.session_id) {
        setActiveSessionId(response.session_id);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.answer, response },
      ]);

      loadSessions();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process query';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = (response: QueryResponse) => {
    if (!response.rows || !response.columns) return;

    const csv = [
      response.columns,
      ...response.rows.map((row) => response.columns!.map((col) => row[col])),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString()}.csv`;
    a.click();
  };

  const copySql = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const activeSessionTitle =
    sessions.find((s) => s.id === activeSessionId)?.title || 'New Conversation';

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
      {/* ── LEFT SIDEBAR: CHAT HISTORY ─────────────────────────────────── */}
      <aside className="w-72 bg-slate-900/90 backdrop-blur-md flex flex-col border-r border-slate-800/80 select-none">
        {/* Brand & App Title */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">DB Intelligence</h2>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LangGraph + FastMCP
              </p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Sessions Header */}
        <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          <span>Recent Sessions</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
            {sessions.length}
          </span>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto opacity-30 text-slate-400" />
              <p>No prior conversations.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = activeSessionId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium shadow-md shadow-slate-900/50 border border-slate-700/80'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden pr-6">
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    />
                    <span className="truncate">{s.title || 'Conversation'}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700/80 hover:text-rose-400 rounded-lg transition-all absolute right-2"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Connection Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RBAC Protected</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
        </div>
      </aside>

      {/* ── RIGHT MAIN CONTENT AREA ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between select-none z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xs font-semibold text-slate-100 truncate max-w-md">
                {activeSessionTitle}
              </h1>
              <p className="text-[10px] text-slate-400">
                {messages.length} messages in current thread
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 transition"
            >
              Clear View
            </button>
          )}
        </header>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <LoadingSpinner />
              <p className="text-xs font-medium">Loading session history...</p>
            </div>
          ) : messages.length === 0 ? (
            /* ── EMPTY STATE / LANDING PAGE ────────────────────────────────── */
            <div className="flex flex-col items-center justify-center min-h-[80%] max-w-3xl mx-auto py-8 px-4 text-center space-y-8 animate-fadeIn">
              <div className="space-y-3">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/20 border border-blue-400/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Enterprise AI Database Assistant
                </h2>
                <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Ask questions in plain English. Powered by <strong className="text-slate-200 font-semibold">LangGraph StateGraph</strong> workflow and <strong className="text-slate-200 font-semibold">FastMCP</strong> tools for secure SQL generation.
                </p>
              </div>

              {/* Sample Prompts Grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {SAMPLE_PROMPTS.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(p.prompt)}
                      className={`group p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all duration-200 text-left flex flex-col justify-between shadow-lg shadow-slate-950/50 hover:scale-[1.01]`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${p.color} border`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-transform group-hover:translate-x-1" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white mb-1">
                          {p.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          "{p.prompt}"
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── CHAT MESSAGES LIST ────────────────────────────────────────── */
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fadeIn`}
              >
                {/* Assistant Avatar */}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs shadow-xl shadow-blue-600/10 px-5 py-3.5 text-sm font-normal'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-tl-xs shadow-xl p-5 space-y-4'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                    {message.content}
                  </p>

                  {/* Assistant Extended Output (SQL & Data Table) */}
                  {message.response && (
                    <div className="space-y-4 pt-2 border-t border-slate-800/80">
                      {/* Executed SQL Box */}
                      {message.response.sql && (
                        <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800/80 font-mono text-xs overflow-x-auto shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5" />
                              Executed SQL Query
                            </span>
                            <button
                              onClick={() => copySql(message.response!.sql!, index)}
                              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1 rounded-md border border-slate-700/60 transition"
                              title="Copy SQL query"
                            >
                              {copiedIndex === index ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy SQL</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-slate-300 overflow-x-auto p-1 leading-relaxed">
                            {message.response.sql}
                          </pre>
                        </div>
                      )}

                      {/* Query Results Data Table */}
                      {message.response.rows && message.response.rows.length > 0 && (
                        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                              <Table className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Query Results ({message.response.row_count} rows)</span>
                            </div>
                            <button
                              onClick={() => downloadResults(message.response!)}
                              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700/60 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>Export CSV</span>
                            </button>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-slate-800/80 max-h-56 scrollbar-thin scrollbar-thumb-slate-800">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-slate-300 font-semibold">
                                <tr>
                                  {message.response.columns?.map((col) => (
                                    <th key={col} className="p-2.5 whitespace-nowrap">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                                {message.response.rows.slice(0, 10).map((row, i) => (
                                  <tr key={i} className="hover:bg-slate-800/40 transition">
                                    {message.response!.columns?.map((col) => (
                                      <td key={col} className="p-2.5 max-w-xs truncate">
                                        {String(row[col])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {message.response.rows.length > 10 && (
                            <p className="text-[10px] text-slate-500 text-center font-mono">
                              Showing first 10 of {message.response.rows.length} rows. Click Export CSV to download complete dataset.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs p-4 flex items-center gap-3">
                <LoadingSpinner />
                <span className="text-xs text-slate-400 font-medium">
                  LangGraph workflow & FastMCP tools executing...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="px-6 pb-2">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}
        {success && (
          <div className="px-6 pb-2">
            <SuccessAlert message={success} onClose={() => setSuccess(null)} />
          </div>
        )}

        {/* ── FLOATING INPUT BAR ────────────────────────────────────────── */}
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500/80 transition-all duration-200"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any database question (e.g. 'Show top 5 sales regions')..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
