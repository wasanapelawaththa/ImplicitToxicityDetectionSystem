
import React, { useEffect, useState } from 'react';
import { Page } from '../App';
import { User } from '../types';
import { Header, Footer } from './Layout';
import { ApiService } from '../services/api';

interface FollowersProps {
  user: User;
  onNavigate: (page: Page) => void;
  hasNewNotif: boolean;
  onReadNotif: () => void;
}

const Followers: React.FC<FollowersProps> = ({ user, onNavigate, hasNewNotif, onReadNotif }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'followers' | 'following'>('all');
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const [usersData, followersData, followingData] = await Promise.all([
          ApiService.fetchAllUsers(user.user_id),
          ApiService.fetchFollowers(user.user_id),
          ApiService.fetchFollowing(user.user_id)
        ]);
        if (!isMounted) return;
        setAllUsers(usersData);
        setFollowers(followersData);
        setFollowing(followingData);
        setFollowingIds(followingData.map(item => item.user_id));
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Failed to load followers data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user.user_id]);

  const updateFollowingState = async (targetId: string, shouldFollow: boolean) => {
    setErrorMsg('');
    try {
      if (shouldFollow) {
        await ApiService.followUser(user.user_id, targetId);
        if (!followingIds.includes(targetId)) {
          const target = allUsers.find(u => u.user_id === targetId) || followers.find(u => u.user_id === targetId);
          if (target) {
            setFollowing(prev => [target, ...prev]);
          } else {
            const profile = await ApiService.fetchUserProfile(targetId);
            setFollowing(prev => [profile, ...prev]);
          }
          setFollowingIds(prev => [targetId, ...prev]);
        }
      } else {
        await ApiService.unfollowUser(user.user_id, targetId);
        setFollowing(prev => prev.filter(u => u.user_id !== targetId));
        setFollowingIds(prev => prev.filter(id => id !== targetId));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update follow state.');
    }
  };

  const getFilteredUsers = () => {
    switch (activeTab) {
      case 'followers':
        return followers;
      case 'following':
        return following;
      case 'all':
      default:
        return allUsers;
    }
  };

  if (viewingProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-[#e0fcfc]">
        <Header onNavigate={onNavigate} hasNewNotif={hasNewNotif} activePage={Page.FOLLOWERS} />
        <main className="max-w-xl w-full mx-auto px-4 py-8 flex-grow">
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-cyan-100 text-center">
            <button onClick={() => setViewingProfile(null)} className="flex items-center gap-1 text-cyan-600 font-bold mb-6 hover:underline">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="w-32 h-32 bg-cyan-100 rounded-full mx-auto mb-6 border-4 border-white overflow-hidden shadow-inner flex items-center justify-center">
               <svg className="w-20 h-20 text-white mt-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
               </svg>
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">{viewingProfile.name}</h2>
            <p className="text-gray-500 font-medium mb-6">@{viewingProfile.user_email.split('@')[0]}</p>
            <div className="text-sm text-gray-500 font-medium mb-6 space-y-1">
              <p>{viewingProfile.user_email}</p>
              {viewingProfile.user_mobile && <p>{viewingProfile.user_mobile}</p>}
            </div>
            <button 
              onClick={() => updateFollowingState(viewingProfile.user_id, !followingIds.includes(viewingProfile.user_id))}
              className={`px-10 py-3 rounded-full font-bold shadow-md transition-all ${followingIds.includes(viewingProfile.user_id) ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'btn-custom'}`}
            >
              {followingIds.includes(viewingProfile.user_id) ? 'Following' : 'Follow'}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div className="flex flex-col min-h-screen bg-[#e0fcfc]">
      <Header onNavigate={onNavigate} hasNewNotif={hasNewNotif} onReadNotif={onReadNotif} activePage={Page.FOLLOWERS} />

      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-cyan-100 mb-6 min-h-[500px]">
          <div className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('followers')}
              className={`flex-1 min-w-max px-4 py-2 font-bold transition-colors border-b-2 ${activeTab === 'followers' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-400'}`}
            >
              Followers ({followers.length})
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`flex-1 min-w-max px-4 py-2 font-bold transition-colors border-b-2 ${activeTab === 'following' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-400'}`}
            >
              Following ({followingIds.length})
            </button>
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 min-w-max px-4 py-2 font-bold transition-colors border-b-2 ${activeTab === 'all' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-400'}`}
            >
              All Accounts
            </button>
          </div>

          <div className="space-y-4">
            {isLoading && (
              <div className="text-center py-12 text-gray-400 font-bold">Loading...</div>
            )}
            {!isLoading && errorMsg && (
              <div className="text-center py-6 text-red-500 font-bold">{errorMsg}</div>
            )}
            {!isLoading && !errorMsg && filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold">
                {activeTab === 'followers' ? "No followers yet." : activeTab === 'following' ? "You aren't following anyone yet." : "No accounts found."}
              </div>
            ) : (
              filteredUsers.map(account => (
                <div key={account.user_id} className="flex items-center justify-between p-4 bg-cyan-50/50 rounded-2xl hover:bg-cyan-50 transition-colors border border-transparent hover:border-cyan-100">
                  <div className="flex items-center gap-4 cursor-pointer flex-grow" onClick={() => setViewingProfile(account)}>
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-cyan-200 overflow-hidden shadow-sm">
                      <svg className="w-10 h-10 text-cyan-200 mt-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-lg">{account.name}</h4>
                      <p className="text-xs text-cyan-600 font-bold">
                        {followingIds.includes(account.user_id) ? 'Following' : 'Registered User'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                      onClick={() => setViewingProfile(account)} 
                      className="hidden sm:block text-sm font-bold text-cyan-600 hover:text-cyan-800"
                     >
                       Profile
                     </button>
                     <button 
                      onClick={() => updateFollowingState(account.user_id, !followingIds.includes(account.user_id))}
                      className={`px-6 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${followingIds.includes(account.user_id) ? 'bg-white text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100' : 'btn-custom'}`}
                    >
                      {followingIds.includes(account.user_id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Followers;
