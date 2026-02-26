
import React, { useState } from 'react';
import { Page } from '../App';
import { User } from '../types';
import { ApiService } from '../services/api';
import { Footer } from './Layout';

interface AuthFlowProps {
  mode: Page.LOGIN | Page.SIGNUP | Page.FORGOT_PASSWORD;
  onNavigate: (page: Page) => void;
  onLoginSuccess: (user: User) => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ mode, onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    agree: false
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendError, setResendError] = useState('');

  const validatePassword = (pw: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(pw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setResendMsg('');
    setResendError('');

    if (mode === Page.SIGNUP) {
      if (!formData.email || !formData.name || !formData.password || !formData.mobile) {
        setErrorMsg('Fill all the mandatory fields.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('Password do not match');
        return;
      }
      if (!validatePassword(formData.password)) {
        setErrorMsg('Re-enter a valid password. (8+ chars, upper, lower, digit, special)');
        return;
      }
      if (!formData.agree) {
        setErrorMsg('Please agree to terms and conditions.');
        return;
      }
      try {
        await ApiService.signup({
          email: formData.email,
          name: formData.name,
          mobile: formData.mobile,
          password: formData.password
        });
        setIsPendingVerification(true);
      } catch (err: any) {
        setErrorMsg(err.message || 'Signup failed. Please try again.');
      }
    } else if (mode === Page.LOGIN) {
      if (!formData.email || !formData.password) {
        setErrorMsg('Please complete all fields.');
        return;
      }

      try {
        const user = await ApiService.login(formData.email, formData.password);
        onLoginSuccess(user);
      } catch (err: any) {
        setErrorMsg(err.message || 'No account found or incorrect password.');
      }
    } else {
      if (!formData.email) {
        setErrorMsg('Please enter your registered email.');
        return;
      }
      try {
        await ApiService.requestPasswordReset(formData.email);
        setSuccessMsg('Reset link sent to your email.');
      } catch (err: any) {
        setErrorMsg(err.message || 'Email/username not found.');
      }
    }
  };

  const handleResendVerification = async () => {
    setResendMsg('');
    setResendError('');

    if (!formData.email) {
      setResendError('Email is missing. Please sign up again.');
      return;
    }

    setIsResending(true);
    try {
      await ApiService.resendVerification(formData.email);
      setResendMsg('Verification link resent. Please check your email (and server logs).');
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  if (showTerms) {
    return (
      <div className="min-h-screen bg-[#e0fcfc] flex flex-col">
        <header className="bg-[#5ce1e6] p-4 flex justify-between items-center ">
          <img src="components/images/logo.png" alt="HUB" className="h-12 cursor-pointer" onClick={() => onNavigate(Page.LANDING)} />
        </header>
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full ">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Terms, Conditions and Privacy</h2>
            <ul className="list-disc list-inside space-y-4 text-gray-700 font-medium">
              <li>I agree not to post toxic, harmful, or abusive content.</li>
              <li>I agree to verify my email address to activate my account.</li>
              <li>I agree to upload only Sinhala Unicode text.</li>
              <li>I agree to deletion conditions, which deletes all data permanently.</li>
            </ul>
            <div className="mt-10 flex flex-col gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={formData.agree} onChange={e => setFormData({...formData, agree: e.target.checked})} />
                <span className="font-bold text-gray-600">I agree to the Terms & Conditions</span>
              </label>
              <button 
                onClick={() => setShowTerms(false)}
                className="w-full py-3 btn-custom font-bold rounded-full border-2 border-[#5ce1e6] shadow-md"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isPendingVerification) {
    return (
      <div className="min-h-screen bg-[#e0fcfc] flex flex-col">
        <header className="bg-[#5ce1e6] p-4 flex justify-between items-center">
          <img src="components/images/logo.png" alt="HUB" className="h-10 cursor-pointer" onClick={() => onNavigate(Page.LANDING)} />
        </header>
        <div className="flex-grow flex items-center justify-center p-6">
           <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-lg text-center">
             <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>
             </div>
             <p className="text-gray-700 font-bold mb-4 text-lg">Verify the link which was sent to your registered mail</p>
             {resendMsg && <p className="text-green-600 font-bold text-sm mb-3">{resendMsg}</p>}
             {resendError && <p className="text-red-500 font-bold text-sm mb-3">{resendError}</p>}
             <button
               onClick={handleResendVerification}
               disabled={isResending}
               className="text-red-500 font-bold hover:underline mb-8 block disabled:opacity-50"
             >
               {isResending ? 'Resending...' : 'Resend the link'}
             </button>
             <button 
               onClick={() => { setIsPendingVerification(false); onNavigate(Page.LOGIN); }}
               className="w-full py-3 btn-custom font-bold rounded-full border-2 border-[#5ce1e6]"
             >
               Go to Login
             </button>
           </div>
        </div>
        <Footer />
      </div>
    );
  }

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
            className={`px-6 py-2 font-bold transition-all rounded-full border-2 border-[#57eaea] shadow-sm ${mode === Page.LOGIN ? 'bg-white text-[#5ce1e6]' : 'btn-custom'}`}
          >
            LOG IN
          </button>
          <button 
            onClick={() => onNavigate(Page.SIGNUP)}
            className={`px-6 py-2 font-bold transition-all rounded-full border-2 border-[#57eaea]  ${mode === Page.SIGNUP ? 'bg-white text-[#5ce1e6]' : 'btn-custom'}`}
          >
            SIGN UP
          </button>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center p-6">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-[#1a1a1a] font-helvetica-world">
          {mode === Page.LOGIN ? 'Welcome Back' : mode === Page.SIGNUP ? 'Join Hub' : 'Reset Password'}
        </h2>
        {mode === Page.LOGIN && (
          <p className="text-gray-500 mt-2 text-sm italic">Use your verified email and password.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === Page.SIGNUP && (
          <>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </span>
              <input 
                className="w-full p-4 pl-12 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium shadow-sm"
                placeholder="Email Address"
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </span>
              <input 
                className="w-full p-4 pl-12 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium shadow-sm"
                placeholder="Name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
              </span>
              <input 
                className="w-full p-4 pl-12 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium shadow-sm"
                placeholder="+94---------"
                value={formData.mobile}
                onChange={e => setFormData({...formData, mobile: e.target.value})}
              />
            </div>
          </>
        )}

        {(mode === Page.LOGIN || mode === Page.FORGOT_PASSWORD) && (
           <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </span>
            <input 
              className="w-full p-4 pl-12 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium shadow-sm"
              placeholder="Email Address"
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        )}

        {mode !== Page.FORGOT_PASSWORD && (
          <div className="flex gap-4">
             <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                </span>
                <input 
                  className="w-full p-4 pl-12 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium "
                  placeholder="Password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
             </div>
             {mode === Page.SIGNUP && (
                <div className="relative flex-1">
                  <input 
                    className="w-full p-4 bg-white rounded-full border-none focus:ring-2 focus:ring-[#57eaea] text-black font-medium "
                    placeholder="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
             )}
          </div>
        )}

        {mode === Page.LOGIN && (
          <div className="flex justify-between items-center px-4 text-sm font-medium text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-cyan-500" />
              Remember Me
            </label>
            <button 
              type="button" 
              onClick={() => onNavigate(Page.FORGOT_PASSWORD)}
              className="hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {mode === Page.SIGNUP && (
          <label className="flex items-center gap-3 px-4 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={formData.agree} onChange={e => setFormData({...formData, agree: e.target.checked})} />
            <span className="font-bold text-gray-600 text-sm">
              I agree to the <button type="button" onClick={() => setShowTerms(true)} className="underline">Terms & Conditions</button>
            </span>
          </label>
        )}

        {errorMsg && <p className="text-red-500 text-center font-bold text-sm">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 text-center font-bold text-sm">{successMsg}</p>}

        <button 
          type="submit"
          className="w-full py-4 btn-custom font-bold text-xl rounded-full border-2 border-[#5ce1e6]  mt-4"
        >
          {mode === Page.LOGIN ? 'Login' : mode === Page.SIGNUP ? 'Create Account' : 'Send Reset Link'}
        </button>

        <div className="text-center text-gray-500 font-medium mt-4">
          or <button 
            type="button" 
            onClick={() => onNavigate(mode === Page.LOGIN ? Page.SIGNUP : Page.LOGIN)}
            className="text-[#5ce1e6] font-bold hover:underline"
          >
            {mode === Page.LOGIN ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </form>
    </div>
  </div>

  <Footer />
</div>
  );
};

export default AuthFlow;
