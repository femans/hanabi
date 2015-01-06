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

    socket.on('hint', function(data, fn){
        var hint=data.hint,
            for_player=data.for_player,
            hint_value=data.hint_value;
        console.log('user sends hint:', hint, hint_value, 'for player', for_player);
        Game.findOne({id:game_id}, function(err, game){
            if(err) {
                log("user tries to connect on nonexisting game");
                socket.emit("close", "game does not exist");
                return;
            }
            game.hint(player, for_player, hint, hint_value, function(error, game){
                if(error){
                    log("something went wrong updating gamestate for hint", data.hint, data.hint_value, "for player", data.for_playerx, ' - ', error);
                    socket.emit('err', 'error processing hint request: '+error);
                    return;
                }
                fn("Hint sent!");
                io.sockets.in(game_id).emit('update', {
                    turn: game.whosTurn(),
                    players: [{name: for_player, hand: game.knownHand(for_player)}],
                    selectors: {
                        '.hints': game.hints,
                    }
                });
            });
        });
    });
});

module.exports = io;
