const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    emp_id: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    emp_name: {
      type: String,
      required: [true, 'Employee Name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);