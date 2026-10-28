const API_BASE_URL = "http://localhost:5000/api";

export const fetchUsers = async () => {
  const res = await fetch(`${API_BASE_URL}/users`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch users");
  return data.data || [];
};

export const registerUser = async (emp_id, emp_name) => {
  const res = await fetch(`${API_BASE_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emp_id, emp_name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data.data;
};

export const fetchHistory = async (empId) => {
  const res = await fetch(`${API_BASE_URL}/chat/${empId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch history");
  return data.data || [];
};

export const sendChatQuery = async (emp_id, question) => {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emp_id, question }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to process query");
  return data.answer;
};