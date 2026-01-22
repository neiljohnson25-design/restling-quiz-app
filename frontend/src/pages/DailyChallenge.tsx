import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight, Zap, Trophy } from 'lucide-react';
import api from '../api/client';
import type { Question, DailyChallenge as DailyChallengeType } from '../types';

export default function DailyChallenge() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<DailyChallengeType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/challenges/today');
      setChallenge(response.data.challenge);
      setQuestions(response.data.questions);
      if (response.data.challenge.completed) {
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (currentQuestion && !answerResult && !isComplete) {
      setTimeLeft(currentQuestion.timeLimit);
      setStartTime(Date.now());
    }
  }, [currentQuestion, answerResult, isComplete]);

  useEffect(() => {
    if (timeLeft <= 0 || answerResult || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answerResult, isComplete]);

  const handleSubmit = useCallback(
    async (timeout = false) => {
      if (!currentQuestion || answerResult || isAnswering) return;

      setIsAnswering(true);
      const timeTaken = timeout
        ? currentQuestion.timeLimit
        : Math.floor((Date.now() - startTime) / 1000);
      const answer = selectedAnswer || '';

      try {
        const response = await api.post(`/questions/${currentQuestion.id}/answer`, {
          answer,
          timeTaken,
        });
        const result = response.data.result;
        setAnswerResult(result);
        setSessionStats((prev) => ({
          correct: prev.correct + (result.isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));
      } catch (error) {
        console.error('Failed to submit answer:', error);
      } finally {
        setIsAnswering(false);
      }
    },
    [currentQuestion, selectedAnswer, answerResult, isAnswering, startTime]
  );

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswerResult(null);
    } else {
      // Complete challenge
      try {
        const response = await api.post(`/challenges/${challenge?.id}/complete`, {
          score: sessionStats.correct,
          correctCount: sessionStats.correct,
          totalQuestions: questions.length,
        });
        setCompletionResult(response.data.result);
        setIsComplete(true);
      } catch (error) {
        console.error('Failed to complete challenge:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">No Challenge Available</h1>
        <p className="text-gray-400">Check back later for today's challenge!</p>
      </div>
    );
  }

  if (isComplete || challenge.completed) {
    const result = completionResult || {
      score: challenge.score,
      accuracy: challenge.score / challenge.questionCount * 100,
      bonusXpEarned: Math.floor(challenge.bonusXp * (challenge.score / challenge.questionCount)),
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card text-center">
          <div className="mb-6">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Daily Challenge Complete!</h1>
            <p className="text-gray-400">
              {new Date(challenge.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="stat-card">
              <p className="stat-value text-green-400">{result.correctCount || result.score}</p>
              <p className="stat-label">Correct</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">{challenge.questionCount}</p>
              <p className="stat-label">Total</p>
            </div>
            <div className="stat-card">
              <p className="stat-value text-blue-400">{result.accuracy?.toFixed(0) || 0}%</p>
              <p className="stat-label">Accuracy</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-blue-800/30 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-3xl font-bold text-purple-400">+{result.bonusXpEarned || 0} XP</p>
                <p className="text-purple-200/70 text-sm">Daily Challenge Bonus</p>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const timerColor = timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-yellow-400' : 'text-white';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-purple-600/30 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Daily Challenge</h1>
            <p className="text-sm text-gray-400">Bonus: +{challenge.bonusXp} XP</p>
          </div>
        </div>
        <div className="text-gray-400">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar mb-6">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Timer */}
      <div className={`flex items-center justify-center space-x-2 mb-6 ${timerColor}`}>
        <Clock className="w-5 h-5" />
        <span className="text-2xl font-bold">{timeLeft}s</span>
      </div>

      {/* Question */}
      <div className="card mb-6">
        <p className="text-xs text-gray-500 mb-2">{currentQuestion.category.name}</p>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">{currentQuestion.questionText}</h2>

        <div className="space-y-3">
          {currentQuestion.answerOptions.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = answerResult?.correctAnswer === option;
            const isWrong = answerResult && isSelected && !answerResult.isCorrect;

            let optionClass = 'border-gray-700 hover:border-purple-500 hover:bg-gray-800/50';
            if (answerResult) {
              if (isCorrect) {
                optionClass = 'border-green-500 bg-green-900/30';
              } else if (isWrong) {
                optionClass = 'border-red-500 bg-red-900/30';
              }
            } else if (isSelected) {
              optionClass = 'border-purple-500 bg-purple-900/30';
            }

            return (
              <button
                key={index}
                onClick={() => !answerResult && setSelectedAnswer(option)}
                disabled={!!answerResult}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${optionClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{option}</span>
                  {answerResult && isCorrect && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {isWrong && <XCircle className="w-6 h-6 text-red-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result */}
      {answerResult && (
        <div
          className={`card mb-6 ${
            answerResult.isCorrect ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'
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
                  Answer: <span className="font-semibold">{answerResult.correctAnswer}</span>
                </p>
              )}
              {answerResult.explanation && (
                <p className="text-gray-400 mt-2 text-sm">{answerResult.explanation}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!answerResult ? (
          <button
            onClick={() => handleSubmit()}
            disabled={!selectedAnswer || isAnswering}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <span>{isAnswering ? 'Submitting...' : 'Submit'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary flex items-center space-x-2">
            <span>{currentIndex < questions.length - 1 ? 'Next' : 'Complete'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
