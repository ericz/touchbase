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
  
  $('#grab').click(function(){
    $.post('/grab');
    var parent = $(this).parent();
    $(this).remove();
    var loading = $('<img>').prop('src', '/images/loading.gif');
    parent.append(loading);
    setTimeout(function(){
      loading.remove();
      parent.text("Your data is being populated");
    }, 2000);
  });
  
});