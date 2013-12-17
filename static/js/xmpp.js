var app = app || {};
$(function() {
	//alert('zz');
	app.QuickQuizXMPP = {
		connection: null,

		contacts: [],

		jid_to_id: function (jid) {
			return Strophe.getBareJidFromJid(jid).replace("@", "-");
		},

		show_traffic: function (body, type) {
			if (body.childNodes.length > 0) {
				var console = $('#console').get(0);
				var at_bottom = console.scrollTop >= console.scrollHeight - console.clientHeight;

				$.each(body.childNodes, function () {
					$('#console').append("<div class='" + type + "'>" + app.QuickQuizXMPP.pretty_xml(this) + "</div>");
				});

				if (at_bottom) {
					console.scrollTop = console.scrollHeight;
				}
			}
		},

		xml2html: function (s) {
			return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt");
		},

		pretty_xml: function(xml, level) {
			var i, j;
			var result = [];

			if (!level) {
				level = 0;
			}

			result.push("<div class='xml_level" + level + "'>");
			result.push("<span class='xml_punc'>&lt;</span>");
			result.push("<span class='xml_tag'>");
			result.push(xml.tagName);
			result.push("</span>");

			var attrs = xml.attributes;
			var attr_lead = [];

			for (i = 0; i < xml.tagName.length + 1; i++) {
				attr_lead.push("&nbsp;");
			}
			attr_lead = attr_lead.join(" ");

			for (i = 0; i < attrs.length; i++) {
				result.push(" <span class='xml_aname'>");
				result.push(attrs[i].nodeName);
				result.push("</span><span class='xml_punc'>='</span>");
				result.push("<span class='xml_avalue'>");
				result.push(attrs[i].nodeValue);
				result.push("</span><span class='xml_punc'>'</span>");

				if (i !== attrs.length - 1) {
					result.push("</div><div class='xml_level" + level + "'>");
					result.push(attr_lead);
 				}
			}

			if (xml.childNodes.length === 0) {
				result.push("<span class='xml_punc'>/&gt;</span></div>");
			}
			else {
				result.push("<span class='xml_punc'>/&gt;</span></div>");
				
				$.each(xml.childNodes, function() {
					if (this.nodeType === 1) {
						result.push(app.QuickQuizXMPP.pretty_xml(this, level + 1));
					}
					else if (this.nodeType === 3) {
						result.push("<div class='xml_text xml_level" + (level + 1) + "'>");
						result.push(this.nodeValue);
						result.push("</div>");
					}
				});

				result.push("<div class='xml xml_level" + level + "'>");
				result.push("<span class='xml_punc'>&lt;/</span>");
				result.push("<span class='xml_tag'");
				result.push(xml.tagName);
				result.push("</span>");
				result.push("<span class='xml_punc'>&gt;</span></div>");	
			}
			return result.join("");
		},

		text_to_xml: function (text) {
			var doc = null;

			if (window['DOMParser']) {
				var parser = new DOMParser();
				doc = parser.parseFromString(text, 'text/xml');
			} else if (window['ActiveXObject']) {
				var doc = new ActiveXObject("MSXML2.DOMDocument");
				doc.async = false;
				doc.loadXML(text);
			} else {
				throw {
					type: 'app.QuickQuizXMPPError',
					message: 'No DOMParser object found'
				}
			}
			var elem = doc.documentElement;
			if ($(elem).filter('parseerror').length > 0) {
				return null;
			}
			return elem;
		},

		handle_message: function(message) {
			var from = $(message).attr('from');
			var body = $(message).children('body').text();
			
			app.decodeMessage(body, from);
			return true;
		},

		on_presence: function(presence) {
			var ptype = $(presence).attr('type');
			var from = $(presence).attr('from');
			var username = from.split('@')[0];

			
			if (ptype !== 'error') {

				if (ptype == 'subscribe') {
					if (app.isTutorMember(app.AllGroups.toJSON(), username) || app.isStudentMember(app.AllGroups.toJSON(), username)) {
						if (from !== localStorage.getItem('jid').split('/')[0]) {
							app.QuickQuizXMPP.connection.send($pres({
								to: from,
								type: "subscribed"
							}));
							console.log('subscribed ' + from );
						}
					}
				}

				if (app.isTutorMember(app.Groups.toJSON(), username) || app.isStudentMember(app.Groups.toJSON(), username)) {
					var status = $(presence).find('status').text();
					if (ptype == 'available') {
						if (status == localStorage.getItem('quiz_id')) {
							var contact = $('#' + username + '-status').html('Joined quiz');
							console.log('joined');
						}
						else {
							var contact = $('#' + username + '-status').html('Online');
							console.log('online');
						}	
					}
					else {
						var contact = $('#' + username + '-status').html('offline');
						console.log('unavailable');
					}
				}
			}
			return true;
		},

		empty_roster: function(iq) {
			$(iq).find('item').each(function () {
				var jid = $(this).attr('jid');
				var username = jid.split('@')[0];				
				if (!app.isStudentMember(app.Groups.toJSON(), username) && !app.isTutorMember(app.Groups.toJSON(), username)) {	
					var iq = $iq({type: 'set'}).c('query', {xmlns: 'jabber:iq:roster'}).c("item", {jid: jid}, {subscription: 'remove'});
					app.QuickQuizXMPP.connection.sendIQ(iq);	
				}
			});
		},
	}

	$('#openfire-connect').click(function() {
		$(document).trigger('connectInitial', {
			jid: $('#jid').val(),
			password: $('#password').val()
		});
		$('#password').val('');
	});

	$('#login-form').keypress(function (ev) {
		if (ev.which === 13) {
			ev.preventDefault();

			$(document).trigger('connectInitial', {
				jid: $('#jid').val(),
				password: $('#password').val()
			});
			$('#password').val('');
		}
	});

	$('#login-btn').click(function() {
		$(document).trigger('connectInitial', {
			jid: $('#jid').val(),
			password: $('#password').val()
		});
		$('#password').val('');
	});


	$(document).bind('connectAgain', function(ev, data) {

		var conn = new Strophe.Connection("http://localhost:5280/http-bind");
		conn.xmlInput = function (body) {
			app.QuickQuizXMPP.show_traffic(body, 'incoming');
			//console.log(body);
		}
		conn.xmlOutput = function (body) {
			app.QuickQuizXMPP.show_traffic(body, 'outgoing');
			//console.log(body);
			localStorage.setItem('rid', app.QuickQuizXMPP.connection.rid);
		}
		app.QuickQuizXMPP.connection = conn;
				
		conn.attach(localStorage.getItem('jid'), localStorage.getItem('sid'), localStorage.getItem('rid'), function(status) {
			
			if (status == Strophe.Status.ATTACHED) {
				app.QuickQuizXMPP.connection.addHandler(app.QuickQuizXMPP.on_presence, null, "presence", null, null, null, {matchBare: true});
				app.QuickQuizXMPP.connection.addHandler(app.QuickQuizXMPP.handle_message, null, "message", "chat");
				app.QuickQuizXMPP.connection.send($pres());
				app.QuickQuizXMPP.connection.send($pres({type: "available"}).c('status', localStorage.getItem('quiz_id')));
				console.log('attached ' + localStorage.getItem('rid'));
			}
			else if (status == Strophe.Status.DISCONNECTED) {
				console.log("disconnected");
				//check if still connected to server, if connected continue dont do any, if not logout from web server
				//app.logout();
				//window.location.replace('/quickquiz');
			}
			
		});

		
	});

	$(document).bind('connectInitial', function(ev, data) {

		var conn = new Strophe.Connection("http://localhost:5280/http-bind");
		conn.xmlInput = function (body) {
			app.QuickQuizXMPP.show_traffic(body, 'incoming');
		}
		conn.xmlOutput = function (body) {
			app.QuickQuizXMPP.show_traffic(body, 'outgoing');
		}

		
		app.QuickQuizXMPP.connection = conn;

		conn.connect(data.jid + "@" + app.XMPP_DOMAIN, data.password, function(status) {

			if (status == Strophe.Status.CONNECTED) {
				localStorage.setItem('jid', app.QuickQuizXMPP.connection.jid);
				localStorage.setItem('rid', app.QuickQuizXMPP.connection.rid);
				localStorage.setItem('sid', app.QuickQuizXMPP.connection.sid);
				
				$(document).trigger('connected', { jid: data.jid, password: data.password});
			}
			else if (status == Strophe.Status.DISCONNECTED) {
				$(document).trigger('disconnected');
			}
		});
	});

	$(document).bind('connected', function(ev, data) {
		$('#disconnect_button').removeAttr('disabled');
		$('#input').removeAttr('disabled');
		$('#send_button').removeAttr('disabled');

		app.QuickQuizXMPP.connection.addHandler(app.QuickQuizXMPP.handle_message, null, "message", "chat");
		console.log('connected');

		$.ajax({
			type: "POST",
			url: "/quickquiz/user_login",
			data: {username: data.jid, password: data.password},
			success: function(data, status, jqxhr) {
				window.location.replace('/quickquiz');
			},
			error: function(jqxhr, status, error) {
				app.QuickQuizXMPP.connection.disconnect();
				window.location.replace('/quickquiz');
			}
		});		
	});


	$(document).bind('disconnected', function() {
		$('#disconnect_button').attr('disabled', 'disabled');
		$('#input').attr('disabled', 'disabled');
		$('#send_button').attr('disabled', 'disabled');
		console.log('disconnected');
	});

	if(localStorage.getItem('jid') && localStorage.getItem('rid') && localStorage.getItem('sid')) {
		$(document).trigger('connectAgain');
	}
	else {
		app.logout();
	}
});
