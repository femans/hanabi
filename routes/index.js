var express = require('express');
var router = express.Router();
var models = require('../models');

router.get('/', function(req, res) {
    res.render('index');
});

router.get('/arena', function(req, res) {
    res.render('arena', {table: gamestate.get_table(true)});
});

module.exports = router;
