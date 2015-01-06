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
    SOCKET.on('message', console.log);
    SOCKET.on('close', function(data){
        SOCKET.disconnect();
        console.log("closing socket; reason: ", data);
    });
    SOCKET.on('update', function(gamestate){
        console.log(gamestate);
        for(var field in gamestate){
            $(field).html(gamestate[field]);
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

    $('.yourHand[js_turn="true"] .card').click(
            function(e){
                if($(e.target).closest('.card').hasClass('selected')){
                    $(e.target).closest('.card').removeClass('selected');
                    $(e.target).closest('.yourHand').find('.card_option').hide();
                }
                else {
                    $('.yourHand .card').removeClass('selected');
                    $(e.target).closest('.card').addClass('selected');
                    $(e.target).closest('.yourHand').find('.card_option').show();
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
