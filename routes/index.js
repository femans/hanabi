var express = require('express');
var router = express.Router();
var models = require('../models');
var url = require('url');

router.get('/', function(req, res) {
    res.render('index');
});

router.post('/startgame', function(req, res) {
    req.db.Game.startGame(req.body.players.split(',').concat(req.body.name), function(game){
        game.save(function(err){
            if(err)console.error(err)
            else console.log('game', game._id, 'saved successfully');
        });
        
        res.render('arena', {player: req.body.name, game: game});
    });
});

router.get('/register',
        function(req, res) {
            var name = url.parse(req.url, true).query.name;
            req.db.Game.find({players: {$elemMatch: {name: name}}},
                function(error, games){
                    if(error) throw error;
                    res.render('userpage', {name: name, games: games});
                });
        });

router.get('/arena',
        function(req, res){
            var player=url.parse(req.url, true).query.player;
            var game_id = url.parse(req.url, true).query.game_id;
            req.db.Game.find({id:game_id}, 
                function(error, game){
                    if(error) throw error;
                    res.render('arena', {player: player, game: game[0]});
                });
        });


module.exports = router;
