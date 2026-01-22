import { useState } from 'react';
import { X, Mail, Gift, Check } from 'lucide-react';

interface EmailCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, subscribe: boolean) => Promise<void>;
  userEmail?: string;
}

export default function EmailCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  userEmail
}: EmailCollectionModalProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [subscribe, setSubscribe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(email, subscribe);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('emailCollectionDismissed', 'true');
    onClose();
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-900/30 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">You're All Set!</h3>
          <p className="text-gray-400">
            {subscribe
              ? "Check your inbox for exclusive wrestling content and deals!"
              : "Your preferences have been saved."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={handleSkip} />
      <div className="relative bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-900/30 rounded-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Great Job, Champion!</h2>
          <p className="text-gray-400">
            Get exclusive wrestling trivia, early access to new features, and special Big Blue Cage discounts!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={subscribe}
              onChange={(e) => setSubscribe(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">
              Yes! Send me weekly trivia challenges, Big Blue Cage product updates, and exclusive discounts.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3 text-lg font-semibold"
          >
            {isSubmitting ? 'Saving...' : 'Claim My Rewards'}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-gray-500 text-sm hover:text-gray-400 transition-colors"
          >
            No thanks, maybe later
          </button>
        </form>

        <p className="text-xs text-gray-600 mt-4 text-center">
          We respect your privacy. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
