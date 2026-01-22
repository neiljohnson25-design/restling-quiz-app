import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Star, ChevronRight, Trophy } from 'lucide-react';
import { useQuizStore } from '../stores/quizStore';

export default function Categories() {
  const { categories, fetchCategories, isLoading } = useQuizStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 animate-fadeIn">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-xl border border-blue-500/20">
            <Trophy className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Quiz Categories</h1>
        </div>
        <p className="text-slate-400 ml-14">Choose a category to test your wrestling knowledge</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            to={category.isLocked ? '#' : `/quiz/${category.slug}`}
            className={`card group relative overflow-hidden transition-all duration-300 animate-fadeIn ${
              category.isLocked
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10'
            }`}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Gradient accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ background: category.isLocked ? '#374151' : `linear-gradient(90deg, ${category.colorTheme}, ${category.colorTheme}99)` }}
            />

            {/* Hover glow effect */}
            {!category.isLocked && (
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${category.colorTheme}15, transparent 70%)` }}
              />
            )}

            {/* Locked Overlay */}
            {category.isLocked && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
                <div className="p-3 bg-slate-800/50 rounded-full mb-3">
                  <Lock className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Unlock at Level {category.unlockLevel}</p>
              </div>
            )}

            <div className="relative pt-2">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{category.name}</h2>
                </div>
                <ChevronRight
                  className={`w-6 h-6 text-slate-500 transform transition-all ${
                    !category.isLocked ? 'group-hover:translate-x-1 group-hover:text-blue-400' : ''
                  }`}
                />
              </div>

              {category.description && (
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">{category.description}</p>
              )}

              {/* Mastery Stars */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 transition-all duration-300 ${
                        i < (category.userProgress?.masteryLevel || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      } ${!category.isLocked ? 'group-hover:scale-110' : ''}`}
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
                {category.userProgress && (
                  <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
                    {category.userProgress.questionsCorrect}/{category.userProgress.questionsAnswered} correct
                  </span>
                )}
              </div>

              {/* XP Progress Bar */}
              {category.userProgress && category.userProgress.categoryXp > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Category XP</span>
                    <span>{category.userProgress.categoryXp.toLocaleString()} XP</span>
                  </div>
                  <div className="progress-bar h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((category.userProgress.categoryXp / 1000) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${category.colorTheme}, ${category.colorTheme}cc)`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
