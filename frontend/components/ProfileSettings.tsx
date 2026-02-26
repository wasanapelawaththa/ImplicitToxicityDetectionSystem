
import React, { useEffect, useState } from 'react';
import { Page } from '../App';
import { User, UserProfile } from '../types';
import { Header, Footer } from './Layout';
import { ConfirmModal } from './Modals';
import { ApiService } from '../services/api';

interface ProfileSettingsProps {
  user: User;
  onNavigate: (page: Page) => void;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onNavigate, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    user_id: user.user_id,
    name: user.name,
    gender: '',
    location: ''
  });
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  
  const [isLogoutModal, setIsLogoutModal] = useState(false);
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setErrorMsg('');
      try {
        const profile = await ApiService.fetchUserProfileDetails(user.user_id);
        if (!isMounted) return;
        setProfileData(profile);
        setFormData(profile);
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Failed to load profile details.');
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [user.user_id]);

  const validateProfile = (profile: UserProfile) => {
    const nameOk = profile.name.trim().length >= 2 && profile.name.trim().length <= 100;
    const genderOk = ['Male', 'Female', 'Other'].includes(profile.gender);
    const locationOk = profile.location.trim().length >= 2 && profile.location.trim().length <= 100;
    return nameOk && genderOk && locationOk && agreeTerms;
  };

  const handleSaveProfile = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateProfile(formData)) {
      setErrorMsg('Fill the fields with valid data');
      return;
    }

    try {
      const updatedProfile = await ApiService.updateUserProfileDetails(user.user_id, {
        user_id: user.user_id,
        name: formData.name.trim(),
        gender: formData.gender,
        location: formData.location.trim()
      }, agreeTerms);
      setProfileData(updatedProfile);
      onUpdateUser({ ...user, name: updatedProfile.name });
      setIsEditing(false);
      setIsViewingProfile(true);
      setAgreeTerms(false);
      setSuccessMsg('Profile updated successfully');
    } catch (err: any) {
      setErrorMsg(err.message || 'Fill the fields with valid data');
    }
  };

  const validatePassword = (pw: string) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(pw);
  };

  const handleChangePassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!passData.old || !passData.new || !passData.confirm) {
      setErrorMsg('Please fill all fields.');
      return;
    }
    if (passData.new !== passData.confirm) {
      setErrorMsg('new password and confirm passwords are not matching');
      return;
    }
    if (!validatePassword(passData.new)) {
      setErrorMsg('Re try');
      return;
    }
    try {
      await ApiService.changePassword(user.user_id, passData.old, passData.new);
      setIsChangePassword(false);
      setPassData({ old: '', new: '', confirm: '' });
      setSuccessMsg('New password updated');
    } catch (err: any) {
      setErrorMsg(err.message || 'Re try');
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await ApiService.deleteAccount(user.user_id);
      setIsDeleteModal(false);
      onLogout();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete account.');
      setIsDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#e0fcfc]">
      <Header onNavigate={onNavigate} activePage={Page.SETTINGS} />

      <main className="max-w-xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-cyan-100">
          <div className="bg-cyan-50 p-8 flex flex-col items-center text-center">
            <button onClick={() => onNavigate(Page.DASHBOARD)} className="self-start text-cyan-600 font-bold flex items-center gap-1 mb-4 hover:underline">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <div className="w-32 h-32 bg-white rounded-full p-1 shadow-lg mb-4 border-4 border-white">
              <img src="components/images/profile.png" alt="Avatar" className="w-full h-full rounded-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]">{user.name}</h2>
            <p className="text-gray-500 font-bold">{user.user_email}</p>
          </div>

          <div className="p-8 space-y-6">
            {!isEditing && !isChangePassword && !isViewingProfile ? (
              <div className="space-y-2">
                 {successMsg && <p className="text-green-600 text-center font-bold">{successMsg}</p>}
                 {errorMsg && <p className="text-red-500 text-center font-bold">{errorMsg}</p>}
                 {isLoadingProfile && <p className="text-gray-400 text-center font-bold">Loading profile...</p>}
                 <button onClick={() => { setIsViewingProfile(true); setSuccessMsg(''); setErrorMsg(''); }} className="w-full flex items-center justify-between p-4 hover:bg-cyan-50 rounded-2xl transition-colors font-bold text-gray-700">
                   <div className="flex items-center gap-4">
                     <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                     <span>View Profile</span>
                   </div>
                   <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={() => { setIsChangePassword(true); setSuccessMsg(''); setErrorMsg(''); }} className="w-full flex items-center justify-between p-4 hover:bg-cyan-50 rounded-2xl transition-colors font-bold text-gray-700">
                   <div className="flex items-center gap-4">
                     <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                     <span>Change Password</span>
                   </div>
                   <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={() => { setIsEditing(true); setSuccessMsg(''); setErrorMsg(''); }} className="w-full flex items-center justify-between p-4 hover:bg-cyan-50 rounded-2xl transition-colors font-bold text-gray-700">
                   <div className="flex items-center gap-4">
                     <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                     <span>Edit Profile</span>
                   </div>
                   <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={() => setIsLogoutModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors font-bold text-gray-700">
                   <div className="flex items-center gap-4">
                     <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     <span>Log Out</span>
                   </div>
                   <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button onClick={() => setIsDeleteModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors font-bold text-red-500">
                   <div className="flex items-center gap-4">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                     <span>Delete Account</span>
                   </div>
                   <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                 </button>
              </div>
            ) : isViewingProfile ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-center text-[#1a1a1a] mb-6">Profile Details</h3>
                {errorMsg && <p className="text-red-500 text-center font-bold">{errorMsg}</p>}
                {successMsg && <p className="text-green-600 text-center font-bold">{successMsg}</p>}
                <div className="bg-cyan-50 rounded-2xl p-5 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400">Name</p>
                    <p className="text-lg font-bold text-[#1a1a1a]">{profileData?.name || user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400">Gender</p>
                    <p className="text-base font-bold text-[#1a1a1a]">{profileData?.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400">Location</p>
                    <p className="text-base font-bold text-[#1a1a1a]">{profileData?.location || '-'}</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsViewingProfile(false)} className="flex-1 py-3 font-bold text-gray-500">Back</button>
                  <button onClick={() => { setIsEditing(true); setIsViewingProfile(false); setSuccessMsg(''); setErrorMsg(''); }} className="flex-1 py-3 btn-custom rounded-full font-bold shadow-md">Edit Profile</button>
                </div>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                 <h3 className="text-xl font-bold text-center text-[#1a1a1a] mb-6">Profile Creation</h3>
                 <div>
                    <label className="text-sm font-bold text-gray-400 ml-4">Name</label>
                    <input className="w-full p-4 bg-cyan-50 rounded-full border-none focus:ring-2 focus:ring-cyan-500 text-black font-bold outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-400 ml-4">Gender</label>
                    <select className="w-full p-4 bg-cyan-50 rounded-full border-none focus:ring-2 focus:ring-cyan-500 text-black font-bold outline-none" value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-400 ml-4">Location</label>
                    <input className="w-full p-4 bg-cyan-50 rounded-full border-none focus:ring-2 focus:ring-cyan-500 text-black font-bold outline-none" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                 </div>
                 <label className="flex items-center gap-3 px-2 cursor-pointer">
                   <input type="checkbox" className="w-5 h-5 accent-cyan-500" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                   <span className="font-bold text-gray-600 text-sm">I confirm my details and accept the Terms & Conditions</span>
                 </label>
                 {errorMsg && <p className="text-red-500 text-center font-bold">{errorMsg}</p>}
                {successMsg && <p className="text-green-600 text-center font-bold">{successMsg}</p>}
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => { setIsEditing(false); setAgreeTerms(false); }} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
                    <button onClick={handleSaveProfile} className="flex-1 py-3 btn-custom rounded-full font-bold shadow-md">Save</button>
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <h3 className="text-xl font-bold text-center text-[#1a1a1a] mb-6">Change Password</h3>
                 <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </span>
                    <input type="password" placeholder="Old Password" className="w-full p-4 bg-cyan-50 rounded-full border-none focus:ring-2 focus:ring-cyan-500 text-black font-bold outline-none pl-12" value={passData.old} onChange={e => setPassData({ ...passData, old: e.target.value })} />
                 </div>
                 <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </span>
                    <input type="password" placeholder="New Password" className="w-full p-4 bg-cyan-50 rounded-full border-none focus:ring-2 focus:ring-cyan-500 text-black font-bold outline-none pl-12" value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })} />
                 </div>
                 <div className="relative flex items-center">
                    <span className="absolute left-4 text-gray-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </span>
                    <input type="password" placeholder="Confirm Password" className="w-full p-4 bg-cyan-50 rounded-full border-none focus:ring-2 focus:ring-cyan-500 text-black font-bold outline-none pl-12" value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })} />
                 </div>
                 {errorMsg && <p className="text-red-500 text-center font-bold">{errorMsg}</p>}
                {successMsg && <p className="text-green-600 text-center font-bold">{successMsg}</p>}
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsChangePassword(false)} className="flex-1 py-3 font-bold text-gray-500">Cancel</button>
                    <button onClick={handleChangePassword} className="flex-1 py-3 btn-custom rounded-full font-bold shadow-md">Save</button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <ConfirmModal 
        isOpen={isLogoutModal} 
        title="Confirm Logout" 
        message="Are you sure you want to log out from your account?" 
        onConfirm={onLogout} 
        onCancel={() => setIsLogoutModal(false)} 
      />
      
      <ConfirmModal 
        isOpen={isDeleteModal} 
        title="Confirm Deletion" 
        message="Are you sure you want to delete your account? This action is permanent and all your posts, comments and followers will be deleted forever." 
        onConfirm={handleDeleteAccount} 
        onCancel={() => setIsDeleteModal(false)} 
      />
    </div>
  );
};

export default ProfileSettings;
