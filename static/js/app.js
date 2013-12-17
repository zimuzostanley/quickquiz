var app = app || {};

app.XMPP_DOMAIN = "fiat";
app.isTutor = localStorage.getItem('is_tutor') === 'true';



$(function() {

		// $(document).bind('click', function(e) {
		// 	e.stopPropagation();
		// 	e.preventDefault();
		// 	console.log('hee');
		// 	e.stopImmediatePropagation();
		// 	return false;
		// });
	///$.blockUI({message: null});


	$.ajaxSetup({
    	beforeSend: function(xhr, settings) {
        	if (!csrfSafeMethod(settings.type)) {
            	// Send the token to same-origin, relative URLs only.
            	// Send the token only if the method warrants CSRF protection
            	// Using the CSRFToken value acquired earlier
            	xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken'));
        	}
    	},
    	crossDomain: true
	});
});

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
};

app.isStudentMember = function(groups, student) {
	is_member = false;
	_.each(groups, function(element, index, list) {
		_.each(element.students, function(value, key, list) {
			if (value.username === student && !value.is_tutor) {
				is_member = true;
			}
		});	
	});
	return is_member;
}

app.isTutorMember = function(groups, student) {
	is_member = false;
	_.each(groups, function(element, index, list) {
		_.each(element.students, function(value, key, list) {
			if (value.username === student && value.is_tutor) {
				is_member = true;
			}
		});	
	});
	return is_member;
} 

app.encodeMessage = function(input) {
	var message = input.begin + "|" + input.end + "|" + input.quiz_id + "|" + input.question_id + "|" +  input.question_index + "|" + input.is_list + "|" +  input.turn;
	return message;
};

app.decodeMessage = function(body, from) {
	var message = body.split('|');

	var begin = message[0];
	var end = message[1];
	var quiz_id = message[2];
	var question_id = message[3];
	var question_index = message[4];
	var is_list = message[5];
	var turn = message[6];
	var sender_is_tutor = false;
	console.log('in decodeMessage');
	if (app.isStudentMember(app.Groups.toJSON(), from.split('@')[0])) {
		sender_is_tutor = false;
	}
	else if (app.isTutorMember(app.Groups.toJSON(), from.split('@')[0])) {
		sender_is_tutor = true;
	}
	

	if (quiz_id && question_id && question_index) {

	}

	if (is_list) {

	}

	if (turn) {

	}

	return message;
};

app.joinQuiz = function(participants) {
	//empty roster first

		_.each(participants, function(element, index, list) {
			_.each(element.students, function(value, key, list) {
				var jid = value.username + "@" + app.XMPP_DOMAIN;
				if (jid !== localStorage.getItem('jid').split('/')[0]) {
					var iq = $iq({type: 'set'}).c('query', {xmlns: 'jabber:iq:roster'}).c("item", {jid: jid, name: value.username});
					app.QuickQuizXMPP.connection.sendIQ(iq);
					var subscribe = $pres({to: jid, "type": "subscribe"});
					app.QuickQuizXMPP.connection.send(subscribe);
				}				
			});
		});
		app.QuickQuizXMPP.connection.send($pres({type: "available"}).c('status', localStorage.getItem('quiz_id')));	
};

//send message to individual
app.sendIndividualMessage = function(student_name, message) {
	console.log('in send sendIndividualMessage');
	var msg = $msg({to: student_name + "@" + app.XMPP_DOMAIN, type: 'chat'}).c('body').t(app.encodeMessage(message));
	app.QuickQuizXMPP.connection.send(msg);
};

//send message to just a group in a quiz
app.sendGroupMessage = function(groups, group_name, message) {
	_.each(groups, function(element, index, list) {
		if (element.name === group_name) {
			_.each(element.students, function(value, key, list) {
				if (value.username != localStorage.getItem('jid').split('/')[0].split('@')[0]) {
					var msg = $msg({to: value.username + "@" + app.XMPP_DOMAIN, type: 'chat'}).c('body').t(app.encodeMessage(message));
					app.QuickQuizXMPP.connection.send(msg);
				}
			});
		}
			
	});
};

//send message to every group in quiz
app.sendAllMessage = function(groups, message) {
	_.each(groups, function(element, index, list) {
		_.each(element.students, function(value, key, list) {
			if (value.username != localStorage.getItem('jid').split('/')[0].split('@')[0]) {
				var msg = $msg({to: value.username + "@" + app.XMPP_DOMAIN, type: 'chat'}).c('body').t(app.encodeMessage(message));
				app.QuickQuizXMPP.connection.send(msg);
			}
		});	
	});
};

app.logout = function () {
	localStorage.removeItem('jid');
	localStorage.removeItem('rid');
	localStorage.removeItem('sid');
	localStorage.removeItem('quiz_id');
	localStorage.removeItem('question_id');
	localStorage.removeItem('quiz_list');
	localStorage.removeItem('turn');
	localStorage.removeItem('is_tutor');
	//localStorage.removeItem('show-current-quiz');
	localStorage.removeItem('quiz_id_old');
	
	if (app.QuickQuizXMPP.connection) {
		app.QuickQuizXMPP.connection.disconnect();
	}
	$.ajax({
		url: '/quickquiz/user_logout',
	});
}

