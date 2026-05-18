import { useState, useEffect, useRef } from 'react'
import { postAPI, storyAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiSend } from 'react-icons/fi'

function Home() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stories, setStories] = useState([])
  const [storyViewer, setStoryViewer] = useState(null)
  const [storyIndex, setStoryIndex] = useState(0)
  const [commentInputs, setCommentInputs] = useState({})
  const [viewedBy, setViewedBy] = useState(0)
  const sentinelRef = useRef(null)
  const progressRef = useRef(null)
  const storyTimerRef = useRef(null)

  const isLiked = (post) => post.likes?.includes(user?._id) || false

  useEffect(() => {
    loadPosts()
    loadStories()
  }, [])

  useEffect(() => {
    if (!storyViewer) return
    const story = storyViewer.stories[storyIndex]
    if (story) {
      if (!story._id) return
      storyAPI.viewStory(story._id).catch(() => {})
      setViewedBy((story.viewedBy || []).length)
    }
    let startTime = Date.now()
    const duration = 5000
    storyTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min((elapsed / duration) * 100, 100)
      if (progressRef.current) progressRef.current.style.width = `${pct}%`
      if (elapsed >= duration) {
        clearInterval(storyTimerRef.current)
        goNextStory()
      }
    }, 50)
    return () => clearInterval(storyTimerRef.current)
  }, [storyViewer, storyIndex])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < pages && !loading) {
          setPage((p) => p + 1)
        }
      },
      { threshold: 0.1 }
    )
    const sentinel = sentinelRef.current
    if (sentinel) observer.observe(sentinel)
    return () => {
      if (sentinel) observer.unobserve(sentinel)
    }
  }, [page, pages, loading])

  useEffect(() => {
    if (page > 1) loadMorePosts()
  }, [page])

  async function loadPosts() {
    setLoading(true)
    try {
      const data = await postAPI.getFeed(1)
      setPosts(data.posts || [])
      setPage(data.page || 1)
      setPages(data.pages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadMorePosts() {
    setLoading(true)
    try {
      const data = await postAPI.getFeed(page)
      setPosts((prev) => [...prev, ...(data.posts || [])])
      setPages(data.pages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStories() {
    try {
      const data = await storyAPI.getFeed()
      setStories(Array.isArray(data) ? data : data.stories || [])
    } catch (err) {
      console.error(err)
    }
  }

  function openStoryViewer(storyGroup) {
    setStoryIndex(0)
    setStoryViewer(storyGroup)
  }

  function closeStoryViewer() {
    setStoryViewer(null)
    setStoryIndex(0)
    clearInterval(storyTimerRef.current)
  }

  function goNextStory() {
    if (!storyViewer) return
    clearInterval(storyTimerRef.current)
    const next = storyIndex + 1
    if (next < storyViewer.stories.length) {
      setStoryIndex(next)
    } else {
      closeStoryViewer()
    }
  }

  function goPrevStory() {
    if (!storyViewer) return
    clearInterval(storyTimerRef.current)
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    }
  }

  function handleStoryClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width / 2) {
      goPrevStory()
    } else {
      goNextStory()
    }
  }

  async function handleLike(postId) {
    try {
      const res = await postAPI.likePost(postId)
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, likes: res.data.likes }
            : post
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function handleComment(postId, text) {
    if (!text || !text.trim()) return
    try {
      const res = await postAPI.commentOnPost(postId, text)
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? res.data : post
        )
      )
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-lg mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-4">SnapClone</h1>

        <div className="flex gap-4 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {stories.map((group) => (
            <button
              key={group.user?._id}
              onClick={() => openStoryViewer(group)}
              className="flex flex-col items-center gap-1 shrink-0 focus:outline-none"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-black p-[2px]">
                  <img
                    src={group.user?.profilePicture || '/default-avatar.png'}
                    alt={group.user?.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs text-gray-300 truncate max-w-[64px]">
                {group.user?.username}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                <Link to={`/profile/${post.user?._id}`}>
                  <img
                    src={post.user?.profilePicture || '/default-avatar.png'}
                    alt={post.user?.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </Link>
                <Link
                  to={`/profile/${post.user?._id}`}
                  className="font-semibold text-sm hover:underline"
                >
                  {post.user?.username}
                </Link>
              </div>

              <img
                src={post.media}
                alt=""
                className="w-full aspect-square object-cover"
              />

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-4 text-xl">
                  <button
                    onClick={() => handleLike(post._id)}
                    className="hover:scale-110 transition-transform"
                  >
                    {isLiked(post) ? (
                      <FiHeart className="text-red-500 fill-red-500" />
                    ) : (
                      <FiHeart />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post._id]:
                          prev[post._id] === undefined ? '' : prev[post._id],
                      }))
                    }
                    className="hover:scale-110 transition-transform"
                  >
                    <FiMessageCircle />
                  </button>
                  <FiSend className="hover:scale-110 transition-transform" />
                </div>

                <p className="text-sm font-semibold">
                  {post.likes?.length || 0} likes
                </p>

                {post.caption && (
                  <p className="text-sm">
                    <span className="font-semibold">{post.user?.username}</span>{' '}
                    {post.caption}
                  </p>
                )}

                {(post.comments || []).length > 0 && (
                  <div className="space-y-1 pt-1">
                    {post.comments.map((c, i) => (
                      <p key={c._id || i} className="text-sm text-gray-400">
                        <span className="font-semibold text-gray-200">
                          {c.user?.username}
                        </span>{' '}
                        {c.text}
                      </p>
                    ))}
                  </div>
                )}

                {commentInputs[post._id] !== undefined && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInputs[post._id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post._id, commentInputs[post._id])
                        }
                      }}
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div ref={sentinelRef} className="h-4" />

        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {storyViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={handleStoryClick}
          >
            <div className="relative w-full max-w-lg mx-4">
              <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
                {storyViewer.stories.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 bg-zinc-600 rounded-full overflow-hidden"
                  >
                    <div
                      ref={i === storyIndex ? progressRef : null}
                      className={`h-full bg-white transition-all duration-75 ${
                        i < storyIndex
                          ? 'w-full'
                          : i > storyIndex
                          ? 'w-0'
                          : ''
                      }`}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeStoryViewer()
                }}
                className="absolute top-4 right-4 z-20 text-white text-2xl"
              >
                &times;
              </button>

              <div className="flex items-center gap-3 absolute top-10 left-4 z-10">
                <img
                  src={
                    storyViewer.user?.profilePicture || '/default-avatar.png'
                  }
                  alt={storyViewer.user?.username}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
                <span className="font-semibold text-sm">
                  {storyViewer.user?.username}
                </span>
              </div>

              {storyViewer.stories[storyIndex] && (
                <img
                  src={storyViewer.stories[storyIndex].media}
                  alt=""
                  className="w-full max-h-[80vh] object-contain rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <div className="absolute bottom-4 left-4 text-sm text-gray-400">
                {viewedBy} view{viewedBy !== 1 ? 's' : ''}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home
