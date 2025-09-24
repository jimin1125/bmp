import React, { useState } from 'react';
import { BeetleIcon } from './icons';

interface AuthProps {
  onLogin: (username: string, password: string) => boolean;
  onRegister: (username: string, password: string) => string; // Returns error string or empty string on success
  loginError: string;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, loginError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setRegisterError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(username, password);
    } else {
      if (password !== confirmPassword) {
        setRegisterError('비밀번호가 일치하지 않습니다.');
        return;
      }
      const error = onRegister(username, password);
      if (error) {
        setRegisterError(error);
      } else {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        setIsLogin(true); 
        clearForm();
      }
    }
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-xl shadow-2xl p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
            <BeetleIcon className="w-16 h-16 text-primary"/>
            <h1 className="text-3xl font-bold text-text-primary">Beetle Manager Pro</h1>
            <p className="text-text-secondary">{isLogin ? '계정에 로그인하세요' : '새 계정을 만드세요'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full p-3 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
              required
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
              required
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          {!isLogin && (
             <div>
                <label className="block text-sm font-medium text-gray-700">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full p-3 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-gray-900"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
          )}
          
          {(isLogin && loginError) && <p className="text-sm text-red-500 text-center">{loginError}</p>}
          {(!isLogin && registerError) && <p className="text-sm text-red-500 text-center">{registerError}</p>}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary text-white rounded-md font-semibold hover:bg-primary/90 transition-colors shadow"
          >
            {isLogin ? '로그인' : '회원가입'}
          </button>
        </form>
        <p className="text-center text-sm">
          {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          <button onClick={toggleView} className="font-medium text-primary/80 hover:underline ml-2">
            {isLogin ? '가입하기' : '로그인하기'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;