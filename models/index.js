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

/*
 * GameSchema static methods
 */
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

/*
 * GameSchema model methods
 */
GameSchema.methods.playerIndex = function(player){
    for(var p=0;p<this.players.length;p++){
        if(this.players[p].name===player)break;
    }
    return p;
}
GameSchema.methods.whosTurn = function(){
    return this.players[this.playerTurn%this.players.length].name;
}
GameSchema.methods.tafel = function(){
    var t={};
    COLORS.forEach(function(color, b,c){t[color]=[]});
    this.table.forEach(function(number, b,c){
        t[CARDS[number].color].push(CARDS[number].number);
    });
    return t;
}
GameSchema.methods.yourHand = function(player){
    var r=[];
    this.players[this.playerIndex(player)].hand.forEach(function(card){
        var color = CARDS[card.n].color;
        var number = CARDS[card.n].number;
        r.push({
            color:card.colorKnown?color:'white', 
            number:card.numberKnown?number:'?'
        });
    });
    return r;
}
GameSchema.methods.discardPile = function(){
    r = [];
    this.discard.forEach(function(card){
        r.push(CARDS[card]);
    });
    return r.reverse();
}
GameSchema.methods.otherPlayers = function(player){
    cards = function(){
        var r=[];
        this.hand.forEach(function(c){
            r.push({
                color:CARDS[c.n].color,
                number:CARDS[c.n].number,
                colorKnown:c.colorKnown,
                numberKnown:c.numberKnown,
            });
        });
        return r;
    }
    hints = function(){
        var r={colors: [], numbers: []};
        this.cards().forEach(function(card){
            if (!card.colorKnown && r.colors.indexOf(card.color)<0){
                r.colors.push(card.color);
            }
            if (!card.numberKnown && r.numbers.indexOf(card.number)<0){
                r.numbers.push(card.number);
            }
        });
        return r;
    }
    r = [];
    this.players.forEach(function(p){
        if(player!==p.name){
            p.cards = cards;
            p.hints = hints;
            r.push(p);
        }
    });
    return r;
}
    
GameSchema.methods.hint = function(player, for_player, hint, hint_value, cb){
    if(this.whosTurn()!==player) return cb(new Error("not your turn"));
    
    var error=null;
    var save_cb=function(err){
        if(err) error=err;
        console.log("card updated for player "+for_player);
    }

    var updatedKnowledge = [];
    this.players[this.playerIndex(for_player)].hand.forEach(function(card, i){
        if(hint==='color' && CARDS[card.n].color===hint_value){
            card.colorKnown = true;
            updatedKnowledge.push({index:i, color:hint_value});
            card.save(save_cb);
        }else if(hint==='number' && CARDS[card.n].number==hint_value){
            card.numberKnown = true;
            updatedKnowledge.push({index:i, number:hint_value});
            card.save(save_cb);
        }
    });
    this.playerTurn++;
    this.save(cb(error, updatedKnowledge));
}
GameSchema.methods.discard_card = function(name, index, cb){
    if(this.whosTurn()!==name) return cb(new Error("not your turn"));

    var player = this.players[this.playerIndex(name)],
        card = player.hand[index];
    this.discard.push(card.n);
    card.remove();
    player.hand.push({n: this.stock.pop(),
                      colorKnown: false,
                      numberKnown: false});
    this.playerTurn++;
    this.save(function(err){
        if(err) throw err;
        console.log("card discarded for player " + name + " in game " + this.id);
    });
    var knowledge={
        stock: this.stock.length,
        discard: this.discardPile(),
        yourHand: this.yourHand(name),
    };
    cb(null, knowledge);
}


module.exports.Game = mongoose.model('game', GameSchema);

