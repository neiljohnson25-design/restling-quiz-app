import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Trophy, Award, Medal, Calendar, User, LogOut, Menu, X, Zap, Flame } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getAvatarById } from '../utils/avatars';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/categories', icon: Trophy, label: 'Play' },
    { path: '/leaderboard', icon: Medal, label: 'Rankings' },
    { path: '/achievements', icon: Award, label: 'Rewards' },
    { path: '/daily', icon: Calendar, label: 'Daily' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 mt-4">
          <div className="max-w-7xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
            <div className="px-4 sm:px-6">
              <div className="flex items-center justify-between h-16">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="relative">
                    <img src="/images/logo.png" alt="Big Blue Cage" className="h-9 w-auto transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-lg font-bold text-white">Big Blue Cage</span>
                    <span className="text-xs text-blue-400 block -mt-1">Wrestling Quiz</span>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-1">
                  {isAuthenticated &&
                    navItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          isActive(item.path)
                            ? 'text-white'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {isActive(item.path) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl" />
                        )}
                        <item.icon className={`w-4 h-4 relative z-10 ${isActive(item.path) ? 'text-white' : ''}`} />
                        <span className="relative z-10">{item.label}</span>
                      </Link>
                    ))}
                </nav>

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  {isAuthenticated ? (
                    <>
                      {/* Stats Pills - Desktop */}
                      <div className="hidden lg:flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-sm font-semibold text-amber-300">{user?.totalXp?.toLocaleString()}</span>
                        </div>
                        {user?.currentStreak && user.currentStreak > 0 && (
                          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-sm font-semibold text-orange-300">{user.currentStreak}</span>
                          </div>
                        )}
                      </div>

                      {/* User Avatar & Dropdown */}
                      <div className="hidden sm:flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{user?.displayName || user?.username}</p>
                          <p className="text-xs text-slate-400">Level {user?.level}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="relative group"
                          title="Profile"
                        >
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/25 border border-white/10 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-200">
                            {getAvatarById(user?.avatarUrl || 'rookie')?.emoji || '🥋'}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
                        </Link>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Logout"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link to="/login" className="text-slate-300 hover:text-white transition-colors font-medium">
                        Login
                      </Link>
                      <Link to="/register" className="btn-primary text-sm py-2 px-5">
                        Get Started
                      </Link>
                    </div>
                  )}

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mx-4 mt-2">
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-3 space-y-1">
                {isAuthenticated &&
                  navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-white/10 my-2" />
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </>
                )}
              </div>
              {/* Mobile Stats */}
              {isAuthenticated && user && (
                <div className="p-3 pt-0">
                  <div className="flex items-center justify-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-300">{user.totalXp?.toLocaleString()} XP</span>
                    </div>
                    <div className="w-px h-4 bg-white/20" />
                    <span className="text-sm text-slate-400">Level {user.level}</span>
                    {user.currentStreak > 0 && (
                      <>
                        <div className="w-px h-4 bg-white/20" />
                        <div className="flex items-center space-x-1.5">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-semibold text-orange-300">{user.currentStreak} day</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 min-h-screen">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src="/images/logo.png" alt="Big Blue Cage" className="h-7 w-auto opacity-70" />
              <span className="text-slate-500 text-sm">Big Blue Cage Wrestling Quiz</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <a
                href="https://bigbluecage.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Shop Custom Belts
              </a>
              <span className="text-slate-700">|</span>
              <span className="text-slate-600">Test Your Knowledge. Earn Your Belts.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
