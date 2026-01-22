import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Flame, Target, Award, Calendar, ChevronRight, Star, Sparkles, ExternalLink, Zap, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useQuizStore } from '../stores/quizStore';
import api from '../api/client';
import type { Belt } from '../types';

export default function Dashboard() {
  const { user, stats, xpProgress, fetchUser } = useAuthStore();
  const { categories, fetchCategories } = useQuizStore();
  const [featuredBelt, setFeaturedBelt] = useState<Belt | null>(null);

  useEffect(() => {
    fetchUser();
    fetchCategories();
    fetchFeaturedBelt();
  }, [fetchUser, fetchCategories]);

  const fetchFeaturedBelt = async () => {
    try {
      const response = await api.get('/belts/featured');
      setFeaturedBelt(response.data.belt);
    } catch (error) {
      console.error('Failed to fetch featured belt:', error);
    }
  };

  const xpToNextLevel = xpProgress
    ? xpProgress.nextLevelXp - xpProgress.currentLevelXp
    : 0;
  const currentXpInLevel = user
    ? user.totalXp - (xpProgress?.currentLevelXp || 0)
    : 0;
  const progressPercent = xpToNextLevel > 0 ? (currentXpInLevel / xpToNextLevel) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8 animate-fadeIn">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">👋</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Welcome back, {user?.displayName || user?.username}!
          </h1>
        </div>
        <p className="text-slate-400">Ready to test your wrestling knowledge?</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600/30 to-blue-800/30 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Level</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">{user?.level || 1}</p>
        </div>

        <div className="card group hover:border-amber-500/30 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-600/30 to-orange-800/30 rounded-xl border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Total XP</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">{user?.totalXp?.toLocaleString() || 0}</p>
        </div>

        <div className="card group hover:border-orange-500/30 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-600/30 to-red-800/30 rounded-xl border border-orange-500/20 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Streak</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{user?.currentStreak || 0} <span className="text-lg">days</span></p>
        </div>

        <div className="card group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600/30 to-teal-800/30 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Accuracy</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{stats?.accuracy?.toFixed(1) || 0}<span className="text-lg">%</span></p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="card mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-slate-300 font-medium">Progress to Level {(user?.level || 1) + 1}</span>
            </div>
            <span className="text-sm text-slate-400 font-mono">
              {currentXpInLevel.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
            </span>
          </div>
          <div className="progress-bar h-3">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Level {user?.level || 1}</span>
            <span>{Math.round(progressPercent)}% complete</span>
            <span>Level {(user?.level || 1) + 1}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Daily Challenge */}
        <Link to="/daily" className="card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">Daily Challenge</h3>
                <p className="text-slate-400">Complete today's challenge for bonus XP!</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Quick Quiz */}
        <Link to="/quiz" className="card-hover group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Quick Quiz</h3>
                <p className="text-slate-400">Random questions from all categories</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Categories Preview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>🏆</span>
            <span>Categories</span>
          </h2>
          <Link to="/categories" className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1 group">
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              to={category.isLocked ? '#' : `/quiz/${category.slug}`}
              className={`card-hover group ${category.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">{category.name}</h3>
                </div>
                {category.isLocked ? (
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">🔒 Level {category.unlockLevel}</span>
                ) : (
                  <div className="flex items-center space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          i < (category.userProgress?.masteryLevel || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Belt of the Week */}
      {featuredBelt && (
        <div className="card mb-8 relative overflow-hidden border-amber-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-yellow-600/5 to-orange-600/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Featured Belt of the Week</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-36 h-36 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl flex items-center justify-center overflow-hidden border border-amber-500/20 shadow-lg shadow-amber-500/10">
                {featuredBelt.beltImageUrl ? (
                  <img src={featuredBelt.beltImageUrl} alt={featuredBelt.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Award className="w-20 h-20 text-amber-400" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent mb-3">{featuredBelt.name}</h3>
                <p className="text-slate-400 mb-4 leading-relaxed">{featuredBelt.description}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className={`badge badge-${featuredBelt.rarity === 'legendary' ? 'gold' : featuredBelt.rarity === 'rare' ? 'silver' : 'bronze'}`}>
                    {featuredBelt.rarity}
                  </span>
                  {featuredBelt.category && (
                    <span className="text-sm text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                      {featuredBelt.category.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {featuredBelt.bigBlueCageProductUrl && (
                  <a
                    href={featuredBelt.bigBlueCageProductUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary flex items-center justify-center space-x-2"
                  >
                    <span>Get Real Version</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {featuredBelt.category && (
                  <Link to={`/quiz/${featuredBelt.category.slug}`} className="btn-secondary text-center">
                    Play to Unlock
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Big Blue Cage CTA */}
      <div className="card relative overflow-hidden border-blue-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-2xl border border-amber-500/20">
              <Award className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Want a Real Championship Belt?</h3>
              <p className="text-slate-400">
                Design your own custom wrestling belt at Big Blue Cage!
              </p>
            </div>
          </div>
          <a
            href="https://bigbluecage.com/custom-belts"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary whitespace-nowrap group flex items-center space-x-2"
          >
            <span>Shop Custom Belts</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
