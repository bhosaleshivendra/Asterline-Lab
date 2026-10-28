const axios = require('axios');
const User = require('../models/User');
const Chat = require('../models/Chat');

// @desc    Process query through Python FastAPI & log to MongoDB
// @route   POST /api/chat
const processChatQuery = async (req, res) => {
  try {
    const { emp_id, question } = req.body;

    if (!emp_id || !question) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and question are required.',
      });
    }

    // 1. Verify user exists in MongoDB
    const user = await User.findOne({ emp_id: emp_id.trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Workspace user not found in database.',
      });
    }

    // 2. Call Python FastAPI agent microservice (Port 8000)
    let agentAnswer = "";
    try {
      const pythonResponse = await axios.post('http://localhost:8000/chat', {
        emp_id: emp_id.trim(),
        question: question.trim(),
      });
      agentAnswer = pythonResponse.data.answer;
    } catch (apiErr) {
      console.error("FastAPI Service Error:", apiErr.message);
      return res.status(502).json({
        success: false,
        message: `Python Agent Service connection failed. Ensure uvicorn is running on port 8000. Details: ${apiErr.message}`,
      });
    }

    // 3. Save conversation entry into MongoDB
    const chatDoc = await Chat.create({
      emp_id: emp_id.trim(),
      question: question.trim(),
      answer: agentAnswer,
    });

    return res.status(200).json({
      success: true,
      answer: agentAnswer,
      data: chatDoc,
    });
  } catch (error) {
    console.error('Chat Processing Exception:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

// @desc    Get stored chat history for a specific employee
// @route   GET /api/chat/:emp_id
const getChatHistory = async (req, res) => {
  try {
    const { emp_id } = req.params;
    const history = await Chat.find({ emp_id: emp_id.trim() }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// Export BOTH functions
module.exports = {
  processChatQuery,
  getChatHistory,
};