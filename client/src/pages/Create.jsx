import { useState, useRef } from 'react'
import { storyAPI, postAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { FiCamera, FiX, FiImage, FiSend } from 'react-icons/fi'

function Create() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [media, setMedia] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [storying, setStorying] = useState(false)

  function handleMediaSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    setMedia(file)
    const reader = new FileReader()
    reader.onload = (ev) => setMediaPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function clearMedia() {
    setMedia(null)
    setMediaPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handlePostToFeed() {
    if (!media) return
    setPosting(true)
    try {
      const formData = new FormData()
      formData.append('media', media)
      formData.append('caption', caption)
      await postAPI.createPost(formData)
      navigate('/')
    } catch (err) {
      console.error(err)
      setPosting(false)
    }
  }

  async function handleAddToStory() {
    if (!media) return
    setStorying(true)
    try {
      const formData = new FormData()
      formData.append('media', media)
      await storyAPI.uploadStory(formData)
      navigate('/')
    } catch (err) {
      console.error(err)
      setStorying(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <h1 className="text-lg font-bold">Create</h1>
        {mediaPreview && (
          <button
            onClick={clearMedia}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={22} />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaSelect}
          className="hidden"
        />

        {!mediaPreview ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-64 h-64 rounded-3xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-3 hover:border-zinc-500 transition-colors bg-zinc-900/50"
          >
            <FiCamera size={48} className="text-gray-400" />
            <p className="text-gray-400 text-sm">Tap to capture or select</p>
            <FiImage size={20} className="text-gray-500" />
          </button>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900">
              {media?.type?.startsWith('video/') ? (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full max-h-80 object-contain"
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-80 object-contain"
                />
              )}
            </div>

            <input
              type="text"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:border-yellow-400 placeholder-gray-500"
            />

            <div className="flex gap-3">
              <button
                onClick={handlePostToFeed}
                disabled={posting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {posting ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend size={18} />
                )}
                Post to Feed
              </button>
              <button
                onClick={handleAddToStory}
                disabled={storying}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-zinc-700"
              >
                {storying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiCamera size={18} />
                )}
                Add to Story
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Create
