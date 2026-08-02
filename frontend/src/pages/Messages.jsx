import { useEffect, useRef, useState } from 'react';
import { listConversations, getMessages } from '../api/messaging.api';
import { useSocket } from '../hooks/useSocket';
import useAuthStore from '../store/authStore';
import NewConversationModal from '../components/NewConversationModal';
import './Messages.css';

function initials(text) {
  return (text || '?').slice(0, 2).toUpperCase();
}

function getConversationLabel(conv, currentUserId) {
  if (conv.isGroup) return conv.title || 'Groupe';
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  return other?.user?.email || 'Conversation';
}

function Messages() {
  const { user } = useAuthStore();
  const { socket, connected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewConv, setShowNewConv] = useState(false);
  const messagesEndRef = useRef(null);

  // Charge la liste des conversations au montage
  useEffect(() => {
    async function load() {
      try {
        const data = await listConversations();
        setConversations(data);
        if (data.length > 0) setActiveConvId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Charge l'historique + rejoint la room dès qu'une conversation est sélectionnée
  useEffect(() => {
    if (!activeConvId) return;

    async function loadMessages() {
      try {
        const data = await getMessages(activeConvId);
        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadMessages();

    if (socket) {
      socket.emit('conversation:join', { conversationId: activeConvId });
    }
  }, [activeConvId, socket]);

  // Écoute les nouveaux messages en temps réel
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message) {
      if (message.conversationId === activeConvId) {
        setMessages((prev) => [...prev, message]);
      }
    }

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, activeConvId]);

  // Scroll auto vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !socket || !activeConvId) return;

    socket.emit('message:send', { conversationId: activeConvId, content: input.trim() });
    setInput('');
  }

  if (loading) return <p style={{ color: 'var(--sage)' }}>Chargement...</p>;

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="msg-page">
      <div className="msg-conv-panel">
        <div className="msg-conv-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Messagerie</h1>
            <button className="msg-new-btn" onClick={() => setShowNewConv(true)}>+</button>
          </div>
          {!connected && <div className="msg-offline-badge">Connexion...</div>}
        </div>
        <div className="msg-conv-list">
          {conversations.length === 0 && (
            <p className="msg-empty">Aucune conversation pour le moment.</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`msg-conv-item ${conv.id === activeConvId ? 'active' : ''}`}
              onClick={() => setActiveConvId(conv.id)}
            >
              <div className={`msg-conv-avatar ${conv.isGroup ? 'group' : ''}`}>
                {initials(getConversationLabel(conv, user.id))}
              </div>
              <div className="msg-conv-body">
                <div className="msg-conv-name">{getConversationLabel(conv, user.id)}</div>
                <div className="msg-conv-preview">
                  {conv.messages?.[0]?.content || 'Aucun message'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="msg-chat">
        {!activeConv ? (
          <div className="msg-chat-empty">Sélectionnez une conversation</div>
        ) : (
          <>
            <div className="msg-chat-header">
              <div className="msg-conv-avatar">{initials(getConversationLabel(activeConv, user.id))}</div>
              <div className="msg-chat-title">{getConversationLabel(activeConv, user.id)}</div>
            </div>

            <div className="msg-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`msg-bubble-row ${message.senderId === user.id ? 'mine' : ''}`}
                >
                  <div className="msg-bubble-content">
                    <div className="msg-bubble">{message.content}</div>
                    <div className="msg-bubble-time">
                      {new Date(message.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="msg-composer" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Écrire un message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="msg-send-btn">➤</button>
            </form>
          </>
        )}
      </div>

      {showNewConv && (
        <NewConversationModal
          onClose={() => setShowNewConv(false)}
          onCreated={(conv) => {
            setConversations((prev) => [conv, ...prev]);
            setActiveConvId(conv.id);
          }}
        />
      )}
    </div>
  );
}

export default Messages;