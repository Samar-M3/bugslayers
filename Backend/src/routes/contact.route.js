const express = require('express');
const { sendContactEmail } = require('../controller/contact.controller');

const router = express.Router();

router.route('/').post(sendContactEmail);

module.exports = router;
