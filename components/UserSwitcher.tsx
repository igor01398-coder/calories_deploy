
import React, { useState } from 'react';
import { User, Plus, Check, Settings, X, ChevronRight, UserCircle2, Trash2, Pencil } from 'lucide-react';
import { UserProfile } from '../types';

interface UserSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  onSwitchUser: (userId: string) => void;
  onAddUser: (name: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUserName: (userId: string, newName: string) => void;
  onOpenBmrSettings: () => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  currentUserId, 
  onSwitchUser, 
  onAddUser,
  onDeleteUser,
  onUpdateUserName,
  onOpenBmrSettings
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  // State for renaming
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim());
      setNewUserName('');
      setIsAdding(false);
    }
  };

  const startEditing = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditNameValue(user.name);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditNameValue('');
  };

  const saveEditing = (userId: string) => {
    if (editNameValue.trim()) {
      onUpdateUserName(userId, editNameValue.trim());
    }
    setEditingUserId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        
        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <UserCircle2 className="w-6 h-6 text-secondary" />
            切換帳號
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3">
            {users.map(user => {
              const isActive = user.id === currentUserId;
              const isEditing = editingUserId === user.id;

              return (
                <div 
                  key={user.id}
                  onClick={() => !isActive && !isEditing && onSwitchUser(user.id)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group flex items-center justify-between ${
                    isActive 
                      ? 'border-secondary bg-blue-50/50' 
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isActive ? 'bg-secondary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text"
                          value={editNameValue}
                          onChange={e => setEditNameValue(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 text-sm focus:outline-none focus:border-secondary"
                          autoFocus
                        />
                        <button onClick={() => saveEditing(user.id)} className="p-1 text-green-500 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEditing} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          目標: {user.dailyGoal} kcal
                        </div>
                      </div>
                    )}
                  </div>

                  {isActive && !isEditing ? (
                    <div className="flex items-center gap-1.5 ml-2">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           startEditing(user);
                         }}
                         className="p-2 bg-white rounded-full text-slate-400 hover:text-blue-500 shadow-sm border border-slate-100 transition-colors"
                         title="編輯名稱"
                       >
                         <Pencil className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onOpenBmrSettings();
                         }}
                         className="p-2 bg-white rounded-full text-slate-400 hover:text-secondary shadow-sm border border-slate-100 transition-colors"
                         title="設定個人資料"
                       >
                         <Settings className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onDeleteUser(user.id);
                         }}
                         className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-colors"
                         title="刪除帳號"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  ) : (
                    !isActive && !isEditing && (
                      <div className="flex items-center gap-2 ml-2">
                          <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteUser(user.id);
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                              title="刪除帳號"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95">
              <label className="block text-xs font-bold text-slate-500 mb-2">新使用者名稱</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-secondary text-slate-900"
                  placeholder="例如：媽媽"
                />
                <button 
                  type="submit"
                  disabled={!newUserName.trim()}
                  className="bg-secondary text-white px-4 rounded-xl font-bold disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              新增帳號
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
