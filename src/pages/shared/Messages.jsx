import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import { messageAPI } from '../../api';
import toast from 'react-hot-toast';

export default function Messages() {
  const { userId: paramUserId } = useParams();
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [conversations, setConvos]       = useState([]);
  const [activeUserId, setActiveUserId]  = useState(paramUserId ? Number(paramUserId) : null);
  const [activeUser, setActiveUser]      = useState(null);
  const [messages, setMessages]          = useState([]);
  const [text, setText]                  = useState('');
  const [loadingConvos, setLoadingConvos]= useState(true);
  const [loadingThread, setLoadingThread]= useState(false);
  const [sending, setSending]            = useState(false);
  const bottomRef = useRef();

  // Load conversation list
  const loadConversations = useCallback(() => {
    messageAPI.conversations()
      .then(({ data }) => setConvos(data || []))
      .catch(() => {})
      .finally(() => setLoadingConvos(false));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load thread when activeUserId changes
  useEffect(() => {
    if (!activeUserId) return;
    setLoadingThread(true);
    messageAPI.thread(activeUserId)
      .then(({ data }) => {
        setMessages(data || []);
        // mark convos as read locally
        setConvos((prev) =>
          prev.map((c) => c.userId === activeUserId ? { ...c, unreadCount: 0 } : c)
        );
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingThread(false));
  }, [activeUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync active user display name from convos
  useEffect(() => {
    if (activeUserId && conversations.length > 0) {
      const convo = conversations.find((c) => c.userId === activeUserId);
      if (convo) setActiveUser(convo);
    }
  }, [activeUserId, conversations]);

  // Handle direct URL /messages/:userId (e.g. from Candidate Search → Message)
  useEffect(() => {
    if (paramUserId) setActiveUserId(Number(paramUserId));
  }, [paramUserId]);

  const selectConvo = (convo) => {
    setActiveUserId(convo.userId);
    setActiveUser(convo);
    navigate(`/messages/${convo.userId}`, { replace: true });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try {
      const { data } = await messageAPI.send(activeUserId, body);
      setMessages((prev) => [...prev, data]);
      loadConversations(); // refresh list to show latest message
    } catch {
      toast.error('Failed to send message');
      setText(body); // restore on fail
    } finally {
      setSending(false);
    }
  };

  const initials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const timeLabel = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <Layout pageTitle="Messages" pageSubtitle="Chat with recruiters and candidates">
      <div className="flex bg-white border border-gray-100 rounded-xl overflow-hidden"
           style={{ height: 'calc(100vh - 120px)' }}>

        {/* ── Left panel: conversation list ── */}
        <div className="w-64 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-xs text-gray-400">No conversations yet</p>
                <p className="text-[11px] text-gray-300 mt-1">
                  Start a chat from Candidates or Candidate Search
                </p>
              </div>
            ) : (
              conversations.map((convo) => {
                const isActive = activeUserId === convo.userId;
                return (
                  <button
                    key={convo.userId}
                    onClick={() => selectConvo(convo)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      border-b border-gray-50 hover:bg-gray-50
                      ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center
                                    text-blue-700 text-xs font-bold flex-shrink-0 overflow-hidden">
                      {convo.profilePicture
                        ? <img src={convo.profilePicture} alt="" className="w-full h-full object-cover" />
                        : initials(convo.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate font-medium
                          ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                          {convo.fullName}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-bold
                                           rounded-full flex items-center justify-center flex-shrink-0">
                            {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right panel: chat thread ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Thread header */}
          <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-b border-gray-100 min-h-[52px]">
            {activeUser ? (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                                text-blue-700 text-xs font-bold overflow-hidden">
                  {activeUser.profilePicture
                    ? <img src={activeUser.profilePicture} alt="" className="w-full h-full object-cover" />
                    : initials(activeUser.fullName)}
                </div>
                <p className="text-sm font-medium text-gray-900">{activeUser.fullName}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                {activeUserId ? 'Loading…' : 'Select a conversation'}
              </p>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {!activeUserId ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-5xl mb-3">💬</p>
                <p className="text-sm text-gray-400">Pick a conversation to start chatting</p>
              </div>
            ) : loadingThread ? (
              <Spinner />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-4xl mb-2">👋</p>
                <p className="text-sm text-gray-400">No messages yet — say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                // senderId may come as msg.senderId or msg.sender.id depending on serialisation
                const senderId = msg.senderId ?? msg.sender?.id;
                const isMine = senderId === user?.userId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</p>
                      <p className={`text-[10px] mt-0.5 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                        {timeLabel(msg.sentAt || msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar — only shown when a convo is selected */}
          {activeUserId && (
            <form onSubmit={sendMessage}
              className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-t border-gray-100">
              <input
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) sendMessage(e);
                }}
                disabled={sending}
                autoFocus
              />
              <button type="submit" disabled={sending || !text.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl
                           hover:bg-blue-700 disabled:opacity-40 transition font-medium flex-shrink-0">
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}