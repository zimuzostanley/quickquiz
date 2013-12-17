var app = app || {};

var QuestionList = Backbone.Collection.extend({
	url: 'http://localhost:8000/quickquiz/question',

	model: app.Question,
	
});

app.Questions = new QuestionList;

app.GroupList = Backbone.Collection.extend({
	url: 'http://localhost:8000/quickquiz/group/',

	model: app.Group,
});

app.Groups = new app.GroupList;
app.AllGroups = new app.GroupList;

app.QuizList = Backbone.Collection.extend({
	url: 'http://localhost:8000/quickquiz/quiz',

	model: app.Quiz,
});

app.Quizes = new app.QuizList;
