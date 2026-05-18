import { useNavigate, useLocation } from 'react-router-dom'
import { FiHome, FiCamera, FiMessageCircle, FiUser } from 'react-icons/fi'

const navItems = [
  { path: '/', icon: FiHome, label: 'Home' },
  { path: '/create', icon: FiCamera, label: 'Create' },
  { path: '/chat', icon: FiMessageCircle, label: 'Chat' },
  { path: '/profile', icon: FiUser, label: 'Profile' },
]

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around py-3">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1"
            >
              <Icon
                size={22}
                className={isActive ? 'text-white' : 'text-gray-500'}
              />
              <span
                className={`text-[10px] ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
