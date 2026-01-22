import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ChevronRight, Trophy, Zap, Home, Volume2, VolumeX, Share2, Download, Copy, Check, HelpCircle, Coins } from 'lucide-react';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import { sounds } from '../utils/sounds';
import { shareResults, copyShareText, generateShareImage } from '../utils/shareImage';
import EmailCollectionModal from '../components/EmailCollectionModal';
import api from '../api/client';

export default function Quiz() {
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const {
    currentQuestions,
    currentQuestionIndex,
    selectedAnswer,
    answerResult,
    sessionStats,
    isLoading,
    isAnswering,
    quizComplete,
    startQuiz,
    submitAnswer,
    nextQuestion,
    selectAnswer,
    resetQuiz,
  } = useQuizStore();

  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [xpSpentOnHints, setXpSpentOnHints] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const hasPlayedResultSound = useRef(false);
  const hasPlayedCompleteSound = useRef(false);
  const hasShownEmailModal = useRef(false);

  const HINT_COST = 25; // XP cost for using a hint

  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Toggle sound
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    sounds.setEnabled(newValue);
  };

  // Start quiz on mount
  useEffect(() => {
    resetQuiz();
    startQuiz(categorySlug, undefined, 10);
  }, [categorySlug, startQuiz, resetQuiz]);

  // Timer
  useEffect(() => {
    if (currentQuestion && !answerResult) {
      setTimeLeft(currentQuestion.timeLimit);
      setStartTime(Date.now());
      hasPlayedResultSound.current = false;
      setEliminatedOptions([]);
      setHintUsed(false);
    }
  }, [currentQuestion, answerResult]);

  // Play sound when answer result comes in
  useEffect(() => {
    if (answerResult && !hasPlayedResultSound.current) {
      hasPlayedResultSound.current = true;
      if (answerResult.isCorrect) {
        sounds.playCorrect();
      } else {
        sounds.playWrong();
      }
    }
  }, [answerResult]);

  // Play crowd cheer when quiz is complete and maybe show email modal
  useEffect(() => {
    if (quizComplete && !hasPlayedCompleteSound.current) {
      hasPlayedCompleteSound.current = true;
      sounds.playCrowdCheer();

      // Show email collection modal for first-time quiz completers
      const dismissed = localStorage.getItem('emailCollectionDismissed');
      const hasSubscribed = localStorage.getItem('emailSubscribed');
      if (!dismissed && !hasSubscribed && !hasShownEmailModal.current) {
        hasShownEmailModal.current = true;
        // Show after a short delay to let them see their results first
        setTimeout(() => setShowEmailModal(true), 2000);
      }
    }
  }, [quizComplete]);

  useEffect(() => {
    if (timeLeft <= 0 || answerResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit wrong answer
          handleSubmit(true);
          return 0;
        }
        // Play tick sounds
        if (prev <= 6) {
          sounds.playUrgentTick();
        } else if (prev <= 11) {
          sounds.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answerResult]);

  const handleSubmit = useCallback(
    async (timeout = false) => {
      if (!currentQuestion || answerResult || isAnswering) return;

      const timeTaken = timeout
        ? currentQuestion.timeLimit
        : Math.floor((Date.now() - startTime) / 1000);
      const answer = selectedAnswer || '';

      await submitAnswer(currentQuestion.id, answer, timeTaken);
    },
    [currentQuestion, selectedAnswer, answerResult, isAnswering, startTime, submitAnswer]
  );

  const handleNext = () => {
    nextQuestion();
  };

  const handleFinish = () => {
    fetchUser();
    navigate('/');
  };

  const getShareData = () => ({
    correct: sessionStats.correct,
    total: sessionStats.total,
    xpEarned: sessionStats.xpEarned,
    categoryName: currentQuestions[0]?.category?.name,
    username: user?.username || 'Anonymous',
  });

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareResults(getShareData());
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyShareText(getShareData());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadImage = async () => {
    const blob = await generateShareImage(getShareData());
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wrestling-quiz-results.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const useHint = async () => {
    if (!currentQuestion || hintUsed || answerResult || !user) return;
    if ((user.totalXp - xpSpentOnHints) < HINT_COST) return;

    try {
      // Call backend to get hint - this ensures correct answer is never eliminated
      const response = await api.post(`/questions/${currentQuestion.id}/hint`);
      const { eliminatedOptions: toEliminate } = response.data;

      setEliminatedOptions(toEliminate);
      setHintUsed(true);
      setHintsUsedCount(prev => prev + 1);
      setXpSpentOnHints(prev => prev + HINT_COST);
      sounds.playTick();
    } catch (error) {
      console.error('Failed to use hint:', error);
    }
  };

  const canUseHint = user && (user.totalXp - xpSpentOnHints) >= HINT_COST && !hintUsed && !answerResult;

  const handleEmailSubmit = async (email: string, subscribe: boolean) => {
    // Save to backend
    try {
      await api.post('/users/subscribe', { email, subscribe });
      if (subscribe) {
        localStorage.setItem('emailSubscribed', 'true');
      }
    } catch (error) {
      console.error('Failed to save email subscription:', error);
      // Still mark as done locally even if backend fails
      localStorage.setItem('emailCollectionDismissed', 'true');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Loading questions...</p>
      </div>
    );
  }

  if (quizComplete) {
    const accuracy = sessionStats.total > 0 ? (sessionStats.correct / sessionStats.total) * 100 : 0;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card text-center">
          <div className="mb-6">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
            <p className="text-gray-400">Great job testing your wrestling knowledge!</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="stat-card">
              <p className="stat-value text-green-400">{sessionStats.correct}</p>
              <p className="stat-label">Correct</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">{sessionStats.total}</p>
              <p className="stat-label">Total</p>
            </div>
            <div className="stat-card">
              <p className="stat-value text-blue-400">{accuracy.toFixed(0)}%</p>
              <p className="stat-label">Accuracy</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-3xl font-bold text-yellow-400">
                  +{sessionStats.xpEarned - xpSpentOnHints} XP
                  {xpSpentOnHints > 0 && (
                    <span className="text-sm text-yellow-600 ml-2">
                      ({sessionStats.xpEarned} earned - {xpSpentOnHints} hints)
                    </span>
                  )}
                </p>
                <p className="text-yellow-200/70 text-sm">
                  net XP this session
                  {hintsUsedCount > 0 && ` (${hintsUsedCount} hint${hintsUsedCount > 1 ? 's' : ''} used)`}
                </p>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="border-t border-gray-700 pt-6 mb-8">
            <p className="text-gray-400 text-sm mb-4">Share your results</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="btn-secondary flex items-center space-x-2 px-4 py-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{isSharing ? 'Sharing...' : 'Share'}</span>
              </button>
              <button
                onClick={handleDownloadImage}
                className="btn-secondary flex items-center space-x-2 px-4 py-2"
              >
                <Download className="w-4 h-4" />
                <span>Save Image</span>
              </button>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center space-x-2 px-4 py-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleFinish} className="btn-primary flex-1 flex items-center justify-center space-x-2">
              <Home className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <button
              onClick={() => {
                resetQuiz();
                startQuiz(categorySlug, undefined, 10);
              }}
              className="btn-secondary flex-1"
            >
              Play Again
            </button>
          </div>
        </div>

        {/* Email Collection Modal */}
        <EmailCollectionModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSubmit={handleEmailSubmit}
          userEmail={user?.email}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 mb-4">No questions available</p>
        <Link to="/categories" className="btn-primary">
          Choose a Category
        </Link>
      </div>
    );
  }

  const timerColor = timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-yellow-400' : 'text-white';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">
            Question {currentQuestionIndex + 1}
          </span>
          <span className={`badge badge-${currentQuestion.difficulty === 'easy' ? 'bronze' : currentQuestion.difficulty === 'medium' ? 'silver' : 'gold'}`}>
            {currentQuestion.difficulty}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <div className={`flex items-center space-x-2 ${timerColor}`}>
            <Clock className="w-5 h-5" />
            <span className="text-xl font-bold">{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-8">
        <div
          className="progress-fill"
          style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="card mb-6">
        <p className="text-xs text-gray-500 mb-2">{currentQuestion.category.name}</p>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{currentQuestion.questionText}</h2>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.answerOptions.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = answerResult?.correctAnswer === option;
            const isWrong = answerResult && isSelected && !answerResult.isCorrect;
            const isEliminated = eliminatedOptions.includes(option);

            let optionClass = 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/50';
            if (isEliminated && !answerResult) {
              optionClass = 'border-gray-800 bg-gray-900/50 opacity-40 cursor-not-allowed';
            } else if (answerResult) {
              if (isCorrect) {
                optionClass = 'border-green-500 bg-green-900/30';
              } else if (isWrong) {
                optionClass = 'border-red-500 bg-red-900/30';
              }
            } else if (isSelected) {
              optionClass = 'border-blue-500 bg-blue-900/30';
            }

            return (
              <button
                key={index}
                onClick={() => !answerResult && !isEliminated && selectAnswer(option)}
                disabled={!!answerResult || isEliminated}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${optionClass} ${
                  answerResult || isEliminated ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`${isEliminated && !answerResult ? 'line-through text-gray-600' : 'text-white'}`}>
                    {option}
                  </span>
                  {answerResult && isCorrect && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {isWrong && <XCircle className="w-6 h-6 text-red-400" />}
                  {isEliminated && !answerResult && <XCircle className="w-5 h-5 text-gray-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint Button */}
        {!answerResult && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={useHint}
              disabled={!canUseHint}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                canUseHint
                  ? 'bg-purple-900/50 border border-purple-700 text-purple-300 hover:bg-purple-800/50'
                  : 'bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              title={hintUsed ? 'Hint already used' : `Use 50/50 hint (costs ${HINT_COST} XP)`}
            >
              <HelpCircle className="w-5 h-5" />
              <span>50/50 Hint</span>
              <span className="flex items-center text-xs ml-2 px-2 py-0.5 rounded bg-gray-800">
                <Coins className="w-3 h-3 mr-1" />
                {HINT_COST} XP
              </span>
              {hintUsed && <Check className="w-4 h-4 ml-2 text-green-400" />}
            </button>
            {user && (
              <p className="text-xs text-gray-500 mt-2">
                Available XP: {Math.max(0, user.totalXp - xpSpentOnHints).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Answer Result */}
      {answerResult && (
        <div
          className={`card mb-6 ${
            answerResult.isCorrect
              ? 'bg-green-900/20 border-green-700'
              : 'bg-red-900/20 border-red-700'
          }`}
        >
          <div className="flex items-start space-x-4">
            {answerResult.isCorrect ? (
              <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`font-bold text-lg ${answerResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {answerResult.isCorrect ? 'Correct!' : 'Wrong!'}
              </p>
              {!answerResult.isCorrect && (
                <p className="text-gray-300 mt-1">
                  The correct answer was: <span className="font-semibold">{answerResult.correctAnswer}</span>
                </p>
              )}
              {answerResult.explanation && (
                <p className="text-gray-400 mt-2 text-sm">{answerResult.explanation}</p>
              )}
              {answerResult.xpEarned > 0 && (
                <p className="text-yellow-400 mt-2 font-semibold">+{answerResult.xpEarned} XP</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end">
        {!answerResult ? (
          <button
            onClick={() => handleSubmit()}
            disabled={!selectedAnswer || isAnswering}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isAnswering ? 'Submitting...' : 'Submit Answer'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary flex items-center space-x-2">
            <span>{currentQuestionIndex < currentQuestions.length - 1 ? 'Next Question' : 'See Results'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
