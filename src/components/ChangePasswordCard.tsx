import React, { useState } from 'react';
import { 
  EmailAuthProvider, 
  GoogleAuthProvider, 
  reauthenticateWithCredential, 
  reauthenticateWithPopup, 
  updatePassword, 
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  ShieldCheck, 
  RefreshCw,
  KeyRound
} from 'lucide-react';

interface ChangePasswordCardProps {
  currentUser?: User | null;
}

export const ChangePasswordCard: React.FC<ChangePasswordCardProps> = ({ currentUser }) => {
  const user = currentUser || auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isGoogleReauthing, setIsGoogleReauthing] = useState(false);

  // Check providers
  const isGoogleUser = user?.providerData.some(p => p.providerId === 'google.com') ?? false;
  const isPasswordUser = user?.providerData.some(p => p.providerId === 'password') ?? false;
  const isStaffAccount = user?.email?.endsWith('@staff.atech.com') ?? false;

  // Password strength calculation
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasLetter, hasNumber, hasSymbol].filter(Boolean).length;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Active session not found. Please log in again.');
      return;
    }

    if (!hasMinLength) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Verifying credentials & updating password...');

    try {
      // 1. If user has a password provider and provided their current password, re-authenticate first
      if (user.email && currentPassword.trim()) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword.trim());
        await reauthenticateWithCredential(user, credential);
      } else if (!isGoogleUser && !currentPassword.trim()) {
        toast.dismiss(toastId);
        toast.error('Please enter your current password to verify your identity.');
        setIsSubmitting(false);
        return;
      }

      // 2. Perform password update
      await updatePassword(user, newPassword);

      // 3. Clear temporary reset flags in Firestore if present
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        await updateDoc(doc(db, 'users', user.uid), {
          mustChangePassword: false,
          tempPasswordIssued: false,
          passwordChangedAt: Date.now()
        });
      } catch (firestoreErr) {
        console.warn('Could not update password flags in Firestore profile:', firestoreErr);
      }

      toast.success('Password updated successfully in Firebase Authentication!', { id: toastId });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.warn('Password update notice:', error?.message || error);
      const code = error?.code || '';

      if (code === 'auth/requires-recent-login') {
        toast.error(
          'Security check: Firebase requires a fresh login. Please re-enter your current password above or send a reset email.',
          { id: toastId, duration: 6000 }
        );
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect. Please check and try again.', { id: toastId });
      } else if (code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use at least 6 characters with mixed letters and numbers.', { id: toastId });
      } else if (code === 'auth/user-mismatch') {
        toast.error('Credentials mismatch with active session.', { id: toastId });
      } else {
        toast.error(error?.message || 'Failed to update password. Please try again.', { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleReauthAndUpdate = async () => {
    if (!user) return;
    if (!hasMinLength) {
      toast.error('Please enter a new password of at least 6 characters first.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsGoogleReauthing(true);
    const toastId = toast.loading('Re-authenticating with Google...');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await reauthenticateWithPopup(user, provider);
      
      // Update password once reauthenticated
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully with Google verification!', { id: toastId });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Google re-auth error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        toast.error('Google sign-in popup was closed.', { id: toastId });
      } else {
        toast.error(error?.message || 'Google re-authentication failed.', { id: toastId });
      }
    } finally {
      setIsGoogleReauthing(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      toast.error('No email found for current user session.');
      return;
    }

    setIsSendingReset(true);
    const toastId = toast.loading(`Sending password reset email to ${user.email}...`);

    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success(`Password reset email sent to ${user.email}! Check your inbox.`, { 
        id: toastId, 
        duration: 5000 
      });
    } catch (error: any) {
      console.error('Password reset email error:', error);
      toast.error(error?.message || 'Failed to send reset email. Please try again later.', { id: toastId });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Change Password
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Safely update your security credentials with instant session re-authentication.
          </p>
        </div>

        {isGoogleUser && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            Google SSO
          </span>
        )}
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        {/* Current Password Field */}
        {!isGoogleUser && (
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Current Password</span>
              {!isStaffAccount ? (
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={isSendingReset}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  Forgot current password?
                </button>
              ) : (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Forgot? Ask manager to reset
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your existing password"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-800 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* New Password Field */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            New Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-800 dark:text-white text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {newPassword.length > 0 && (
            <div className="pt-1.5 space-y-1.5">
              <div className="flex gap-1 h-1.5 w-full">
                <div className={`flex-1 rounded-full transition-colors ${strengthScore >= 1 ? (strengthScore === 1 ? 'bg-rose-500' : strengthScore <= 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                <div className={`flex-1 rounded-full transition-colors ${strengthScore >= 2 ? (strengthScore === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`} />
                <div className={`flex-1 rounded-full transition-colors ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <div className={`flex-1 rounded-full transition-colors ${strengthScore >= 4 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {strengthScore <= 1 && 'Weak password'}
                  {strengthScore === 2 && 'Moderate password'}
                  {strengthScore === 3 && 'Good password'}
                  {strengthScore >= 4 && 'Strong password'}
                </span>
                <span className={hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                  {hasMinLength ? '✓ 6+ characters' : 'Min. 6 chars'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:bg-slate-800 dark:text-white text-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Passwords do not match
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !hasMinLength || (confirmPassword !== '' && newPassword !== confirmPassword)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2 text-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>

          {isGoogleUser && (
            <button
              type="button"
              onClick={handleGoogleReauthAndUpdate}
              disabled={isGoogleReauthing || !hasMinLength || (confirmPassword !== '' && newPassword !== confirmPassword)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGoogleReauthing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Google...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Verify with Google & Update
                </>
              )}
            </button>
          )}

          {!isStaffAccount ? (
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={isSendingReset}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              {isSendingReset ? 'Sending Email...' : 'Send Reset Link to Email'}
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic ml-auto flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Staff password managed via Pharmacy Owner
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
