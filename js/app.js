/*global jQuery, Handlebars, Router */
jQuery(function ($) {
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
  var numbers = [];
  var states = [];
	var notices = [];
	var name;
	var repo;
	var token;

	$("#startApp").on('click', function() {
		while(!name || !repo || !token){
			alert("You must enter all the information to proceed.");
			name = prompt("What is your github username?");
			repo = prompt("Which repository issues do you want to fetch?");
			token = prompt("Please enter your authorization token.");
		}
		github.fetchGithub();
	});

	var github = {
		fetchGithub: function() {
			$.get("https://api.github.com/repos/" + name + "/" + repo + "/issues?state=all&access_token=" + token, function( data ) {

			  var v = jQuery.Event( 'keyup', { which: 13 } );

				$(data).each(function(issue) {
					notices.push(data[issue].title.toString());
					if(data[issue].state === "open") {
						states.push(false);
					}else{
						states.push(true);
					}
					numbers.push(data[issue].number);
				});

				var setTask = function(element){
					setTimeout(function(){
					$('#new-todo').val(element);
					$('#new-todo').trigger(v);
					}, 20);
				}
				notices.forEach(setTask);

			});
		}
	};

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';
			/* enter id number here */
			uuid = numbers.shift();

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		}
	};

	var App = {
		init: function () {
			this.todos = [];
			this.cacheElements();
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},
		cacheElements: function () {
			this.todoTemplate = Handlebars.compile($('#todo-template').html());
			this.footerTemplate = Handlebars.compile($('#footer-template').html());
			this.$todoApp = $('#todoapp');
			this.$header = this.$todoApp.find('#header');
			this.$main = this.$todoApp.find('#main');
			this.$footer = this.$todoApp.find('#footer');
			this.$newTodo = this.$header.find('#new-todo');
			this.$toggleAll = this.$main.find('#toggle-all');
			this.$todoList = this.$main.find('#todo-list');
			this.$count = this.$footer.find('#todo-count');
			this.$clearBtn = this.$footer.find('#clear-completed');
		},
		bindEvents: function () {
			var list = this.$todoList;
			this.$newTodo.on('keyup', this.create.bind(this));
			this.$toggleAll.on('change', this.toggleAll.bind(this));
			this.$footer.on('click', '#clear-completed', this.destroyCompleted.bind(this));
			list.on('change', '.toggle', this.toggle.bind(this));
			list.on('dblclick', 'label', this.edit.bind(this));
			list.on('keyup', '.edit', this.editKeyup.bind(this));
			list.on('focusout', '.edit', this.update.bind(this));
			list.on('click', '.destroy', this.destroy.bind(this));
		},
		render: function () {
			var todos = this.getFilteredTodos();
			this.setClass();
			this.$todoList.html(this.todoTemplate(todos));
			this.$main.toggle(todos.length > 0);
			this.$toggleAll.prop('checked', this.getActiveTodos().length === 0);
			this.renderFooter();
			this.$newTodo.focus();
		},
		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			this.$footer.toggle(todoCount > 0).html(template);
		},
		toggleAll: function (e) {
			var isChecked = $(e.target).prop('checked');
			this.todos.forEach(function (todo) {
				if(isChecked === true) {
					isChecked = false;
				}else{
					isChecked = true;
				}
			});

			return this.todo.completed = isChecked;
		},
		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = $(el).closest('li').data('id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
		create: function (e) {
			var $input = $(e.target);
			var val = $input.val().trim();

			if (e.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: states.shift()
			});

			$input.val('');

			this.render();
		},
		setClass: function() {
			$("#todo-list").each(function() {
					$(this).find('li').each(function(){
						var el = App.indexFromEl(this);
						if(App.todos[el].completed === true){
							$(this).addClass("completed");
						}else{
							$(this).removeClass("completed");
						}
					});
				});
		},
		toggle: function (e) {
			var now;
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			if(this.todos[i].completed) {
				$(this.todos[i]).addClass("completed");
				now = "closed";
			}else{
				$(this.todos[i]).removeClass("completed");
				now = "open";
			}

			$.ajax({
    		url: "https://api.github.com/repos/" + name + "/" + repo + "/issues/"+ this.todos[i].id + "?access_token=" + token,
    		type: 'PATCH',
				data: '{"state": "'+ now +'"}',
				contentType: "application/json; charset=utf-8",
    		success: function(result) {
    			alert("Issue updated.");
				}
			});
			this.render();
		},
		edit: function (e) {
			var $input = $(e.target).closest('li').addClass('editing').find('.edit');
			$input.val($input.val()).focus();
		},
		editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				$(e.target).data('abort', true).blur();
			}
		},
		update: function (e) {
			var el = e.target;
			var $el = $(el);
			var val = $el.val().trim();

			if ($el.data('abort')) {
				$el.data('abort', false);
				this.render();
				return;
			}

			var i = this.indexFromEl(el);

			if (val) {
				this.todos[i].title = val;
			} else {
				this.todos.splice(i, 1);
			}

			this.render();
		},
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
});
