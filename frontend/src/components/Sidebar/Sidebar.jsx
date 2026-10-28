import React from 'react';
import UserManagement from './UserManagement';
import ChatHistory from './ChatHistory';

export default function Sidebar({ 
  users, 
  activeEmpId, 
  setActiveEmpId, 
  statusMsg, 
  setStatusMsg, 
  onUserRegistered, 
  history, 
  selectedHistoryItem, 
  onSelectHistoryItem, 
  onClose 
}) {
  return (
    <aside className="w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">👤 Workspace & History</h2>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 font-bold text-lg px-1"
        >
          ✕
        </button>
      </div>

      <UserManagement 
        users={users} 
        activeEmpId={activeEmpId} 
        setActiveEmpId={setActiveEmpId} 
        setStatusMsg={setStatusMsg}
        onUserRegistered={onUserRegistered}
      />

      {statusMsg && <div className="text-sm text-red-600 font-medium mb-3">{statusMsg}</div>}

      <hr className="my-4 border-gray-200" />

      <ChatHistory 
        history={history} 
        selectedHistoryItem={selectedHistoryItem} 
        onSelectHistoryItem={onSelectHistoryItem} 
      />
    </aside>
  );
}