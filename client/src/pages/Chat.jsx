import { useState, useEffect } from 'react'
import { messageAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../services/socket'

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
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d`
  return date.toLocaleDateString()
}

function Chat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [search, setSearch] = useState('')
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    fetchConversations()
    const socket = getSocket()
    if (socket) {
      socket.on('userStatus', ({ userId, isOnline }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev)
          if (isOnline) next.add(userId)
          else next.delete(userId)
          return next
        })
      })
    }
    return () => {
      const socket = getSocket()
      if (socket) socket.off('userStatus')
    }
  }, [])

  async function fetchConversations() {
    try {
      const res = await messageAPI.getConversations()
      setConversations(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = conversations
    .filter((c) =>
      c.user?.username?.toLowerCase().includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0)
    )

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      <div className="px-4 pt-4 pb-2 border-b border-zinc-800">
        <h1 className="text-2xl font-bold mb-3">Chats</h1>
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-700"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No conversations yet
          </div>
        )}
        {filtered.map((conversation) => {
          const chatUser = conversation.user
          const isOnline = onlineUsers.has(chatUser?._id)
          return (
            <button
              key={chatUser?._id}
              onClick={() => navigate(`/chat/${chatUser?._id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors border-b border-zinc-900/50"
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                  {chatUser?.profilePicture ? (
                    <img
                      src={chatUser.profilePicture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-zinc-400">
                      {chatUser?.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${
                    isOnline ? 'bg-green-500' : 'bg-zinc-500'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">
                    {chatUser?.username}
                  </span>
                  <span className="text-xs text-zinc-500 shrink-0 ml-2">
                    {formatTime(conversation.lastMessage?.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 truncate mt-0.5">
                  {conversation.lastMessage?.text || 'Start chatting'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Chat
