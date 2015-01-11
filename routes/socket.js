var io = require('socket.io')()
var url = require('url');
var Game = require('../models');

function log(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[SOCKET.IO] ');
    console.log.apply(console, args);
}

io.on('connection', function(socket){
    log('a user connected on ', socket.handshake.headers.referer);
    var query = url.parse(socket.handshake.headers.referer, true).query;
    var player = query.player;
    var game_id = query.game_id;
    socket.join(game_id);

    Game.findOne({id:game_id}, function(err, game){
        if(err) {
            log("user tries to connect on nonexisting game");
            socket.emit("close", "game does not exist");
            return;
        }
        //send the gamestate to the user
        socket.emit('update', game.gamestate(player));
    });

    socket.on('hint', function(data, fn){
        var hint=data.hint,
            for_player=data.for_player,
            hint_value=data.hint_value;
        log(player, 'sends hint:', hint, hint_value, 'for player', for_player);
        Game.findOne({id:game_id}, function(err, game){
            if(err) {
                log("user tries to connect on nonexisting game");
                socket.emit("close", "game does not exist");
                return;
            }
            game.hint(player, for_player, hint, hint_value, function(error, game){
                if(error){
                    log("something went wrong updating gamestate for hint", data.hint, data.hint_value, "for player", data.for_player, ' - ', error);
                    socket.emit('err', 'error processing hint request: '+error);
                    return;
                }
                fn("Hint sent!");
                io.sockets.in(game_id).emit('update', game.gamestate());
            });
        });
    });

    socket.on('discard', function(data, fn){
        var index=data.index;
        log(player, 'sends discard:', index);
        Game.findOne({id:game_id}, function(err, game){
            if(err) {
                log("user tries to connect on nonexisting game");
                socket.emit("close", "game does not exist");
                return;
            }
            game.discard_card(player, index, function(error, gamestate){
                if(error){
                    log("something went wrong updating gamestate for discard_card:_2_ for player _1_: _3_"._(player, index, error));
                    socket.emit('err', 'error processing discard_card: '+error);
                    return;
                }
                fn("Woot! discard sent!");
                io.sockets.in(game_id).emit('update', game.gamestate());
                socket.broadcast.to(game_id).emit('update', {
                    players: [{name: player, hand: game.showHand(player)}],
                });
            });
        });
    });
    socket.on('play', function(data, fn){
        var index=data.index;
        log(player, 'sends play:', index);
        Game.findOne({id:game_id}, function(err, game){
            if(err) {
                log("user tries to connect on nonexisting game");
                socket.emit("close", "game does not exist");
                return;
            }
            game.play_card(player, index, function(error, gamestate){
                if(error){
                    log("something went wrong updating gamestate for play:_2_ for player _1_: _3_"._(player, index, error));
                    socket.emit('err', 'error processing play_card request: '+error);
                    return;
                }
                fn("Woot! play sent!");
                io.sockets.in(game_id).emit('update', game.gamestate());
                socket.broadcast.to(game_id).emit('update', {
                    players: [{name: player, hand: game.showHand(player)}],
                });
            });
        });
    });
});

module.exports = io;
