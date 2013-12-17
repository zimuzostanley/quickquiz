var app = app || {};

app.Question = Backbone.Model.extend({
	urlRoot: 'http://localhost:8000/quickquiz/question',

	defaults: {
		id: '',
		index: '',
		question: '',
		optionA: '',
		optionB: '',
		optionC: '',
		optionD: '',
		optionE: '',
		score: ''

	},
	answer: function() {
		this.save({
			answered: true
		});
	}
});


app.Group = Backbone.Model.extend({

});

app.Quiz = Backbone.Model.extend({

});

app.Answer = Backbone.Model.extend({
	urlRoot: 'http://localhost:8000/quickquiz/student_answer/',

});

// app.QuizInvite = Backbone.Model.extend({

// });

// app.ModalHeading = Backbone.Model.extend({

// });
