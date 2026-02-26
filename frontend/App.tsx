
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthFlow from './components/AuthFlow';
import Dashboard from './components/Dashboard';
import Followers from './components/Followers';
import ProfileSettings from './components/ProfileSettings';
import NotificationsView from './components/NotificationsView';
import ResetPassword from './components/ResetPassword';
import { User, Notification } from './types';


export enum Page {
  LANDING,
  LOGIN,
  SIGNUP,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  DASHBOARD,
  FOLLOWERS,
  SETTINGS,
  NOTIFICATIONS
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LANDING);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Initialize with dummy data if needed or check local storage
  useEffect(() => {
    // Check if session exists (mock)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    if (token) {
      setResetToken(token);
      setCurrentPage(Page.RESET_PASSWORD);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const addNotification = (msg: string) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      message: msg,
      timestamp: new Date().toISOString(),
      is_read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    setHasNewNotifications(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage(Page.LANDING);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.LANDING:
        return <LandingPage onNavigate={setCurrentPage} />;
      case Page.LOGIN:
      case Page.SIGNUP:
      case Page.FORGOT_PASSWORD:
        return <AuthFlow 
          mode={currentPage} 
          onNavigate={setCurrentPage} 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setCurrentPage(Page.DASHBOARD);
          }} 
        />;
      case Page.RESET_PASSWORD:
        return resetToken ? (
          <ResetPassword token={resetToken} onNavigate={setCurrentPage} />
        ) : (
          <AuthFlow 
            mode={Page.FORGOT_PASSWORD}
            onNavigate={setCurrentPage}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setCurrentPage(Page.DASHBOARD);
            }}
          />
        );
      case Page.DASHBOARD:
        return currentUser ? (
          <Dashboard 
            user={currentUser} 
            onNavigate={setCurrentPage} 
            hasNewNotif={hasNewNotifications}
            onReadNotif={() => setHasNewNotifications(false)}
            onLogout={handleLogout}
            onAddNotif={addNotification}
          />
        ) : <LandingPage onNavigate={setCurrentPage} />;
      case Page.FOLLOWERS:
        return currentUser ? (
          <Followers 
            user={currentUser} 
            onNavigate={setCurrentPage} 
            hasNewNotif={hasNewNotifications}
            onReadNotif={() => setHasNewNotifications(false)}
          />
        ) : <LandingPage onNavigate={setCurrentPage} />;
      case Page.SETTINGS:
        return currentUser ? (
          <ProfileSettings 
            user={currentUser} 
            onNavigate={setCurrentPage} 
            onUpdateUser={setCurrentUser}
            onLogout={handleLogout}
          />
        ) : <LandingPage onNavigate={setCurrentPage} />;
      case Page.NOTIFICATIONS:
        return currentUser ? (
          <NotificationsView 
            notifications={notifications} 
            onNavigate={setCurrentPage}
            onClear={() => setNotifications([])}
            hasNewNotif={hasNewNotifications}
            onReadNotif={() => setHasNewNotifications(false)}
          />
        ) : <LandingPage onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {renderPage()}
    </div>
  );
};

export default App;
