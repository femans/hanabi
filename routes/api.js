var express = require('express');
var url = require('url');
var gamestate = require('../models');

var router = express.Router();

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

router.post('/arena',
        function(req, res){
            var player=req.body.player;
            var game_id = req.body.game_id;
            req.db.Game.find({id:game_id}, 
                function(error, game){
                    if(error) throw error;
                    res.render('arena', {player: player, game: game[0]});
                });
        });

module.exports = router;
