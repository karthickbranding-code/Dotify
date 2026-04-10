import React, { useState } from 'react';
import { LogOut, User as UserIcon, Lock, Image as ImageIcon, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDoc } from '../contexts/DocContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { UserProfile } from '../types';

export const ProfileView: React.FC = () => {
  const { profile, user, setProfile } = useAuth();
  const { handleLogout, handleUpdateProfile, handleChangePassword, toast, documents, categories } = useDoc();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(profile || {} as UserProfile);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photoURL: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const onUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdateProfile(formData);
    setEditing(false);
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      toast('Passwords do not match');
      return;
    }
    if (newPass.length < 6) {
      toast('Password must be at least 6 characters');
      return;
    }
    await handleChangePassword(newPass);
    setNewPass('');
    setConfirmPass('');
  };

  if (!profile) return null;

  const userDocs = documents.filter(d => d.authorId === profile.id);
  const userCats = categories.filter(c => c.authorId === profile.id);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">User Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account settings and personal details.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { 
              if (editing) {
                setFormData(profile);
              }
              setEditing(!editing); 
            }} 
            className={`font-bold rounded-xl px-4 ${editing ? 'text-gray-500 hover:bg-gray-100' : 'text-blue-600 hover:bg-blue-50'}`}
          >
            {editing ? 'Cancel' : <><Edit size={16} className="mr-2" /> Edit Profile</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:bg-red-50 font-bold rounded-xl px-4">
            <LogOut size={16} className="mr-2" /> Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 flex flex-col items-center text-center shadow-sm">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[40px] bg-blue-50 dark:bg-blue-900/20 border-4 border-white dark:border-gray-800 overflow-hidden flex items-center justify-center text-blue-600 text-4xl font-bold shadow-xl transition-transform group-hover:scale-[1.02]">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  formData.name?.[0] || 'U'
                )}
              </div>
              {editing && (
                <label className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:bg-blue-700 shadow-xl transition-all hover:scale-110">
                  <ImageIcon size={20} />
                  <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                </label>
              )}
            </div>
            
            <div className="mt-8 space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
              <p className="text-sm text-gray-500 font-medium">@{profile.username}</p>
              <div className="pt-3">
                <Badge variant={profile.role === 'admin' ? 'amber' : 'blue'} className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full">{profile.role}</Badge>
              </div>
            </div>
          </div>

          {/* User Dashboard Stats */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 space-y-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Dashboard Stats</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</span>
                <span className="text-lg font-black text-gray-900 dark:text-white">{userCats.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Documents</span>
                <span className="text-lg font-black text-gray-900 dark:text-white">{userDocs.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Storage</span>
                <span className="text-lg font-black text-blue-600">{profile.spaceUsed || 0} MB</span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] p-8 space-y-6 shadow-sm">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Lock size={14} /> Security Settings
            </h3>
            <form onSubmit={onChangePassword} className="space-y-4">
              <Input 
                label="New Password" 
                type="password" 
                value={newPass} 
                onChange={(e: any) => setNewPass(e.target.value)} 
                placeholder="Min 6 characters"
                className="rounded-xl"
              />
              <Input 
                label="Confirm Password" 
                type="password" 
                value={confirmPass} 
                onChange={(e: any) => setConfirmPass(e.target.value)} 
                placeholder="Repeat password"
                className="rounded-xl"
              />
              <Button type="submit" variant="primary" size="md" className="w-full mt-2 font-bold rounded-xl shadow-lg shadow-blue-500/20">Update Password</Button>
            </form>
          </div>
        </div>

        {/* Right Column: Information Form */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[32px] p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Profile Details</h3>
              {editing && <Badge variant="blue" className="font-bold">Editing Mode</Badge>}
            </div>

            {editing ? (
              <form onSubmit={onUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" />
                  <Input label="Designation" value={formData.designation || ''} onChange={(e: any) => setFormData({ ...formData, designation: e.target.value })} className="rounded-xl" />
                  <Input label="Email Address" value={formData.email} disabled className="rounded-xl opacity-60" />
                  <Input label="Username" value={formData.username} onChange={(e: any) => setFormData({ ...formData, username: e.target.value })} className="rounded-xl" />
                  <Input label="Mobile Number" value={formData.mobile || ''} onChange={(e: any) => setFormData({ ...formData, mobile: e.target.value })} className="rounded-xl" />
                  <Input label="Organization Name" value={formData.company || ''} onChange={(e: any) => setFormData({ ...formData, company: e.target.value })} className="rounded-xl" />
                  <Input label="GST Number" value={formData.gstNumber || ''} onChange={(e: any) => setFormData({ ...formData, gstNumber: e.target.value })} className="rounded-xl" />
                  <Input label="Address" value={formData.address || ''} onChange={(e: any) => setFormData({ ...formData, address: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description / Bio</label>
                  <textarea 
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[120px] resize-none"
                    value={formData.otherDetails || ''}
                    onChange={(e) => setFormData({ ...formData, otherDetails: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex justify-end pt-6 border-t border-gray-50 dark:border-gray-800">
                  <Button type="submit" variant="primary" size="lg" className="px-12 font-bold rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-8">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.name}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Designation</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.designation || '—'}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.email}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</div>
                  <div className="text-[15px] font-bold text-blue-600">@{profile.username}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.mobile || '—'}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organization</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.company || '—'}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">GST Number</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.gstNumber || '—'}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Address</div>
                  <div className="text-[15px] font-bold text-gray-900 dark:text-white">{profile.address || '—'}</div>
                </div>
                <div className="md:col-span-2 space-y-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</div>
                  <div className="text-[15px] font-medium text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">{profile.otherDetails || 'No description provided.'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
