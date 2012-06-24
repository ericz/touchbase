$(function(){

  $('#topics > li > h1').toggle(function(){
    $(this).parent().css('height', 'auto');
  }, function(){
    $(this).parent().css('height', 35);
  }).each(function(i, el){
    $(el).append('&nbsp;&nbsp;').append($('<span></span>').addClass('grey').text($(el).parent().find('.topic').length + ' classes'));
  });
  
  
  
});