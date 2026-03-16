import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { useLocation } from 'react-router-dom';
import { AssistantMenuOption, chatService } from '../../services/api/chatService';
import './SchoolAssistantWidget.css';

type AssistantMessage = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  createdAt: string;
  options?: AssistantMenuOption[];
  table?: {
    columns: string[];
    rows: string[][];
  };
};

const extractTableFromMeta = (meta: any): AssistantMessage['table'] => {
  const table = meta?.table;
  if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return undefined;
  const columns = table.columns.map((c: any) => String(c));
  const rows = table.rows.map((r: any) => (Array.isArray(r) ? r.map((cell: any) => String(cell)) : []));
  return { columns, rows };
};

const SchoolAssistantWidget: React.FC = () => {
  const location = useLocation();
  const isChatPage = location.pathname.includes('/chat');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'assistant-welcome',
      sender: 'assistant',
      text: 'Hello! I am your School Assistant. Please choose an option to continue.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isMenuLoaded, setIsMenuLoaded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const assistantMenuMutation = useMutation(chatService.getAssistantMenu, {
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: data.message || data.answer || 'Choose your next option.',
          createdAt: new Date().toISOString(),
          options: data.options || [],
          table: extractTableFromMeta(data.meta),
        },
      ]);
      setIsMenuLoaded(true);
    },
    onError: (error: any) => {
      const message = String(error?.response?.data?.message || '').trim();
      const normalized = message.toLowerCase();
      const friendly =
        normalized === 'route not found'
          ? 'Assistant service route was not found. Please refresh once and try again.'
          : (message || 'Unable to process your request right now. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: 'assistant',
          text: friendly,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  const assistantSelectMutation = useMutation(chatService.selectAssistantMenuOption, {
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: data.message || data.answer || 'Done.',
          createdAt: new Date().toISOString(),
          options: data.options || [],
          table: extractTableFromMeta(data.meta),
        },
      ]);
    },
    onError: (error: any) => {
      const message = String(error?.response?.data?.message || '').trim() || 'Unable to process your request right now.';
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: 'assistant',
          text: message,
          createdAt: new Date().toISOString(),
          options: [{ id: 'assistant:home', label: 'Back to Main Menu' }],
        },
      ]);
    },
  });

  useEffect(() => {
    if (isOpen && !isMenuLoaded && !assistantMenuMutation.isLoading) {
      assistantMenuMutation.mutate();
    }
  }, [assistantMenuMutation, isMenuLoaded, isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const selectOption = (option: AssistantMenuOption) => {
    if (assistantSelectMutation.isLoading || assistantMenuMutation.isLoading) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: option.label,
        createdAt: new Date().toISOString(),
      },
    ]);
    assistantSelectMutation.mutate(option.id);
  };

  return (
    <>
      <button
        type="button"
        className={`school-assistant-fab ${isChatPage ? 'chat-page-offset' : ''}`}
        aria-label="Open School Assistant"
        title="School Assistant"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        🤖
      </button>

      {isOpen && (
        <div className={`school-assistant-popup ${isChatPage ? 'chat-page-offset' : ''}`} role="dialog" aria-label="School Assistant">
          <div className="school-assistant-header">
            <div className="school-assistant-header-title">
              <span className="school-assistant-header-icon" aria-hidden="true">🤖</span>
              <div>
              <h3>AI Assistant</h3>
              {/* <p>School-scoped responses based on your role.</p> */}
              </div>
            </div>
            <button
              type="button"
              className="school-assistant-close"
              aria-label="Close assistant"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="school-assistant-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`school-assistant-message ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                <div className="school-assistant-bubble">{msg.text}</div>
                {msg.sender === 'assistant' && msg.table && msg.table.columns.length > 0 && (
                  <div className="school-assistant-table-wrap">
                    <table className="school-assistant-table">
                      <thead>
                        <tr>
                          {msg.table.columns.map((col, idx) => (
                            <th key={`${msg.id}-th-${idx}`}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {msg.table.rows.map((row, rowIdx) => (
                          <tr key={`${msg.id}-tr-${rowIdx}`}>
                            {row.map((cell, cellIdx) => (
                              <td key={`${msg.id}-td-${rowIdx}-${cellIdx}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {msg.sender === 'assistant' && msg.options && msg.options.length > 0 && (
                  <div className="school-assistant-suggestions">
                    {msg.options.map((option) => (
                      <button
                        key={`${msg.id}-${option.id}`}
                        type="button"
                        className="school-assistant-chip"
                        disabled={assistantSelectMutation.isLoading || assistantMenuMutation.isLoading}
                        onClick={() => selectOption(option)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </>
  );
};

export default SchoolAssistantWidget;
