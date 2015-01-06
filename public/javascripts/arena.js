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
        if(gamestate.turn&&gamestate.turn==PLAYER){
            $('.playerturn').html('your');
            $('[js_turn]').attr('js_turn', 'true').change();
        }
        else {
            $('.playerturn').html(gamestate.turn+'s');
            $('[js_turn]').attr('js_turn', 'false').change();
        }
        gamestate.players.forEach(function(player){
            var color_attr = player.name==PLAYER?'background-color':'color';
            if(player.known) {
                player.known.forEach(function(card, i){
                    var j = $('[js_player="'+player.name+'"] [js_function="known"]:eq('+i+')');
                    if(card.color){
                        j.css(color_attr, card.color);    
                    } else j.css(color_attr, player.name==PLAYER?'white':'black');
                    if(card.number){
                        j.find('div').html(card.number);    
                    } else j.find('div').html('?');
                });
            }
            if(player.hand) {
                player.hand.forEach(function(card, i){
                    var j = $('[js_player="'+player.name+'"] .hand .card:eq('+i+')');
                    j.css('background-color', card.color);    
                    j.find('div').html(card.number);    
                });
            }
        });

       for(selector in gamestate.selectors){
           var arg = gamestate.selectors[selector];
           console.log("selector:", selector, arg);
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
                    for_player: $(this).attr('js_for'),
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
                socket.emit('play', {
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
