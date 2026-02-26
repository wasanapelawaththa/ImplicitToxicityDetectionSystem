
import React from 'react';
import { Page } from '../App';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  hasNewNotif?: boolean;
  onReadNotif?: () => void;
  activePage?: Page;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, hasNewNotif, onReadNotif, activePage }) => {
  return (
    <header className="bg-[#57eaea] p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center cursor-pointer" onClick={() => onNavigate(Page.DASHBOARD)}>
        <img src="components/images/logo.png" alt="Hug Hub Logo" className="h-12 w-auto" />
      </div>
      <nav className="flex items-center gap-4 sm:gap-6">
        <button 
          onClick={() => onNavigate(Page.DASHBOARD)}
          className={`flex items-center gap-1 font-bold nav-icon ${activePage === Page.DASHBOARD ? 'nav-icon-active' : ''}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="hidden md:inline">Home</span>
        </button>
        <button 
          onClick={() => {
            onNavigate(Page.NOTIFICATIONS);
            if (onReadNotif) onReadNotif();
          }}
          className={`relative flex items-center gap-1 font-bold nav-icon ${activePage === Page.NOTIFICATIONS ? 'nav-icon-active' : ''}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="hidden md:inline">Notification</span>
          {hasNewNotif && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
          )}
        </button>
        <button 
          onClick={() => onNavigate(Page.FOLLOWERS)}
          className={`flex items-center gap-1 font-bold nav-icon ${activePage === Page.FOLLOWERS ? 'nav-icon-active' : ''}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          <span className="hidden md:inline">Follower</span>
        </button>
        <button 
          onClick={() => onNavigate(Page.SETTINGS)}
          className={`flex items-center justify-center w-10 h-10 bg-white rounded-full transition-all shadow-sm border border-gray-100 flex-shrink-0 ${activePage === Page.SETTINGS ? 'nav-icon-active' : 'text-black hover:text-gray-500'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </nav>
    </header>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#57eaea] p-4 text-center border-t mt-auto">
      <p className="italic text-gray-900 font-bold opacity-100">Stay connected, share smiles</p>
    </footer>
  );
};
