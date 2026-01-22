import { useEffect, useState } from 'react';
import { Award, Lock, CheckCircle, Star } from 'lucide-react';
import api from '../api/client';
import type { Achievement, Belt } from '../types';

type TabType = 'achievements' | 'belts';

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<TabType>('achievements');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'achievements') {
        const response = await api.get('/achievements/user');
        setAchievements(response.data.achievements);
      } else {
        const response = await api.get('/belts/user');
        setBelts(response.data.belts);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEquip = async (id: string) => {
    try {
      await api.put(`/achievements/${id}/equip`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle equip:', error);
    }
  };

  const toggleDisplay = async (id: string) => {
    try {
      await api.put(`/belts/${id}/display`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle display:', error);
    }
  };

  const getBeltTierStyle = (tier?: string) => {
    switch (tier) {
      case 'bronze':
        return 'border-amber-700 bg-amber-900/20';
      case 'silver':
        return 'border-gray-500 bg-gray-700/20';
      case 'gold':
        return 'border-yellow-600 bg-yellow-900/20';
      case 'championship':
        return 'border-yellow-400 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20';
      default:
        return 'border-gray-700';
    }
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400';
      case 'rare':
        return 'text-blue-400';
      case 'legendary':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Achievements & Belts</h1>
        <p className="text-gray-400">Track your accomplishments and show off your collection</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Achievements</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('belts')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'belts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Championship Belts</span>
          </div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === 'achievements' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`card relative ${getBeltTierStyle(achievement.beltTier)} ${
                !achievement.unlocked ? 'opacity-60' : ''
              }`}
            >
              {!achievement.unlocked && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
              )}
              {achievement.unlocked && (
                <div className="absolute top-3 right-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-800 rounded-xl">
                  <Award
                    className={`w-8 h-8 ${
                      achievement.unlocked ? 'text-yellow-400' : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-400">+{achievement.xpReward} XP</span>
                    {achievement.beltTier && (
                      <span className={`badge badge-${achievement.beltTier}`}>
                        {achievement.beltTier}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {achievement.unlocked && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => toggleEquip(achievement.id)}
                    className={`text-sm ${
                      achievement.isEquipped
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {achievement.isEquipped ? 'Equipped ✓' : 'Equip to Profile'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {belts.map((belt) => (
            <div
              key={belt.id}
              className={`card relative ${!belt.owned ? 'opacity-60' : ''}`}
            >
              {!belt.owned && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center">
                  <Star
                    className={`w-12 h-12 ${belt.owned ? 'text-yellow-400' : 'text-gray-600'}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-white">{belt.name}</h3>
                    <span className={`text-xs font-medium ${getRarityStyle(belt.rarity)}`}>
                      {belt.rarity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{belt.description}</p>
                  {belt.category && (
                    <span className="text-xs text-blue-400">{belt.category.name}</span>
                  )}
                </div>
              </div>

              {belt.owned && (
                <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => toggleDisplay(belt.id)}
                    className={`text-sm ${
                      belt.isDisplayed
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {belt.isDisplayed ? 'Displayed ✓' : 'Display on Profile'}
                  </button>
                  {belt.bigBlueCageProductUrl && (
                    <a
                      href={belt.bigBlueCageProductUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-yellow-400 hover:text-yellow-300"
                    >
                      Get Real Belt →
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Big Blue Cage CTA */}
      <div className="mt-12 card bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-blue-700">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Star className="w-12 h-12 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Collect Virtual Belts, Design Real Ones!</h3>
              <p className="text-gray-300">
                Create your own custom championship belt at Big Blue Cage.
              </p>
            </div>
          </div>
          <a
            href="https://bigbluecage.com/custom-belts"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary whitespace-nowrap"
          >
            Design Your Belt
          </a>
        </div>
      </div>
    </div>
  );
}
