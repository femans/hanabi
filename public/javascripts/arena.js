function success(data){
    $('.turn').hide();
    $('[js_turn]').attr('js_turn', false);
    $().removeClass('selected');

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
            $('.discardpile').css({'background-color': data.knowledge.discard[0].color}).html(data.knowledge.discard[0].number);
            $('.stock i').html(data.knowledge.stock);
        });
        $('<td class="card" style="display:none">?</td>').insertAfter($('.yourHand td').eq(-2)[0]).animate({width:'toggle'},300);
    }
    console.log(data);
}
function error(err){
    $('.error').html(error.responseJSON.message);
    console.log(err);
}

$(function(){
    $('td.hintButton').click(
        function(e){
            $.ajax({
                type: 'post',
                url: '/api/hint',
                data: {
                    game: $(this).attr('js_game'),
                    player: $(this).attr('js_player'),
                    hint: $(this).attr('js_hint'),
                    for_player: $(this).attr('js_for'),
                    hint_value: $(this).attr('js_val'),
                },
                success: success,    
                error: error                  
            });       
        }
    );

    $('.yourHand[js_turn="true"] .card').click(
            function(e){
                if($(e.target).closest('.card').hasClass('selected')){
                    $(e.target).closest('.card').removeClass('selected');
                    $(e.target).closest('.yourHand').find('.card_options').hide();
                }
                else {
                    $('.yourHand .card').removeClass('selected');
                    $(e.target).closest('.card').addClass('selected');
                    $(e.target).closest('.yourHand').find('.card_options').show();
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

});
