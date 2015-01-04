var express = require('express');
var router = express.Router();
var models = require('../models');
var url = require('url');

router.get('/', function(req, res) {
    console.log(req.headers.userAgent);
    res.render('index');
});

router.get('/register',
        function(req, res) {
            var name = url.parse(req.url, true).query.name;
            if(name==''||name.length>16){
                throw new Error('Invalid name registered');
            }
            req.db.Game.find({players: {$elemMatch: {name: new RegExp(name, 'i')}}},
                function(error, games){
                    if(error) throw error;
                    res.render('userpage', {name: name, games: games});
                });
        });

router.post('/startgame', function(req, res) {
    var input=req.body.players.split(',');
    var players=[];
    for(p=input.length-1;p>=0;p--){
        if(input[p].trim().length!=0&&players.indexOf(input[p].trim())==-1) {
            players.push(input[p].trim());
        }
    }

    if(players.length==0||players.length>4){
        throw new Error('Incorrect number of players');
    }
    req.db.Game.startGame(players.concat(req.body.name), function(game){
        game.save(function(err){
            if(err)console.error(err)
            else console.log('game', game._id, 'saved successfully');
            //redirect to arena
            res.writeHead(302, {'Location': '/arena?player='+req.body.name+'&game_id='+game.id});
            res.end();
        });
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
