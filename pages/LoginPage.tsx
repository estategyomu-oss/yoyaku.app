
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../lib/mock-db';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const user = await db.login(email, password);
        if (user) {
          onLogin(user);
        } else {
          setError('メールアドレスまたはパスワードが正しくありません');
        }
      } else {
        if (!company.trim()) {
          setError('会社名を入力してください');
          setIsLoading(false);
          return;
        }
        const newUser = await db.signup(email, password, company);
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900">
            {isLogin ? 'ログイン' : '新規アカウント登録'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isLogin ? '社内・社外予約システムへようこそ' : '会社名とメールアドレスで登録'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                会社名
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="株式会社〇〇"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:bg-indigo-400"
          >
            {isLoading ? '処理中...' : (isLogin ? 'ログイン' : '登録する')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-600">
            {isLogin ? 'アカウントをお持ちでないですか？' : '既にアカウントをお持ちですか？'}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="ml-2 text-indigo-600 font-bold hover:underline"
            >
              {isLogin ? '新規登録' : 'ログイン'}
            </button>
          </p>
        </div>

        <div className="mt-6">
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            管理者用初期アカウント: admin@internal / password123<br/>
            全てのデータはブラウザのLocalStorageに保存されます
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
