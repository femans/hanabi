$(function(){
    $('.selectable').click(function(e){
        // this is a hack; there is something weird with jquery, it doesnt update the binding. 
        if($(this).closest('[js_turn]').attr('js_turn')=="false") return;
        if($(e.target).closest('.selectable').hasClass('selected')){
            $(e.target).closest('.selectable').removeClass('selected');
        }
        else {
            $('.selected').removeClass('selected');
            $(e.target).closest('.selectable').addClass('selected');
        }
    });

    SOCKET.on('err', function(data){
        console.log(data)});
    SOCKET.on('close', function(data){
        SOCKET.disconnect();
        console.log("closing socket; reason: ", data);
    });
    SOCKET.on('update', function(gamestate){
        console.log("Update received: ", gamestate);
        if(gamestate.status) $('.status').html(gamestate.status);
        if(gamestate.turn)
            if(gamestate.turn.toLowerCase()==PLAYER.toLowerCase()){
                $('.playerturn').html('your');
                $('[js_turn]').attr('js_turn', 'true').change();
            }
            else {
                $('.playerturn').html(gamestate.turn+'s');
                $('[js_turn]').attr('js_turn', 'false').change();
            }
        if(gamestate.players) {
            gamestate.players.forEach(function(player){
                var color_attr = player.name.toLowerCase()==PLAYER.toLowerCase()?'background-color':'color';
                if(player.known) {
                    player.known.forEach(function(card, i){
                        var j = $('[js_player="'+player.name.toLowerCase()+'"] [js_function="known"]:eq('+i+')');
                        if(card.color){
                            j.css(color_attr, card.color);    
                        } else j.css(color_attr, player.name.toLowerCase()==PLAYER.toLowerCase()?'white':'dimgrey');
                        if(card.number){
                            j.find('div').html(card.number);    
                        } else j.find('div').html('?');
                    });
                }
                if(player.hand) {
                    player.hand.forEach(function(card, i){
                        var j = $('[js_player="'+player.name.toLowerCase()+'"] .hand .card:eq('+i+')');
                        j.css('background-color', card.color);    
                        j.find('div').html(card.number);    
                    });
                }
                if(player.hints) {
                    console.log("hints", player.hints);
                    console.log($('[js_player="'+player.name+'"] .hintButton'));
                    $('[js_player="'+player.name+'"] .hintButton').each(function(i, button){
                        if(player.hints.indexOf($(button).attr('js_val'))>=0)
                            $(button).show()
                        else
                            $(button).hide();

                    });
                }
            });
        }
        if(gamestate.table){
            for(color in gamestate.table) {
                while(gamestate.table[color].length > $('.colorclass.'+color+' .card').length) {
                    $('.colorclass.'+color).append('<div class="card" style="background-color:'+color+'"><div>'+($('.colorclass.'+color+' .card').length+1));
                }
            }
        }
                

        for(selector in gamestate.selectors){
           var arg = gamestate.selectors[selector];
           if(typeof arg=='string'||typeof arg=='number'){
               $(selector).html(arg);
           }
           else {
               for(func in arg){
                   $(selector)[func](arg[func]);
               };
           }
        };
    });
    $('td.hintButton').click(
        function(e){
            SOCKET.emit('hint', {
                    hint: $(this).attr('js_hint'),
                    for_player: $(this).closest('.player').attr('js_player'),
                    hint_value: $(this).attr('js_val'),
                }, 
                function(data){console.log(data)}
            );
        }
    );

    $('button.discard_card').click(
        function(e){
            SOCKET.emit('discard', {
                index: $(this).closest('.hand').find('.selected').index()
                }, 
                function(data){console.log(data)}
            );
        }
    );
                
    $('button.play_card').click(
            function(e){
                SOCKET.emit('play', {
                index: $(this).closest('.hand').find('.selected').index()
                }, 
                function(data){console.log(data)}
            );
        }
    );

    $('.discardpile').click(function(e){
        $('.sidepanel').slideToggle();
    });

});
