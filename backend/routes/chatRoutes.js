const express = require('express');
const router = express.Router();
const { processChatQuery, getChatHistory } = require('../controllers/chatController');

router.post('/', processChatQuery);
router.get('/:emp_id', getChatHistory);

module.exports = router;