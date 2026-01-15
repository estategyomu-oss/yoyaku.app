
import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { db } from './lib/mock-db';
import LoginPage from './pages/LoginPage';
import SlotsPage from './pages/SlotsPage';
import MyReservationsPage from './pages/MyReservationsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

type View = 'slots' | 'my' | 'admin' | 'profile' | 'login';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('session_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setCurrentView(u.role === Role.ADMIN ? 'admin' : 'slots');
    }
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('session_user', JSON.stringify(u));
    setCurrentView(u.role === Role.ADMIN ? 'admin' : 'slots');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('session_user');
    setCurrentView('login');
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('session_user', JSON.stringify(updatedUser));
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (!user || currentView === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-indigo-600 tracking-tight cursor-pointer" onClick={() => setCurrentView(user.role === Role.ADMIN ? 'admin' : 'slots')}>BookingSys</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('slots')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'slots' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                予約枠
              </button>
              {user.role === Role.USER && (
                <button
                  onClick={() => setCurrentView('my')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'my' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  マイ予約
                </button>
              )}
              {user.role === Role.ADMIN && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
                >
                  管理者
                </button>
              )}
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
              >
                アカウント設定
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">{user.company} / {user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {currentView === 'slots' && <SlotsPage user={user} />}
        {currentView === 'my' && <MyReservationsPage user={user} />}
        {currentView === 'admin' && <AdminPage user={user} />}
        {currentView === 'profile' && <ProfilePage user={user} onUpdate={handleProfileUpdate} />}
      </main>

      <footer className="py-6 border-t border-slate-200 text-center text-slate-400 text-sm">
        &copy; 2024 Corporate Booking System. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
