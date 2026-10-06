import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Send, Mic, MicOff, Volume2, VolumeX, X, Minimize2, Maximize2 } from 'lucide-react'
import { SpeechPipeline } from './SpeechPipeline'
import { sendChat, getChatHistory, createSession } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

const WELCOME_MSG = 'Hello! I am SmartFarm AI. Ask me anything about crops, soil, irrigation, pest management, or any farming topic.'

/**
 * FloatingChatBot - A floating chat widget in the bottom-right corner
 * Features:
 * - Minimizable/Expandable window
 * - Text-to-voice (speech synthesis)
 * - Voice-to-text (speech recognition)
 * - Full chat history support
 * - Persistent session storage
 */
export default function FloatingChatBot() {
  const { language: uiLanguage } = useLanguage()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MSG },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('chatbot_session_id') || '')
  const [interimText, setInterimText] = useState('')
  const bottomRef = useRef(null)
  const speechPipelineRef = useRef(null)

  // Load chat history on mount or session change
  useEffect(() => {
    if (sessionId) {
      loadChatHistory()
    }
  }, [sessionId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimText])

  const loadChatHistory = async () => {
    try {
      const resp = await getChatHistory(sessionId, 50)
      const history = resp.data.messages || []
      if (history.length > 0) {
        setMessages(history)
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err)
    }
  }

  const handleVoiceResult = async (translatedText, sourceLang) => {
    if (!translatedText.trim()) return
    await sendMessage(translatedText)
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text }
    const nextHistory = [...messages, userMessage].slice(-8)
    setMessages((current) => [...current, userMessage])
    setInput('')
    setInterimText('')
    setLoading(true)

    try {
      const currentSid = sessionId || undefined
      const response = await sendChat(
        text,
        currentSid,
        nextHistory.map((m) => ({ role: m.role, content: m.content }))
      )
      const reply = response.data.reply
      const action = response.data.action

      // Save new session ID if created
      if (!sessionId && response.data.session_id) {
        const newSessionId = response.data.session_id
        setSessionId(newSessionId)
        localStorage.setItem('chatbot_session_id', newSessionId)
      }

      if (action?.type === 'navigate' && action.target) {
        navigate(action.target)
      }

      setMessages((current) => [...current, { role: 'assistant', content: reply }])

      // Speak the reply if speech pipeline is available
      if (speechPipelineRef.current && reply) {
        speechPipelineRef.current.speakReply(reply, uiLanguage)
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Sorry, I could not reach the AI service. Please check that the backend is running.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    await sendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.6)'
          e.currentTarget.style.transform = 'scale(1.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
        title="Open ChatBot"
      >
        <Bot size={24} className="text-white" strokeWidth={1.5} />
      </button>
    )
  }

  return (
    <SpeechPipeline
      language={uiLanguage}
      onFinalResult={handleVoiceResult}
      onInterimResult={(text) => setInterimText(text)}
      disabled={loading}
    >
      {({ toggleVoice, isListening: voiceIsListening, stopSpeaking, speakReply }) => {
        speechPipelineRef.current = { speakReply, stopSpeaking }

        return (
          <div
            className="fixed bottom-6 right-6 z-40 flex flex-col"
            style={{
              width: isMinimized ? 300 : 420,
              height: isMinimized ? 'auto' : 600,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                borderBottom: isMinimized ? 'none' : '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Bot size={16} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">SmartFarm AI</p>
                  <p className="text-xs text-white opacity-80">Your farming assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 size={18} className="text-white" strokeWidth={2} />
                  ) : (
                    <Minimize2 size={18} className="text-white" strokeWidth={2} />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Close"
                >
                  <X size={18} className="text-white" strokeWidth={2} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div
                  className="flex-1 overflow-y-auto px-3 py-3"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {interimText && (
                    <div className="flex justify-end">
                      <div
                        className="px-3 py-2 rounded-lg text-sm opacity-70 italic max-w-xs"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--color-text)',
                        }}
                      >
                        {interimText}...
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse justify-end' : ''}`}
                    >
                      {message.role === 'assistant' && (
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                          }}
                        >
                          <Bot size={14} className="text-white" strokeWidth={2} />
                        </div>
                      )}

                      <div
                        className="px-3 py-2 rounded-lg text-sm max-w-xs break-words group relative flex items-start gap-2"
                        style={{
                          background:
                            message.role === 'user'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : 'var(--color-surface-2)',
                          color: 'var(--color-text)',
                          borderRadius: message.role === 'user' ? 'var(--radius-lg)' : 'var(--radius-lg)',
                        }}
                      >
                        <span className="whitespace-pre-wrap leading-relaxed flex-1">{message.content}</span>

                        {/* Voice Output Button */}
                        {message.role === 'assistant' && message.content && (
                          <button
                            onClick={() => {
                              if (speechPipelineRef.current) {
                                speechPipelineRef.current.speakReply(message.content, uiLanguage)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 rounded hover:bg-white hover:bg-opacity-10"
                            title="Speak message"
                          >
                            <Volume2 size={12} style={{ color: 'var(--color-primary)' }} />
                          </button>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <span className="text-xs font-bold">U</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2">
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                        }}
                      >
                        <Bot size={14} className="text-white" strokeWidth={2} />
                      </div>
                      <div
                        className="px-3 py-2 rounded-lg"
                        style={{ background: 'var(--color-surface-2)' }}
                      >
                        <div className="loading-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    padding: '12px',
                    background: 'var(--color-surface)',
                  }}
                >
                  <div
                    className="flex gap-2 items-end"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '6px 8px',
                    }}
                  >
                    <button
                      onClick={toggleVoice}
                      disabled={loading}
                      className="flex-shrink-0 p-1 rounded transition-colors"
                      style={{
                        background: voiceIsListening ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: voiceIsListening ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        opacity: loading ? 0.5 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                      title={voiceIsListening ? 'Stop listening' : 'Start listening'}
                    >
                      {voiceIsListening ? (
                        <MicOff size={16} strokeWidth={2} />
                      ) : (
                        <Mic size={16} strokeWidth={2} />
                      )}
                    </button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about crops, soil, pests..."
                      rows={1}
                      style={{
                        flex: 1,
                        resize: 'none',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        color: 'var(--color-text)',
                        lineHeight: 1.5,
                        padding: '2px 4px',
                        maxHeight: '60px',
                      }}
                      onInput={(e) => {
                        e.target.style.height = 'auto'
                        e.target.style.height = Math.min(e.target.scrollHeight, 60) + 'px'
                      }}
                    />

                    <button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="flex-shrink-0 p-1 rounded transition-colors"
                      style={{
                        background: input.trim() && !loading ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                        color: input.trim() && !loading ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        opacity: input.trim() && !loading ? 1 : 0.5,
                        cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      }}
                      title="Send message"
                    >
                      <Send size={16} strokeWidth={2} />
                    </button>
                  </div>

                  <p
                    className="text-[10px] mt-1 text-center"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {voiceIsListening ? 'Listening...' : 'Enter to send · Tap mic to speak'}
                  </p>
                </div>
              </>
            )}
          </div>
        )
      }}
    </SpeechPipeline>
  )
}
