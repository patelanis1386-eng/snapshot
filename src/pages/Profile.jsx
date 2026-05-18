import { useState, useEffect } from 'react'
import { userAPI, postAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useParams, Link } from 'react-router-dom'
import { FiSettings, FiLogOut, FiGrid, FiHeart } from 'react-icons/fi'

function Profile() {
  const { id } = useParams()
  const { user: currentUser, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editPicture, setEditPicture] = useState(null)

  const isOwnProfile = !id || id === currentUser?._id

  useEffect(() => {
    if (isOwnProfile) {
      setProfile(currentUser)
      setEditUsername(currentUser?.username || '')
      setEditBio(currentUser?.bio || '')
      setLoading(false)
    } else if (id) {
      loadProfile(id)
    }
    loadPosts()
  }, [id, currentUser])

  async function loadProfile(userId) {
    try {
      const res = await userAPI.getUser(userId)
      setProfile(res.data)
      setEditUsername(res.data.username || '')
      setEditBio(res.data.bio || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadPosts() {
    try {
      const res = await postAPI.getFeed(1)
      const allPosts = res.posts || res.data?.posts || []
      const userId = isOwnProfile ? currentUser?._id : id
      setPosts(allPosts.filter((p) => p.user?._id === userId))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleFollow() {
    try {
      await userAPI.followUser(id)
      loadProfile(id)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('username', editUsername)
      formData.append('bio', editBio)
      if (editPicture) {
        formData.append('profilePicture', editPicture)
      }
      const res = await userAPI.updateUser(formData)
      setProfile(res.data)
      setEditing(false)
      setEditPicture(null)
    } catch (err) {
      console.error(err)
    }
  }

  function handlePictureChange(e) {
    setEditPicture(e.target.files[0])
  }

  function handleLogout() {
    logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">{profile?.username || 'Profile'}</h1>
          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiSettings size={20} />
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiLogOut size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-[120px] h-[120px] rounded-full bg-zinc-800 overflow-hidden mb-4">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <span className="text-4xl font-bold">
                  {profile?.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold">{profile?.username}</h2>
          {profile?.bio && (
            <p className="text-gray-400 text-sm mt-1 text-center">{profile.bio}</p>
          )}
        </div>

        <div className="flex justify-center gap-12 mb-6">
          <div className="text-center">
            <p className="text-lg font-bold">{posts.length}</p>
            <p className="text-gray-400 text-sm">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile?.followers?.length || 0}</p>
            <p className="text-gray-400 text-sm">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile?.following?.length || 0}</p>
            <p className="text-gray-400 text-sm">Following</p>
          </div>
        </div>

        {isOwnProfile && editing && (
          <form onSubmit={handleEditSubmit} className="mb-6 space-y-3 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="w-full text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-yellow-400 file:text-black file:font-semibold"
              />
            </div>
            <input
              type="text"
              placeholder="Username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-yellow-400 placeholder-gray-500"
            />
            <textarea
              placeholder="Bio"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-yellow-400 placeholder-gray-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg font-bold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2 rounded-lg font-bold text-white bg-zinc-700 hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!isOwnProfile && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleFollow}
              className="px-8 py-2 rounded-lg font-bold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors"
            >
              Follow
            </button>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-center gap-8 mb-4">
            <button className="text-yellow-400 border-b-2 border-yellow-400 pb-2">
              <FiGrid size={20} />
            </button>
            <button className="text-gray-500 pb-2">
              <FiHeart size={20} />
            </button>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <div key={post._id} className="aspect-square bg-zinc-900 overflow-hidden">
                  {post.media && (
                    <img
                      src={post.media}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <FiGrid size={48} className="mb-4" />
              <p className="text-lg font-semibold">No posts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
