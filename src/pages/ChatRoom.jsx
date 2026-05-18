import { useState, useEffect, useRef } from 'react'
import { messageAPI, userAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { getSocket } from '../services/socket'
import { FiArrowLeft, FiSend } from 'react-icons/fi'

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ChatRoom() {
  const { userId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatUser, setChatUser] = useState(null)
  const [online, setOnline] = useState(false)
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    fetchUser()
    fetchMessages()
    markAsRead()
    const socket = getSocket()
    if (socket) {
      socket.on('newMessage', handleNewMessage)
      socket.on('typing', ({ userId: typingUserId, isTyping }) => {
        if (typingUserId === userId) setTyping(isTyping)
      })
      socket.on('userStatus', ({ userId: statusUserId, isOnline }) => {
        if (statusUserId === userId) setOnline(isOnline)
      })
    }
    return () => {
      const socket = getSocket()
      if (socket) {
        socket.off('newMessage')
        socket.off('typing')
        socket.off('userStatus')
      }
    }
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function fetchUser() {
    try {
      const res = await userAPI.getUser(userId)
      setChatUser(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchMessages() {
    try {
      const res = await messageAPI.getMessages(userId)
      setMessages(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function markAsRead() {
    try {
      await messageAPI.markAsRead(userId)
    } catch (err) {
      console.error(err)
    }
  }

  function handleNewMessage(msg) {
    if (msg.sender === userId || msg.sender?._id === userId || msg.receiver === userId || msg.receiver?._id === userId) {
      setMessages((prev) => [...prev, msg])
    }
  }

  async function handleSend() {
    if (!input.trim()) return
    const socket = getSocket()
    if (socket) {
      socket.emit('sendMessage', { receiverId: userId, text: input.trim() })
    }
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTyping() {
    const socket = getSocket()
    if (socket) {
      socket.emit('typing', { receiverId: userId, isTyping: true })
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { receiverId: userId, isTyping: false })
      }, 1500)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => navigate('/chat')} className="text-xl">
          <FiArrowLeft />
        </button>
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
            {chatUser?.profilePicture ? (
              <img
                src={chatUser.profilePicture}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-zinc-400">
                {chatUser?.username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {chatUser?.username || 'Loading...'}
          </p>
          {typing && (
            <p className="text-xs text-zinc-400">typing...</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => {
          const isSent =
            msg.sender === user?._id ||
            msg.sender?._id === user?._id ||
            msg.sender === user?.id
          return (
            <div
              key={msg._id || i}
              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isSent
                    ? 'bg-[#FFFC00] text-black rounded-br-md'
                    : 'bg-zinc-800 text-white rounded-bl-md'
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isSent ? 'text-black/50' : 'text-zinc-400'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-800 shrink-0">
        <input
          type="text"
          placeholder="Message..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            handleTyping()
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-zinc-900 rounded-full px-5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="text-[#FFFC00] text-xl disabled:opacity-30"
        >
          <FiSend />
        </button>
      </div>
    </div>
  )
}

export default ChatRoom
