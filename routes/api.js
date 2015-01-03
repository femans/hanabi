var express = require('express');
var url = require('url');
var gamestate = require('../models');

var router = express.Router();

router.post('/hint',
        function(req, res){
            var player=req.body.player,
                game_id=req.body.game,
                hint=req.body.hint,
                for_player=req.body.for_player,
                hint_value=req.body.hint_value;
            req.db.Game.findOne({id:game_id}, function(err, game){
                if(err) throw err;
                game.hint(player, for_player, hint, hint_value, 
                    function(error, knowledge){
                        res.setHeader("Content-Type", "application/json");
                        if(error) {
                            res.status(400);
                            res.end(JSON.stringify({message: error.message}));
                        }
                        res.end(JSON.stringify({knowledge: {player: for_player, changes: knowledge}}));
                    });
            });
        });

router.post('/discard',
        function(req, res){
            var player=req.body.player,
                game_id=req.body.game,
                index=req.body.index;
            req.db.Game.findOne({id:game_id}, function(err, game){
                if(err) throw err;
                game.discard_card(player, index,
                    function(error, knowledge){
                        res.setHeader("Content-Type", "application/json");
                        if(error) {
                            res.status(400);
                            res.end(JSON.stringify({message: error.message}));
                        }
                        res.end(JSON.stringify({knowledge: knowledge}));
                    });
            });
        });

router.post('/play',
        function(req, res){
            var player=req.body.player,
                game_id=req.body.game,
                index=req.body.index;
            req.db.Game.findOne({id:game_id}, function(err, game){
                if(err) throw err;
                game.play_card(player, index,
                    function(error, knowledge){
                        res.setHeader("Content-Type", "application/json");
                        if(error) {
                            res.status(400);
                            res.end(JSON.stringify({message: error.message}));
                        }
                        res.end(JSON.stringify({knowledge: knowledge}));
                    });
            });
        });

module.exports = router;
