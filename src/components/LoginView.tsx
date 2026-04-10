import React from 'react';
import { motion } from 'motion/react';
import { X, FileText } from 'lucide-react';
import { useDoc } from '../contexts/DocContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export const LoginView = () => {
  const { 
    showLogin, setShowLogin, authMode, setAuthMode, 
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, 
    regData, setRegData, handleLogin, handleEmailLogin, 
    handleEmailRegister, handleForgotPassword 
  } = useDoc();

  if (!showLogin) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-[var(--bg)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="lb w-full max-w-[390px] bg-[var(--card)] border border-[var(--bd)] rounded-[var(--r4)] p-9 px-8 shadow-[var(--s3)] relative"
      >
        <button className="absolute top-4.5 right-4.5 w-8 h-8 rounded-[var(--r2)] border border-[var(--bd)] text-[var(--tx2)] flex items-center justify-center hover:bg-[var(--g100)]" onClick={() => setShowLogin(false)}>
          <X size={16} />
        </button>

        <div className="lb-brand flex items-center gap-2.5 mb-6">
          <div className="lb-mark w-9.5 h-9.5 rounded-[var(--r2)] bg-[var(--P)] flex items-center justify-center text-white">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold leading-tight">Doctify</h2>
            <p className="text-[12px] text-[var(--tx2)]">Documentation Platform</p>
          </div>
        </div>

        {authMode === 'login' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-[20px] font-bold mb-1">Welcome back</h3>
              <p className="text-[14px] text-[var(--tx2)]">Sign in to manage documentation</p>
            </div>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input 
                label="Username or Email" 
                value={loginEmail} 
                onChange={(e: any) => setLoginEmail(e.target.value)} 
                placeholder="type your username, or mail id" 
              />
              <Input 
                label="Password" 
                type="password" 
                value={loginPassword} 
                onChange={(e: any) => setLoginPassword(e.target.value)} 
                placeholder="type your password" 
              />
              <div className="flex justify-end">
                <button type="button" className="text-[12px] text-[var(--P)] hover:underline" onClick={handleForgotPassword}>Forgot password?</button>
              </div>
              <Button type="submit" className="w-full mt-1">Sign In</Button>
            </form>
            <div className="relative text-center my-3.5 before:content-[''] before:absolute before:top-1/2 before:left-0 before:right-0 before:h-[1px] before:bg-[var(--bd)]">
              <span className="relative bg-[var(--card)] px-3 text-[12px] text-[var(--tx2)]">or</span>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogin}>
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" /> Sign in with Google
            </Button>
            <div className="text-center text-[13px] text-[var(--tx2)]">
              New user? <button className="font-semibold text-[var(--P)] hover:underline" onClick={() => setAuthMode('register')}>Create an account →</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h3 className="text-[20px] font-bold mb-1">Create account</h3>
              <p className="text-[14px] text-[var(--tx2)]">Set up your Doctify admin account</p>
            </div>
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <Input label="Full Name" value={regData.name} onChange={(e: any) => setRegData({ ...regData, name: e.target.value })} placeholder="Your name" />
              <Input label="Username" value={regData.username} onChange={(e: any) => setRegData({ ...regData, username: e.target.value })} placeholder="Choose a username" />
              <Input label="Email" type="email" value={regData.email} onChange={(e: any) => setRegData({ ...regData, email: e.target.value })} placeholder="your@email.com" />
              <Input label="Password" type="password" value={regData.password} onChange={(e: any) => setRegData({ ...regData, password: e.target.value })} placeholder="Min 6 chars" />
              <Button type="submit" className="w-full mt-1">Create Account</Button>
            </form>
            <div className="text-center">
              <button className="text-[14px] text-[var(--tx2)] hover:text-[var(--tx)]" onClick={() => setAuthMode('login')}>← Back to Sign In</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
