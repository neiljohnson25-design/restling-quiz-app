import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Crown, ChevronDown, Target } from 'lucide-react';
import api from '../api/client';
import type { LeaderboardEntry, Category } from '../types';
import { getAvatarById } from '../utils/avatars';

type LeaderboardType = 'global' | 'weekly' | 'category';

interface CategoryLeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    level: number;
  };
  categoryXp: number;
  masteryLevel: number;
  questionsCorrect: number;
  questionsAnswered: number;
  accuracy: number;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [categoryLeaderboard, setCategoryLeaderboard] = useState<CategoryLeaderboardEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'category' && selectedCategory) {
      fetchCategoryLeaderboard();
    } else if (activeTab !== 'category') {
      fetchLeaderboard();
    }
  }, [activeTab, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
      if (response.data.categories.length > 0) {
        setSelectedCategory(response.data.categories[0].slug);
        setSelectedCategoryName(response.data.categories[0].name);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === 'global' ? '/leaderboards/global' : '/leaderboards/weekly';
      const response = await api.get(endpoint);
      setLeaderboard(response.data.leaderboard);
      setUserRank(response.data.userRank);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryLeaderboard = async () => {
    if (!selectedCategory) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/leaderboards/category/${selectedCategory}`);
      setCategoryLeaderboard(response.data.leaderboard);
      setUserRank(response.data.userRank);
    } catch (error) {
      console.error('Failed to fetch category leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (slug: string, name: string) => {
    setSelectedCategory(slug);
    setSelectedCategoryName(name);
    setShowCategoryDropdown(false);
    if (activeTab === 'category') {
      fetchCategoryLeaderboard();
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown className="w-5 h-5 text-white" />
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg shadow-slate-400/20">
            <Medal className="w-5 h-5 text-slate-700" />
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Medal className="w-5 h-5 text-amber-200" />
          </div>
        );
      default:
        return <span className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-lg">{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border-amber-500/40 hover:border-amber-400/60';
      case 2:
        return 'bg-gradient-to-r from-slate-700/20 to-slate-600/10 border-slate-400/40 hover:border-slate-300/60';
      case 3:
        return 'bg-gradient-to-r from-amber-900/20 to-orange-900/10 border-amber-700/40 hover:border-amber-600/60';
      default:
        return 'hover:border-blue-500/30';
    }
  };

  const getMasteryBadge = (level: number) => {
    const badges = ['Novice', 'Apprentice', 'Journeyman', 'Expert', 'Master'];
    const colors = ['bg-slate-700 text-slate-300', 'bg-emerald-900/50 text-emerald-400', 'bg-blue-900/50 text-blue-400', 'bg-purple-900/50 text-purple-400', 'bg-amber-900/50 text-amber-400'];
    const idx = Math.min(level, badges.length - 1);
    return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[idx]}`}>{badges[idx]}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 animate-fadeIn">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-amber-600/30 to-yellow-600/30 rounded-xl border border-amber-500/20">
            <Medal className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Leaderboard</h1>
        </div>
        <p className="text-slate-400 ml-14">See how you rank against other wrestling fans</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-slate-900/50 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'global'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>All Time</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'weekly'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Award className="w-5 h-5" />
            <span>This Week</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('category')}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'category'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Target className="w-5 h-5" />
            <span>By Category</span>
          </div>
        </button>
      </div>

      {/* Category Selector */}
      {activeTab === 'category' && (
        <div className="relative mb-6">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="w-full sm:w-auto px-5 py-3 bg-slate-800/50 rounded-xl flex items-center justify-between space-x-4 hover:bg-slate-700/50 transition-all border border-white/5 hover:border-white/10"
          >
            <span className="text-white font-medium">{selectedCategoryName || 'Select Category'}</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showCategoryDropdown && (
            <div className="absolute z-10 mt-2 w-full sm:w-72 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 max-h-64 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategorySelect(cat.slug, cat.name)}
                  className={`w-full px-4 py-3 text-left transition-all first:rounded-t-xl last:rounded-b-xl ${
                    selectedCategory === cat.slug
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                      : 'text-white hover:bg-white/5'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Rank Card */}
      {userRank && (
        <div className="card relative overflow-hidden border-blue-500/30 mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600/30 to-blue-800/30 rounded-xl border border-blue-500/20">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Your Rank {activeTab === 'category' && `in ${selectedCategoryName}`}</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">#{userRank}</p>
              </div>
            </div>
            <p className="text-slate-400 hidden sm:block text-sm">Keep playing to climb the rankings!</p>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
        </div>
      ) : activeTab === 'category' ? (
        <div className="space-y-3">
          {categoryLeaderboard.map((entry, index) => (
            <div
              key={entry.user.id}
              className={`card flex items-center justify-between transition-all duration-300 animate-fadeIn ${getRankStyle(entry.rank)}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 flex justify-center">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 border border-white/10">
                  {getAvatarById(entry.user.avatarUrl || 'rookie')?.emoji || '🥋'}
                </div>
                <div>
                  <p className="font-semibold text-white">{entry.user.displayName || entry.user.username}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">Lvl {entry.user.level}</span>
                    {getMasteryBadge(entry.masteryLevel)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{entry.categoryXp.toLocaleString()} XP</p>
                <p className="text-xs text-slate-400 mt-1">
                  {entry.accuracy.toFixed(0)}% ({entry.questionsCorrect}/{entry.questionsAnswered})
                </p>
              </div>
            </div>
          ))}

          {categoryLeaderboard.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400">No entries yet for this category. Be the first to play!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`card flex items-center justify-between transition-all duration-300 animate-fadeIn ${getRankStyle(entry.rank)}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 flex justify-center">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 border border-white/10">
                  {getAvatarById(entry.avatarUrl || 'rookie')?.emoji || '🥋'}
                </div>
                <div>
                  <p className="font-semibold text-white">{entry.displayName || entry.username}</p>
                  <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">Level {entry.level}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {activeTab === 'global'
                    ? entry.totalXp?.toLocaleString()
                    : entry.weeklyXp?.toLocaleString()}{' '}
                  XP
                </p>
                {entry.currentStreak && entry.currentStreak > 0 && (
                  <p className="text-xs text-orange-400 mt-1 flex items-center justify-end space-x-1">
                    <span>🔥</span>
                    <span>{entry.currentStreak} day streak</span>
                  </p>
                )}
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-400">No entries yet. Be the first to play!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
