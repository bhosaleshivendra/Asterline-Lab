import React, { useState } from 'react';
import { registerUser } from '../../services/api';

export default function UserManagement({ users, activeEmpId, setActiveEmpId, setStatusMsg, onUserRegistered }) {
  const [userMode, setUserMode] = useState("existing");
  const [regEmpId, setRegEmpId] = useState("");
  const [regEmpName, setRegEmpName] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    try {
      const newUser = await registerUser(regEmpId, regEmpName);
      localStorage.setItem("activeEmpId", newUser.emp_id);
      onUserRegistered(newUser.emp_id);
    } catch (err) {
      setStatusMsg(`⚠️ ${err.message}`);
    }
  };

  const handleSelectUser = (e) => {
    const selectedId = e.target.value;
    setActiveEmpId(selectedId);
    localStorage.setItem("activeEmpId", selectedId);
  };

  const activeUserObj = users.find((u) => u.emp_id === activeEmpId);

  return (
    <div className="mb-4">
      <div className="flex gap-4 mb-4 text-sm font-medium text-gray-700">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            value="existing"
            checked={userMode === "existing"}
            onChange={() => setUserMode("existing")}
            className="text-blue-600 focus:ring-blue-500"
          />
          Existing User
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            value="register"
            checked={userMode === "register"}
            onChange={() => setUserMode("register")}
            className="text-blue-600 focus:ring-blue-500"
          />
          New User
        </label>
      </div>

      {userMode === "existing" ? (
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Select Workspace:</label>
          <select 
            value={activeEmpId} 
            onChange={handleSelectUser} 
            className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Employee --</option>
            {users.map((u) => (
              <option key={u.emp_id} value={u.emp_id}>
                {u.emp_name} ({u.emp_id})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            placeholder="Emp ID (e.g. 1111)"
            value={regEmpId}
            onChange={(e) => setRegEmpId(e.target.value)}
            className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Emp Name"
            value={regEmpName}
            onChange={(e) => setRegEmpName(e.target.value)}
            className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            Register & Switch
          </button>
        </form>
      )}

      {activeUserObj && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900">
          Active: <strong className="font-semibold">{activeUserObj.emp_name}</strong> (<code className="bg-blue-100 px-1 rounded">{activeUserObj.emp_id}</code>)
        </div>
      )}
    </div>
  );
}