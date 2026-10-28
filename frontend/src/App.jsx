import React, { useState, useEffect } from 'react';
import Header from './components/header';
import Sidebar from './components/Sidebar/Sidebar';
import QueryInterface from './components/Chat/QueryInterface';
import SplashLoader from './components/SplashLoader';
import { fetchUsers, fetchHistory, sendChatQuery } from './services/api';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [activeEmpId, setActiveEmpId] = useState(""); // Starts empty
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (activeEmpId) {
      loadHistory(activeEmpId);
    } else {
      setHistory([]);
    }
    setAnswer("");
    setSelectedHistoryItem(null);
  }, [activeEmpId]);

  const initializeApp = async () => {
    try {
      await loadUsers();
    } finally {
      // Hold splash loader for 1.8 seconds for smooth pulse animation display
      setTimeout(() => {
        setIsInitializing(false);
      }, 1800);
    }
  };

  const loadUsers = async () => {
    try {
      const userList = await fetchUsers();
      setUsers(userList);
      // Auto-selection removed: activeEmpId remains "" until user selects or registers
    } catch (err) {
      setStatusMsg(`⚠️ ${err.message}`);
    }
  };

  const loadHistory = async (empId) => {
    try {
      const chatHistory = await fetchHistory(empId);
      setHistory(chatHistory);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserRegistered = async (newEmpId) => {
    await loadUsers();
    setActiveEmpId(newEmpId);
  };

  const handleSelectHistoryItem = (item) => {
    setSelectedHistoryItem(item);
    setQuestion(item.question);
    setAnswer(item.answer);
  };

  const handleNewQuery = () => {
    setQuestion("");
    setAnswer("");
    setSelectedHistoryItem(null);
  };

  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    if (!activeEmpId) {
      setStatusMsg("⚠️ Please select or register an employee first.");
      return;
    }
    if (!question.trim()) return;

    setLoading(true);
    setStatusMsg("");
    setSelectedHistoryItem(null);

    try {
      const botAnswer = await sendChatQuery(activeEmpId, question);
      setAnswer(botAnswer);
      loadHistory(activeEmpId);
    } catch (err) {
      setAnswer(`⚠️ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return <SplashLoader statusText="Connecting to Asterline Workspace Engine..." />;
  }

  const activeUserObj = users.find((u) => u.emp_id === activeEmpId);

  return (
    <div className="h-screen max-w-7xl mx-auto p-4 flex flex-col overflow-hidden font-sans antialiased text-slate-900 bg-white">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeUser={activeUserObj}
      />

      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        {sidebarOpen && (
          <Sidebar 
            users={users}
            activeEmpId={activeEmpId}
            setActiveEmpId={setActiveEmpId}
            statusMsg={statusMsg}
            setStatusMsg={setStatusMsg}
            onUserRegistered={handleUserRegistered}
            history={history}
            selectedHistoryItem={selectedHistoryItem}
            onSelectHistoryItem={handleSelectHistoryItem}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <QueryInterface 
          question={question}
          setQuestion={setQuestion}
          answer={answer}
          loading={loading}
          selectedHistoryItem={selectedHistoryItem}
          onSubmit={handleSubmitQuery}
          onNewQuery={handleNewQuery}
        />
      </div>
    </div>
  );
}