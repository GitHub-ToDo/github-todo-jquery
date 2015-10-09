
​
  setTimeout(function(){
    var index = 0;
    $('#todo-list li').each(function(){
      $(this).attr('data-github', numbers[index]);
      if(states[index] == 'closed'){
        $(this).addClass('completed');
      }
      index++;
    })
  }, 20);

    store: function (namespace, data) {
      if (arguments.length > 1) {
        return localStorage.setItem(namespace, JSON.stringify(data));
      } else {
        var store = localStorage.getItem(namespace);
        return (store && JSON.parse(store)) || [];
      }
    }
