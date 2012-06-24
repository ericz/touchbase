$(function(){

  $('#submit').click(function(){
    $('#settingsform').submit();
  });
 
  $('input:checkbox').uniform();
  
  $('#notifications\\[sms\\]').change(function() {
    if($(this).prop('checked')) {
      $('#phoneinput').show();  
    } else {
      $('#phoneinput').hide();
    }
  });
});