function success(data){
    $('.turn').hide();
    $('[js_turn]').attr('js_turn', false);
    $('.card').removeClass('selected');

    if(data.knowledge.changes){
        data.knowledge.changes.forEach(function(c){
            var target = $('[js_player="'+data.knowledge.player+'"] [js_function="known"]').eq(c.index);
            target.slideToggle(function(){
                if(c.color){
                    target.css({color: c.color});
                }
                else if(c.number){
                    target.find('div').html(c.number);
                }
                target.slideToggle();
            });
        });
    }            
    if(data.knowledge.discard){
        $('.yourHand .card').eq(data.knowledge.discarded).animate({width: 'toggle'}, 300, function(){
            $('.discardpile').css({'background-color': data.knowledge.discard[0].color}).find('div').html(data.knowledge.discard[0].number);
            $('.stock i').html(data.knowledge.stock);
        });
        $('<td class="card" style="display:none;background-color:white;">?</td>').insertAfter($('.yourHand td').eq(-2)[0]).animate({width:'toggle'},300);
    }
    //TODO: update the arena after play_card function
    //TODO: make pretty animations
    //
    console.log(data);
    // hackish; 
    // TODO: make nice completely async frontend
    $('[js_refresh]').attr('http-equiv', 'refresh');
    
}
function error(err){
    $('.error').html(error.responseJSON.message);
    console.log(err);
}

$(function(){
    SOCKET.on('err', function(data){
        console.log(data)});
    SOCKET.on('close', function(data){
        SOCKET.disconnect();
        console.log("closing socket; reason: ", data);
    });
    SOCKET.on('update', function(gamestate){
        console.log(gamestate);
        if(gamestate.turn&&gamestate.turn==PLAYER){
            $('.playerturn').html('your');
            $('[js_turn]').attr('js_turn', 'true');
        }
        else {
            $('.playerturn').html(gamestate.turn+'s');
            $('[js_turn]').attr('js_turn', 'false');
        }
        gamestate.players.forEach(function(player){
            console.log('player: ',player);
            var color_attr = player.name==PLAYER?'background-color':'color';
            player.hand.forEach(function(card, i){
                var j = $('[js_player="'+player.name+'"] [js_function="known"]:eq('+i+')');
                console.log(j);
                    
                if(card.color){
                    j.css(color_attr, card.color);    
                }
                if(card.number){
                    j.find('div').html(card.number);    
                }
            });
        });

        for(var field in gamestate.selectors){
            $(field).html(gamestate.selectors[field]);
        }
    });
    $('td.hintButton').click(
        function(e){
            SOCKET.emit('hint', {
                    hint: $(this).attr('js_hint'),
                    for_player: $(this).attr('js_for'),
                    hint_value: $(this).attr('js_val'),
            }, function(data){
                console.log(data);
            });
        }
    );

    $('[js_turn="true"] .selectable').click(
            function(e){
                if($(e.target).closest('.selectable').hasClass('selected')){
                    $(e.target).closest('.selectable').removeClass('selected');
                }
                else {
                    $().removeClass('selected');
                    $(e.target).closest('.selectable').addClass('selected');
                }
            });

    $('button.discard_card').click(
            function(e){
                $.ajax({
                    type: 'post',
                    url: '/api/discard', 
                    data: {
                        game:$(this).closest('.yourHand').attr('js_game'),
                        player:$(this).closest('.yourHand').attr('js_player'),
                        index:$(this).closest('.yourHand').find('.selected').index(),
                    },
                    success: success,
                    error: error
                });
            });

    $('button.play_card').click(
            function(e){
                $.ajax({
                    type: 'post',
                    url: '/api/play', 
                    data: {
                        game:$(this).closest('.yourHand').attr('js_game'),
                        player:$(this).closest('.yourHand').attr('js_player'),
                        index:$(this).closest('.yourHand').find('.selected').index(),
                    },
                    success: success,
                    error: error
                });
            });
    $('.discardpile').click(function(e){
        $('.sidepanel').slideToggle();
    });

});
