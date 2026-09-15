import React, { useState } from 'react';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'react-hot-toast';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface MustChangePasswordModalProps {
  profile: UserProfile;
  onSuccess: () => void;
}

export const MustChangePasswordModal: React.FC<MustChangePasswordModalProps> = ({ profile, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength validation
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasLetter, hasNumber, hasSymbol].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) {
      toast.error('Active session not found. Please log in again.');
      return;
    }

    if (!hasMinLength) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Securing your account with new password...');

    try {
      // 1. Update Firebase Auth password
      await updatePassword(auth.currentUser, newPassword);

      // 2. Clear mustChangePassword flag in Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        mustChangePassword: false,
        tempPasswordIssued: false,
        passwordChangedAt: Date.now()
      });

      toast.success('Your new permanent password has been set! Welcome.', { id: toastId });
      onSuccess();
    } catch (error: any) {
      console.warn('Password update notice:', error?.message || error);
      const code = error?.code || '';
      if (code === 'auth/requires-recent-login') {
        toast.error('Session expired. Please log out and sign in again with your temporary password.', { id: toastId });
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use at least 6 characters with mixed letters and numbers.', { id: toastId });
      } else {
        toast.error(error?.message || 'Failed to update password. Please try again.', { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out safely.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Set Your New Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Staff Account Security Setup
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-3.5 mb-6 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <p className="font-semibold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Temporary Credentials Reset
          </p>
          Your password was recently reset by your pharmacy manager. For your privacy and data security, please choose a permanent personal password to continue.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a private password"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-800 dark:text-white text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength meter */}
            {newPassword.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex gap-1 h-1.5 w-full">
                  <div className={`flex-1 rounded-full ${strengthScore >= 1 ? (strengthScore === 1 ? 'bg-rose-500' : strengthScore <= 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full ${strengthScore >= 2 ? (strengthScore === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full ${strengthScore >= 4 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    {strengthScore <= 1 && 'Weak password'}
                    {strengthScore === 2 && 'Fair password'}
                    {strengthScore === 3 && 'Good password'}
                    {strengthScore >= 4 && 'Strong password'}
                  </span>
                  <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {hasMinLength ? '✓ 6+ chars' : 'Min. 6 chars'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-800 dark:text-white text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
              </p>
            )}
          </div>

          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !hasMinLength || newPassword !== confirmPassword}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Save Permanent Password & Continue
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogOut}
              className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cancel & Log Out
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
