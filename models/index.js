var mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment'),
    Schema = mongoose.Schema;
autoIncrement.initialize(mongoose.connection);
    

COLORS = ['orange', 'violet', 'green', 'darkcyan', 'red'];
CARDS = [];
COLORS.forEach(function(color, b,c){
    for(var j=0; j<10; j++){
        c = [1,1,1,2,2,3,3,4,4,5];
        card = {color: color, number: c[j]};
        CARDS.push(card);
    }
});
HINTS = 10;
LIVES = 3;

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
    hints: {type: Number, default: HINTS},
    lives: {type: Number, default: LIVES},
    last_turn: Number,
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
        hints: HINTS,
        lives: LIVES
    };

    var cards_amount = players.length<4?5:4;
    players.forEach(function(p,b,c) {
        var player = {name: p.trim(), hand: [], id: b}
        for (var i=cards_amount;i--;) player.hand.push({id: i,
                                            n: game.stock.pop(),
                                            colorKnown: false,
                                            numberKnown: false});
        game.players.push(player);
    });
    game.last_turn = players.length;
    cb(new this(game));
}
// because last_turn was added later
GameSchema.post('init', function(game){
    if(!game.last_turn) game.last_turn=game.players.length;
});
/*
 * GameSchema model methods
 */
GameSchema.methods.points = function(){
    var points = 0;
    var t = this.game_table();
    COLORS.forEach(function(color){points+=t[color].length});
    return points;
}
GameSchema.methods.playerIndex = function(player){
    for(var p=0;p<this.players.length;p++){
        if(this.players[p].name.toLowerCase()==player.toLowerCase())break;
    }
    return p;
}
GameSchema.methods.status = function(){
    if(this.lives==0) return 'GAME OVER';
    if(this.stock.length==0 && this.last_turn==0) return "WIN";
}
GameSchema.methods.whosTurn = function(){
    return this.players[this.playerTurn%this.players.length].name;
}
GameSchema.methods.hisTurn = function(player){
    return this.lives>0&&this.last_turn>0&&this.whosTurn().toLowerCase()==player.toLowerCase();
}   
GameSchema.methods.showHand = function(player) {
    var p = typeof player == 'string' 
            ? this.players[this.playerIndex(player)] 
            : player;
    var r = [];
    p.hand.forEach(function(card){
        r.push({
            color: CARDS[card.n].color,
            number: CARDS[card.n].number
        });
    });
    return r;
}
GameSchema.methods.knownHand = function(player) {
    var p = typeof player == 'string' 
            ? this.players[this.playerIndex(player)] 
            : player;
    var r = [];
    p.hand.forEach(function(card){
        known={};
        if (card.colorKnown) known['color']=CARDS[card.n].color;
        if (card.numberKnown) known['number']=CARDS[card.n].number;
        r.push(known);
    });
    return r;
}
GameSchema.methods.game_table = function(){
    var t={};
    COLORS.forEach(function(color){t[color]=[]});
    this.table.forEach(function(number, b){
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
    var r = [];
    this.discard.forEach(function(card){
        r.push(CARDS[card]);
    });
    return r.reverse();
}
GameSchema.methods.otherPlayers = function(player){
    var r = [];
    this.players.forEach(function(p){
        if(player.toLowerCase()!==p.name.toLowerCase()){
            r.push(p);
        }
    });
    return r;
}
GameSchema.methods.hint = function(player, for_player, hint, hint_value, cb){
    if(undefined==(player&&for_player&&hint&&hint_value)) return cv(new Error("wrong parameters"));
    if(!this.hisTurn(player)) return cb(new Error("not your turn"));
    if(this.hints==0) return cb(new Error("no more hints"));

    
    this.players[this.playerIndex(for_player)].hand.forEach(function(card, i){
        if(hint==='color' && CARDS[card.n].color===hint_value){
            card.colorKnown = true;
        }else if(hint==='number' && CARDS[card.n].number==hint_value){
            card.numberKnown = true;
        }
    });
    this.playerTurn++;
    if(this.stock.length==0) this.last_turn--;
    this.hints--;
    this.save(cb);
}
GameSchema.methods.discard_card = function(name, index, cb){
    if(undefined==(name&&index)) return cb(new Error("wrong parameters"));
    if(!this.hisTurn(name)) return cb(new Error("not your turn"));

    var player = this.players[this.playerIndex(name)],
        card = player.hand[index];
    this.discard.push(card.n);
    card.remove();
    player.hand.push({n: this.stock.pop(),
                      colorKnown: false,
                      numberKnown: false});
    this.playerTurn++;
    if(this.stock.length==0) this.last_turn--;
    if(this.hints<HINTS)this.hints++;
    this.save(function(err){
        cb(err);
    });
}
GameSchema.methods.play_card = function(name, index, cb){
    if(undefined==(name&&index)) return cb(new Error("wrong parameters"));
    if(!this.hisTurn(name)) return cb(new Error("not your turn"));

    var player = this.players[this.playerIndex(name)],
        card = player.hand[index];

    if(CARDS[card.n].number==this.game_table()[CARDS[card.n].color].length+1){
        this.table.push(card.n);
        if(CARDS[card.n].number==5){ 
            this.hints++;
        }
    }
    else {
        this.discard.push(card.n);
        this.lives--;
    }
    card.remove();
    player.hand.push({n: this.stock.pop(),
                      colorKnown: false,
                      numberKnown: false});
    this.playerTurn++;
    if(this.stock.length==0) this.last_turn--;
    this.save(function(err){
        cb(err);
    });
}
GameSchema.methods.gamestate = function(player){
    var discardpile = this.discardPile();
    var sidepanel = '';
    for(var i=0;i<discardpile.length;i++){
        //TODO: this could very well be replaced by a jade template. That would be prettier than in code html formation.
        sidepanel += '<div class="card" style="background-color:_"><div>_</div></div>'._(discardpile[i].color, discardpile[i].number);
    }

    var r = {
            status: this.status(),
            turn: this.whosTurn(),
            selectors: {
                '.selected': {'removeClass': 'selected'},
                '.hints': this.hints,
                '.stocksize': this.stock.length,
                '.lives': this.lives,
                '.points': this.points(),
                '.sidepanel': sidepanel,
                '.discardpile': {'css': {'background-color': discardpile.length?discardpile[0].color:'none'}},
                '.discardpile div': discardpile.length?discardpile[0].number:'',
            },
            table: this.game_table(),
            players: [],
        }
    var game = this;
    this.players.forEach(function(p){
        if(player && p.name.toLowerCase()!=player.toLowerCase())
            r.players.push({
                name: p.name,
                hand: game.showHand(p),
                known: game.knownHand(p),
            })
        else
            r.players.push({
                name: p.name,
                known: game.knownHand(p),
            });
        // add to the selectors the correct show/hide for the hint buttons
        // avoiding nested loop by first adding all as hide, and then seeing which ones need to show
        // TODO: do something similar for knownHand; 
        [1,2,3,4,5].forEach(function(number){
            r.selectors['[js/_player="_"] [js/_hint="number"][js/_val="_"]'._(p.name, number)] = {'hide': 0};
        });
        COLORS.forEach(function(color){
            r.selectors['[js/_player="_"] [js/_hint="color"][js/_val="_"]'._(p.name, color)] = {'hide': 0};
        });
        p.hand.forEach(function(card){
            if(!card.numberKnown) 
                r.selectors['[js/_player="_"] [js/_hint="number"][js/_val="_"]'._(p.name, CARDS[card.n].number)] = {'show': 0};
            if(!card.colorKnown) 
                r.selectors['[js/_player="_"] [js/_hint="color"][js/_val="_"]'._(p.name, CARDS[card.n].color)] = {'show': 0};
        });
    });
    return r;
}

module.exports = mongoose.model('game', GameSchema);

