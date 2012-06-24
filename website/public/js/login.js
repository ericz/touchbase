$(function(){

  $('#submit').click(function(){
    $('#loginform').prop('action', '/login').submit();
  });
 
  $('#forgot').click(function(){
    $('#loginform').prop('action', '/forgot').submit();
  });

});