var mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment'),
    Schema = mongoose.Schema;
autoIncrement.initialize(mongoose.connection);
    

COLORS = ['orange', 'violet', 'green', 'darkcyan', 'red'];
CARDS = [];
COLORS.forEach(function(color, b,c){
    for(var i=1; i<=5; i++){
        for(var j=0; j<6-i; j++){
            card = {color: color, number: i};
            CARDS.push(card);
        }
    }
});

var shuffle = function(array) {
    var m = array.length, t, i;
    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);
        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

var HandSchema = new Schema({
    id: {type: Number, unique: false},
    n: Number, 
    colorKnown: {type: Boolean, default: false},
    numberKnown: {type: Boolean, default: false},
});
var PlayerSchema = new Schema({
    id: {type: Number, unique: false},
    name: {type: String, trim: true},
    hand: [HandSchema]
});

var GameSchema = new Schema({
    stock: [Number],
    /*
     * players: {
     * name: String,
     * hand: [{n: Number (0-75), colorKnown: Boolean, numberKnown: Boolean}]
     */
    players: [PlayerSchema],
    playerTurn: {type: Number, default:0},
    table: [Number],
    discard: [Number],
    hints: Number,
    burns: Number,
});
GameSchema.plugin(autoIncrement.plugin, {model: 'game', field: 'id'});
// GameSchema static methods
GameSchema.statics.startGame = function(players, cb){
    console.log("starting game with", players);
    var game = {
        stock: function(){for (var a=[];a.length<CARDS.length;a[a.length]=a.length){};return shuffle(a)}(),
        players: [],
        playerTurn: 0,
        table: [],
        discard: [],
        hints: 10,
        burns: 3
    };

    players.forEach(function(p,b,c) {
        player = {name: p.trim(), hand: [], id: b}
        for (var i=5;i--;) player.hand.push({id: i,
                                            n: game.stock.pop(),
                                            colorKnown: false,
                                            numberKnown: false});
        game.players.push(player);
    });
    cb(new this(game));
}

// GameSchema model methods
GameSchema.methods.whosTurn = function(){
    return this.players[this.playerTurn%this.players.length].name;
}
GameSchema.methods.tafel = function(){
    var t={};
    COLORS.forEach(function(color, b,c){t[color]=[]});
    for(i=0;i<10;i++)this.table.push(this.stock.pop());
    this.table.forEach(function(number, b,c){
        t[CARDS[number].color].push(CARDS[number].number);
    });
    return t;
}
GameSchema.methods.yourHand = function(player){
    var hand, r=[];
    this.players.forEach(function(p){if(p.name===player)hand=p.hand});
    hand.forEach(function(c){
        var color = CARDS[c.n].color;
        var number = CARDS[c.n].number;
        r.push({
            color:c.colorKnown?color:'white', 
            number:c.numberKnown?number:'?'
        });
    });
    return r;
}
GameSchema.methods.otherPlayers = function(player){
    cards = function(){
        var r=[];
        this.hand.forEach(function(c){
            r.push({
                color:CARDS[c.n].color,
                number:CARDS[c.n].number,
            });
        });
        return r;
    }
    r = [];
    this.players.forEach(function(p){
        if(player!==p.name){
            p.cards = cards;
            r.push(p);
        }
    });
    return r;
}



module.exports.Game = mongoose.model('game', GameSchema);

