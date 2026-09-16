const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const { getComments, addComment } = require('../controllers/commentController');

router.get('/', protect, getComments);
router.post('/', protect, addComment);

module.exports = router;
