var app = app || {};
//Question

app.QuestionView = Backbone.View.extend({
	el: '#questions-wrapper',

	template: _.template($('#question-template').html()),

	events: {
		"click .question-option": "selectOption",
		"click .question-submit": "submitQuestion",
	},

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
		this.render();
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	selectOption: function() {
		console.log("help");
	},

	submitQuestion: function() {
		console.log('submit');
	}

});

app.QuestionNumberView = Backbone.View.extend({
	tagName: "div",

	template: _.template($('#question-number-template').html()),

	events: {
		"click .question-number-row": "selectQuestion",
	},

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	selectQuestion: function() {
		this.model.fetch({data: {quiz_id: localStorage.getItem('quiz_id')}, success: function() {
			if (localStorage.getItem('turn')) {
				var answer = new app.Answer({
					question_id: localStorage.getItem('question_id'),
					quiz_id: localStorage.getItem('quiz_id')
				});
				answer.save();
			}
			
		}, error: function() {
			alert('Not your turn');
		}});
		
		var view  = new app.QuestionView({model: this.model});
		console.log(this.model.get('index') + " index and " + this.model.get('id') + " id");
	}

});


var QuestionNumbersView = Backbone.View.extend({
	el: '#questions-wrapper',

	initialize: function() {
		
		this.listenTo(app.Questions, 'all', this.render);
		this.listenTo(app.Questions, 'add', this.addOne);
	},

	render: function() {
		return this;
	},

	addOne: function(question_number) {
		var view  = new app.QuestionNumberView({model: question_number});
		this.$el.append(view.render().el);
	},
	empty: function() {
		this.$el.empty();
	}
	
});

app.QuestionNumbersView = new QuestionNumbersView;

//Group
app.GroupView = Backbone.View.extend({

	tagName: 'li',

	template: _.template($('#group-template').html()),

	events: {
		"click .group-row": "selectGroup",
	},

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	selectGroup: function() {
		console.log('select group');
		
		//send xmpp to all members of group so they can be editors
		//send xmpp to everyone so they can view
	}
});

var GroupsView = Backbone.View.extend({
	el: '#groups-wrapper',

	initialize: function() {
		this.listenTo(app.Groups, 'all', this.render);
		this.listenTo(app.Groups, 'add', this.addOne);
		
	},

	render: function() {
		//this.$el.html('');
		return this;
	},

	addOne: function(group) {
		var view = new app.GroupView({model: group});
		this.$el.append(view.render().el);
	}

});

app.GroupsView = new GroupsView;

//Quiz
app.QuizView = Backbone.View.extend({
	template: _.template($('#quiz-template').html()),

	events: {
		"click .quiz-row": "startQuiz"
	},

	initialize: function() {
		this.listenTo(this.model, 'change', this.render);
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	startQuiz: function() {
		var id = this.model.get('id');
		
		app.Questions.reset();
		localStorage.setItem('quiz_id', id);
		localStorage.setItem('is_list', true);

		if(localStorage.getItem('is_tutor') == 'true') {
			var quiz = app.Quizes.get(id);
			quiz.save({is_active: true, id: id, token: localStorage.getItem('jid').split('/')[0], secret: localStorage.getItem('jid').split('/')[1]}, { 
				success: function() {
					app.Groups.fetch({data: {quiz_id: localStorage.getItem('quiz_id')}, success: function() {
						var empty_roster = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
						app.QuickQuizXMPP.connection.sendIQ(empty_roster, app.QuickQuizXMPP.empty_roster);
						app.joinQuiz(app.Groups.toJSON());
					}});
					
			}, error: function() {
					alert('Unable to start quiz'); 
			}, patch: true });
		}
		else {
			app.Groups.fetch({data: {quiz_id: localStorage.getItem('quiz_id')}, success: function() {
				var empty_roster = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
				app.QuickQuizXMPP.connection.sendIQ(empty_roster, app.QuickQuizXMPP.empty_roster);
				app.joinQuiz(app.Groups.toJSON());
			}});
		}
		
		app.QuickQuizRouter.navigate('quiz/current', {trigger: true});
	}
});

var QuizesView = Backbone.View.extend({
	el: '#quizes-wrapper',

	initialize: function() {
		this.listenTo(app.Quizes, 'all', this.render);
		this.listenTo(app.Quizes, 'add', this.addOne);
		app.AllGroups.fetch();
	},

	render: function() {
		return this;
	},

	addOne: function(quiz) {
		var view = new app.QuizView({model: quiz});
		this.$el.append(view.render().el);
	}

});

app.QuizesView = new QuizesView;

var TopBarView = Backbone.View.extend({
	el: '#topbar-wrapper',

	template: _.template($('#topbar-template').html()),

	events: {
		'click .logout-btn': 'logout',
		'click .available-quiz-nav': 'availableQuiz',
		'click .current-quiz-nav': 'currentQuiz',
	},

	initialize: function() {
		this.render();
	},

	render: function() {
		this.$el.html(this.template());
		if (!localStorage.getItem('quiz_id')) {
			$('.current-quiz-nav').addClass('hide');
			$('.available-quiz-nav').addClass('active');
		}
		else {
			$('.current-quiz-nav').removeClass('hide');
		}
		return this;
	},

	logout: function() {
		app.logout();
	},

	availableQuiz: function() {
		//console.log('availableQuiz');
		
	},

	currentQuiz: function() {
		//console.log('current');
		
	}

});

app.TopBarView = new TopBarView;