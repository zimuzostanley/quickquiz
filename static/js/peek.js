$(function() {
	var Peek = {
		connection: null,

		contacts: [],
		
		handle_message: function(message) {
			var from = $(message).attr('from');
			var body = $(message).children('body').text();
			alert(from + " FROM " + body + " BODY");
			return true;
		},

		on_roster: function (iq) {
			$(iq).find('item').each(function () {
				var jid = $(this).attr('jid');
				var name = $(this).attr('name') || jid;

				var jid_id = QuickQuiz.jid_to_id(jid);
				Peek.contacts.push(jid_id);
				
			});
			alert(Peek.contacts);
		},

		jid_to_id: function (jid) {
			return Strophe.getBareJidFromJid(jid).replace("@", "-");
		},

		show_traffic: function (body, type) {
			//alert('zim');
			if (body.childNodes.length > 0) {
				var console = $('#console').get(0);
				var at_bottom = console.scrollTop >= console.scrollHeight - console.clientHeight;

				$.each(body.childNodes, function () {
					$('#console').append("<div class='" + type + "'>" + Peek.pretty_xml(this) + "</div>");
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
						result.push(Peek.pretty_xml(this, level + 1));
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
					type: 'PeekError',
					message: 'No DOMParser object found'
				}
			}
			var elem = doc.documentElement;
			if ($(elem).filter('parseerror').length > 0) {
				return null;
			}
			return elem;
		}
	}

	$('#openfire-connect').click(function() {
		$(document).trigger('connect', {
			jid: $('#jid').val(),
			password: $('#password').val()
		});
		$('#password').val('');
	});

	$('#login-btn').click(function() {
      $(document).trigger('connect', {
        jid: $('#jid').val(),
        password: $('#password').val()
      });
      $('#password').val('');
    });

	$('#send_button').click(function() {
		var input = $('#input').val();
		var error = false;

		if (input.length > 0) {
			if (input[0] === '<') {
				var xml = Peek.text_to_xml(input);
				if (xml) {
					Peek.connection.send(xml);
					var msg = $msg({to: 'eky@fiat', type: 'chat'}).c('body').t("happy");
					Peek.connection.send(msg);
					$('#input').val('');
				}
				else {
					error = true;
				}
			} else if (input[0] === '$') {
				try {
					var builder = eval(input);
					Peek.connection.send(builder);
					$('#input').val('');
				} catch (e) {
					error = true;
				}
			} else {
				error = true;
			}
		} 

		if (error) {
			alert('error');
			$('#input').animate({backgroundColor: "#faa"});
		}

		
	});

	$('#input').keypress(function() {
		$(this).css({backgroundColor: '#fff'});
	});

	$('#disconnect_button').click(function() {
		Peek.connection.disconnect();
	})

	$(document).bind('connect', function(ev, data) {
		var conn = new Strophe.Connection("http://localhost:7070/http-bind/");
		conn.xmlInput = function (body) {
			Peek.show_traffic(body, 'incoming');
		}
		conn.xmlOutput = function (body) {
			Peek.show_traffic(body, 'outgoing');
		}
		
		conn.connect(data.jid, data.password, openfire_connect);
		Peek.connection = conn;
		
		
	});

	function openfire_connect(status) {
		if (status == Strophe.Status.CONNECTED) {
			$(document).trigger('connected');
		}
		else if (status == Strophe.Status.DISCONNECTED) {
			$(document).trigger('disconnected');
		}
	};

	$(document).bind('connected', function() {
		alert(Peek.connection.sid + ' sid');
		$.cookies.set('jid', Peek.connection.jid);
		$.cookies.set('rid', Peek.connection.rid);
		$.cookies.set('sid', Peek.connection.sid);
		$('#disconnect_button').removeAttr('disabled');
		$('#input').removeAttr('disabled');
		$('#send_button').removeAttr('disabled');
		var iq = $iq({type: 'get'}).c('query', {xmlns: 'jabber:iq:roster'});
		Peek.connection.sendIQ(iq, Peek.on_roster);
		Peek.connection.addHandler(Peek.handle_message, null, "message", "chat");
		alert('connected');

	});

	$(document).bind('disconnected', function() {
		$('#disconnect_button').attr('disabled', 'disabled');
		$('#input').attr('disabled', 'disabled');
		$('#send_button').attr('disabled', 'disabled');
		alert('disconnected');
	});
});
