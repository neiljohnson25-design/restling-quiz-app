import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Check, Star, Zap, Trophy, Award, Flame, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { avatars, getUnlockedAvatars, getAvatarById, type Avatar } from '../utils/avatars';
import api from '../api/client';

export default function Profile() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.avatarUrl) {
      setSelectedAvatar(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const unlockedAvatars = getUnlockedAvatars(user.level);
  const currentAvatar = getAvatarById(user.avatarUrl || 'rookie');

  const handleAvatarSelect = (avatar: Avatar) => {
    if (avatar.unlockLevel <= user.level) {
      setSelectedAvatar(avatar.id);
    }
  };

  const handleSave = async () => {
    if (!selectedAvatar || selectedAvatar === user.avatarUrl) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await api.put('/auth/profile', { avatarUrl: selectedAvatar });
      await fetchUser();
      setSaveMessage('Avatar updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('Failed to update avatar. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const xpForNextLevel = Math.floor(500 * Math.pow(user.level, 1.5));
  const xpProgress = user.totalXp % xpForNextLevel;
  const xpProgressPercent = (xpProgress / xpForNextLevel) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 animate-fadeIn">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl border border-purple-500/20">
            <User className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Your Profile</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Current Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-5xl shadow-2xl shadow-blue-500/25 border-2 border-white/10">
                {currentAvatar?.emoji || '🥋'}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-3 font-medium">{currentAvatar?.name || 'Rookie'}</p>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{user.displayName || user.username}</h2>
            <p className="text-slate-500">@{user.username}</p>

            {/* Level & XP Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">Level {user.level}</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">{user.totalXp.toLocaleString()} XP</span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-4 max-w-sm mx-auto md:mx-0">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Progress to Level {user.level + 1}</span>
                </div>
                <span className="text-slate-500 font-mono text-xs">{Math.round(xpProgressPercent)}%</span>
              </div>
              <div className="progress-bar h-2.5">
                <div className="progress-fill" style={{ width: `${xpProgressPercent}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {xpProgress.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex justify-center md:justify-start gap-4 mt-5">
              <div className="px-4 py-2.5 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold text-lg">{user.currentStreak}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Day Streak</p>
              </div>
              <div className="px-4 py-2.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-purple-400">
                  <Trophy className="w-4 h-4" />
                  <span className="font-bold text-lg">{user.longestStreak}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Best Streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selection */}
      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-lg border border-blue-500/20">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Choose Your Avatar</h3>
        </div>
        <p className="text-slate-400 text-sm mb-6 ml-11">
          Select an avatar to represent you on the leaderboards. Unlock more avatars by leveling up!
        </p>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
          {avatars.map((avatar, index) => {
            const isUnlocked = avatar.unlockLevel <= user.level;
            const isSelected = selectedAvatar === avatar.id;
            const isCurrent = user.avatarUrl === avatar.id;

            return (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar)}
                disabled={!isUnlocked}
                className={`relative p-3 rounded-xl transition-all duration-200 animate-fadeIn ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-blue-900/40 border-2 border-blue-500 ring-2 ring-blue-500/30 scale-105'
                      : 'bg-slate-800/40 border-2 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60 hover:scale-105'
                    : 'bg-slate-900/30 border-2 border-slate-800/50 cursor-not-allowed opacity-40'
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
                title={isUnlocked ? `${avatar.name}: ${avatar.description}` : `Unlock at Level ${avatar.unlockLevel}`}
              >
                <div className="text-3xl text-center">
                  {isUnlocked ? avatar.emoji : <Lock className="w-6 h-6 mx-auto text-slate-600" />}
                </div>
                {isUnlocked && (
                  <p className="text-xs text-slate-400 text-center mt-1.5 truncate font-medium">{avatar.name}</p>
                )}
                {!isUnlocked && (
                  <p className="text-xs text-slate-600 text-center mt-1.5 font-medium">Lv.{avatar.unlockLevel}</p>
                )}
                {isCurrent && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {isSelected && !isCurrent && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Unlock Progress */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Avatars Unlocked
            </span>
            <span className="text-white font-bold">
              {unlockedAvatars.length} / {avatars.length}
            </span>
          </div>
          <div className="progress-bar mt-3 h-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(unlockedAvatars.length / avatars.length) * 100}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        {selectedAvatar && selectedAvatar !== user.avatarUrl && (
          <div className="mt-6 flex items-center justify-between p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
            <div>
              {saveMessage && (
                <p className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {saveMessage}
                </p>
              )}
              {!saveMessage && (
                <p className="text-sm text-slate-400">Ready to update your avatar?</p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? 'Saving...' : 'Save Avatar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
