import React, { useEffect, useState } from 'react';
import { Page } from '../App';
import { ApiService } from '../services/api';
import { Footer } from './Layout';

interface ResetPasswordProps {
  token: string;
  onNavigate: (page: Page) => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'validating' | 'ready' | 'error' | 'success'>('validating');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    ApiService.validateResetToken(token)
      .then(() => {
        if (isMounted) {
          setStatus('ready');
          setMessage('');
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setStatus('error');
          setMessage(err.message || 'Reset link is invalid or expired.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const validatePassword = (pw: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(pw);
  };

  useEffect(() => {
    if (status !== 'success') return;
    const timer = window.setTimeout(() => onNavigate(Page.LOGIN), 2000);
    return () => window.clearTimeout(timer);
  }, [status, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (!validatePassword(password)) {
      setMessage('Weak password');
      return;
    }

    try {
      await ApiService.resetPassword(token, password);
      setStatus('success');
      setMessage('Password updated successfully');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#e0fcfc] flex flex-col">
      <header className="bg-[#57eaea] p-4 flex justify-between items-center">
        <img
          src="components/images/logo.png"
          alt="HUB"
          className="h-10 cursor-pointer"
          onClick={() => onNavigate(Page.LANDING)}
        />
        <div className="flex gap-4">
          <button
            onClick={() => onNavigate(Page.LOGIN)}
            className="px-6 py-2 font-bold transition-all rounded-full border-2 border-[#57eaea] shadow-sm btn-custom"
          >
            LOG IN
          </button>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-[#1a1a1a] font-helvetica-world">Reset Password</h2>
            {status === 'validating' && (
              <p className="text-gray-500 mt-2 text-sm italic">Validating your reset link...</p>
            )}
          </div>

          {status === 'error' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <p className="text-red-500 font-bold text-sm">{message || 'Reset link is invalid or expired.'}</p>
              <button
                onClick={() => onNavigate(Page.FORGOT_PASSWORD)}
                className="mt-6 w-full py-3 btn-custom font-bold rounded-full border-2 border-[#5ce1e6]"
              >
                Request New Link
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
              <p className="text-green-600 font-bold text-sm">{message}</p>
              <p className="text-gray-500 text-xs mt-2">Redirecting to login...</p>
              <button
                onClick={() => onNavigate(Page.LOGIN)}
                className="mt-6 w-full py-3 btn-custom font-bold rounded-full border-2 border-[#5ce1e6]"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  className="w-full p-4 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium"
                  placeholder="New Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div className="relative">
                <input
                  className="w-full p-4 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium"
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              {message && <p className="text-red-500 text-center font-bold text-sm">{message}</p>}
              <button
                type="submit"
                className="w-full py-4 btn-custom font-bold text-xl rounded-full border-2 border-[#5ce1e6] mt-4"
              >
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ResetPassword;
