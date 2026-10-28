const User = require('../models/User');

// @desc    Register a new user workspace
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { emp_id, emp_name } = req.body;

    // Validate required fields
    if (!emp_id || !emp_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both Employee ID and Name are required.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ emp_id: emp_id.trim() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: `Employee ID ${emp_id} is already registered.` 
      });
    }

    // Create and save new user
    const user = await User.create({
      emp_id: emp_id.trim(),
      emp_name: emp_name.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        emp_id: user.emp_id,
        emp_name: user.emp_name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get all registered users for workspace selection dropdown
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('emp_id emp_name -_id').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

module.exports = {
  registerUser,
  getUsers,
};