/*
 * bunch of muddy code, to start a connection on each call and 
 * pass the relevant database models in the request, so that
 * we don't need to do this for every different route
 */

var mongoose=require('mongoose'),
    autoIncrement = require('mongoose-auto-increment');

mongoose.connect(process.env.MONGOLAB_URI||'mongodb://localhost/hanabi');

var connection = mongoose.connection;

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', function (callback) {
    console.log('database connection established');
});
var models = require('../models');

var db = function(req, res, next){
    req.db = {
        Game: models.Game,
    };
    return next();
}

exports.db = db;

