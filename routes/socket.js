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
        var discardpile = game.discardPile();
        var sidepanel = '';
        for(var i=0;i<discardpile.length;i++){
            sidepanel += '<div class="card" style="background-color:'+discardpile[i].color+'"><div>'+discardpile[i].number+'</div></div>';
        }
        socket.emit('update', {
            status: game.status(),
            turn: game.whosTurn(),
            selectors: {
                '.hints': game.hints,
                '.stocksize': game.stock.length,
                '.lives': game.lives,
                '.points': game.points(),
                '.sidepanel': sidepanel,
                '.discardpile': {'css': {'background-color': discardpile.length?discardpile[0].color:'none'}},
                '.discardpile div': discardpile.length?discardpile[0].number:'',
            },
            table: game.game_table(),
            //TODO: make completely async; no pre-rendering
        });
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
                io.sockets.in(game_id).emit('update', {
                    status: game.status(),
                    turn: game.whosTurn(),
                    players: [{name: for_player, known: game.knownHand(for_player)}],
                    selectors: {
                        '.hints': game.hints,
                    }
                });
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
                    log("something went wrong updating gamestate for discard_card", player, index, ' - ', error);
                    socket.emit('err', 'error processing discard_card: '+error);
                    return;
                }
                fn("Woot! discard sent!");
                var discardpile = game.discardPile();
                var discardpilenumber = discardpile.length?discardpile[0].number:'';
                var discardpilecolor = discardpile.length?discardpile[0].color:'none';
                var selectors = {
                        '.stocksize': game.stock.length,
                        '.sidepanel': {'prepend': '<div class="card"><div>'+discardpilenumber},
                        '.sidepanel div:eq(0)': {'css': {'background-color': discardpilecolor}},
                        '.discardpile div': discardpilenumber,
                        '.discardpile': {'css': {'background-color': discardpilecolor}},
                        '.selected': {'removeClass': 'selected'},
                        '.hints': game.hints,
                        '.lives': game.lives,
                    };
                socket.emit('update', {
                    status: game.status(),
                    turn: game.whosTurn(),
                    players: [{name: player, known: game.knownHand(player)}],
                    selectors: selectors
                });
                socket.broadcast.to(game_id).emit('update', {
                    turn: game.whosTurn(),
                    // the following could also be included as a bunch of selectors in stead:
                    players: [{name: player, hand: game.showHand(player), known: game.knownHand(player)}],
                    selectors: selectors
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
                    log("something went wrong updating gamestate for play_card", player, index, ' - ', error);
                    socket.emit('err', 'error processing play_card request: '+error);
                    return;
                }
                fn("Woot! play sent!");
                var discardpile = game.discardPile();
                var discardpilenumber = discardpile.length?discardpile[0].number:'';
                var discardpilecolor = discardpile.length?discardpile[0].color:'none';
                var selectors = {
                        '.stocksize': game.stock.length,
                        '.sidepanel': {'prepend': '<div class="card"><div>'+discardpilenumber},
                        '.sidepanel div:eq(0)': {'css': {'background-color': discardpilecolor}},
                        '.discardpile div': discardpilenumber,
                        '.discardpile': {'css': {'background-color': discardpilecolor}},
                        '.selected': {'removeClass': 'selected'},
                        '.hints': game.hints,
                        '.lives': game.lives,
                        '.points': game.points(),
                    };
                socket.emit('update', {
                    status: game.status(),
                    turn: game.whosTurn(),
                    players: [{name: player, known: game.knownHand(player)}],
                    table: game.game_table(),
                    selectors: selectors
                });
                socket.broadcast.to(game_id).emit('update', {
                    turn: game.whosTurn(),
                    // the following could also be included as a bunch of selectors in stead:
                    players: [{name: player, hand: game.showHand(player), known: game.knownHand(player)}],
                    table: game.game_table(),
                    selectors: selectors
                });
            });
        });
    });
});

module.exports = io;
