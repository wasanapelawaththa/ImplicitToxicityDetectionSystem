
import React from 'react';
import { Page } from '../App';
import { Notification } from '../types';
import { Header, Footer } from './Layout';

interface NotificationsViewProps {
  notifications: Notification[];
  onNavigate: (page: Page) => void;
  onClear: () => void;
  hasNewNotif: boolean;
  onReadNotif: () => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onNavigate, onClear, hasNewNotif, onReadNotif }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#e0fcfc]">
      <Header onNavigate={onNavigate} hasNewNotif={hasNewNotif} onReadNotif={onReadNotif} activePage={Page.NOTIFICATIONS} />

      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <button onClick={onClear} className="text-cyan-600 hover:text-cyan-800 font-bold text-sm">Clear All</button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-cyan-100">
            <svg className="w-16 h-16 text-cyan-100 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <p className="text-gray-400 font-medium">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(n => (
              <div key={n.id} className="bg-white p-6 rounded-3xl shadow-sm border border-cyan-100 flex gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                   <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <p className="text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(n.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsView;
