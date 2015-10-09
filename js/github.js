$.get( "https://api.github.com/repos/amykangweb/portfolio/issues?state=open&access_token=", function( data ) {
  e = jQuery.Event( 'keyup', { which: 13 } );
  notices = [];
  $(data).each(function(issue) {
    notices.push(data[issue].title.toString());
  });

  var setTask = function(element){
    setTimeout(function(){
      $('#new-todo').val(element);
      $('#new-todo').trigger(e);
    }, 20);
  }
  notices.forEach(setTask);
});
