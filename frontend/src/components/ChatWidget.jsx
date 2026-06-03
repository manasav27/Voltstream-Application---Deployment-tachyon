import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ChatLauncher from './chat/ChatLauncher';
import ChatPanel from './chat/ChatPanel';
import {
  API_BASES,
  ragStarterMessages,
  starterMessages,
} from './chat/chatConstants';
import './chat/ChatWidget.css';

const getInitialPosition = () => {
  if (typeof window === 'undefined') return { x: 12, y: 520 };

  const savedPosition = window.localStorage.getItem('groot-widget-position');
  if (savedPosition) {
    try {
      const parsedPosition = JSON.parse(savedPosition);
      if (Number.isFinite(parsedPosition.x) && Number.isFinite(parsedPosition.y)) {
        return parsedPosition;
      }
    } catch (error) {
      window.localStorage.removeItem('groot-widget-position');
    }
  }

  return { x: 12, y: Math.max(96, window.innerHeight - 168) };
};

export default function ChatWidget({ hideLauncher = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeBot, setActiveBot] = useState('bot');
  const [botMessages, setBotMessages] = useState(starterMessages);
  const [ragMessages, setRagMessages] = useState(ragStarterMessages);
  const [historyQuestions, setHistoryQuestions] = useState([]);
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [position, setPosition] = useState(getInitialPosition);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const requestControllerRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    lastPosition: { x: 12, y: 520 },
  });

  const isRagBot = activeBot === 'rag';
  const messages = isRagBot ? ragMessages : botMessages;
  const setActiveMessages = isRagBot ? setRagMessages : setBotMessages;
  const hasUserMessages = messages.some((message) => message.role === 'user');

  useEffect(() => {
    if (isOpen) {
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, messages.length, activeBot]);

  useEffect(() => {
    const openFromExplore = (event) => {
      const requestedMode = event.detail?.mode;
      if (requestedMode === 'rag' || requestedMode === 'bot') {
        setActiveBot(requestedMode);
      }
      setIsOpen(true);
      setIsMaximized(false);
    };

    window.addEventListener('voltstream-open-groot', openFromExplore);
    return () => window.removeEventListener('voltstream-open-groot', openFromExplore);
  }, []);

  const scrollToLatest = () => {
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  const clampPosition = (nextX, nextY) => {
    const maxX = Math.max(0, window.innerWidth - 100);
    const maxY = Math.max(0, window.innerHeight - 100);

    return {
      x: Math.min(Math.max(8, nextX), maxX),
      y: Math.min(Math.max(8, nextY), maxY),
    };
  };

  const handleOrbPointerDown = (event) => {
    dragRef.current = {
      isDragging: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      lastPosition: position,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleOrbPointerMove = (event) => {
    const dragState = dragRef.current;
    if (!dragState.isDragging || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragState.moved = true;
    }

    const nextPosition = clampPosition(dragState.originX + deltaX, dragState.originY + deltaY);
    dragState.lastPosition = nextPosition;
    setPosition(nextPosition);
  };

  const handleOrbPointerUp = (event) => {
    const dragState = dragRef.current;
    if (dragState.pointerId === event.pointerId) {
      window.localStorage.setItem('groot-widget-position', JSON.stringify(dragState.lastPosition));
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragRef.current = { ...dragState, isDragging: false };
    }
  };

  const handleOrbClick = () => {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }

    setIsOpen(true);
    setIsMaximized(false);
  };

  const askQuestion = async (nextQuestion) => {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion || isSending) return;

    setActiveMessages((current) => [...current, { role: 'user', text: trimmedQuestion }]);
    setHistoryQuestions((current) => [
      trimmedQuestion,
      ...current.filter((item) => item.toLowerCase() !== trimmedQuestion.toLowerCase()),
    ].slice(0, 8));
    setQuestion('');
    setIsSending(true);
    const requestController = new AbortController();
    requestControllerRef.current = requestController;
    scrollToLatest();

    try {
      let answer = '';
      let responseData = null;

      for (const apiBase of API_BASES) {
        try {
          const endpoint = isRagBot ? 'qa' : 'chat';
          const response = await axios.post(
            `${apiBase}/${endpoint}`,
            { question: trimmedQuestion },
            { signal: requestController.signal }
          );
          responseData = response.data || {};
          answer = responseData.answer || 'I received your question, but there was no answer text.';
          if (responseData.device) {
            window.dispatchEvent(new CustomEvent('voltstream-device-updated', {
              detail: responseData.device,
            }));
          }
          break;
        } catch (error) {
          if (apiBase === API_BASES[API_BASES.length - 1]) {
            throw error;
          }
        }
      }

      setActiveMessages((current) => [
        ...current,
        {
          role: 'bot',
          text: answer,
          agent: responseData?.agent,
        },
      ]);
    } catch (error) {
      if (axios.isCancel(error) || error.name === 'CanceledError') {
        setActiveMessages((current) => [
          ...current,
          { role: 'bot', text: 'Stopped. Ask me anything else when you are ready.' },
        ]);
        return;
      }

      setActiveMessages((current) => [
        ...current,
        {
          role: 'bot',
          text: `I could not reach the ${isRagBot ? 'RAG Q&A' : 'energy assistant'}. Tried: ${API_BASES.join(', ')}.`,
        },
      ]);
    } finally {
      setIsSending(false);
      requestControllerRef.current = null;
      scrollToLatest();
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    askQuestion(question);
  };

  const stopResponse = () => {
    requestControllerRef.current?.abort();
  };

  return (
    <div
      className="fixed z-50 font-sans"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {isOpen && (
        <ChatPanel
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
          isRagBot={isRagBot}
          setActiveBot={setActiveBot}
          setQuestion={setQuestion}
          setIsOpen={setIsOpen}
          messages={messages}
          hasUserMessages={hasUserMessages}
          historyQuestions={historyQuestions}
          question={question}
          inputRef={inputRef}
          messagesEndRef={messagesEndRef}
          isSending={isSending}
          onSubmit={sendMessage}
          onAskQuestion={askQuestion}
          onStop={stopResponse}
        />
      )}

      {!isOpen && !hideLauncher && (
        <ChatLauncher
          isOpen={isOpen}
          onPointerDown={handleOrbPointerDown}
          onPointerMove={handleOrbPointerMove}
          onPointerUp={handleOrbPointerUp}
          onClick={handleOrbClick}
          onPromptClick={() => {
            setIsOpen(true);
            setIsMaximized(false);
          }}
        />
      )}
    </div>
  );
}
