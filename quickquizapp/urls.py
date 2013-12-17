from django.conf.urls import patterns, url
from quickquizapp import views

urlpatterns = patterns('',
	
	url(r'^delegate_student/(?P<quiz_id>\d+)$', views.delegate_student, name='delegate_student'),
	url(r'^end_question/(?P<quiz_id>\d+)$', views.end_question, name='end_question'),
	url(r'^end_quiz/(?P<quiz_id>\d+)$', views.end_quiz, name='end_quiz'),
	url(r'^user_login$', views.user_login, name='user_login'),
	url(r'^user_logout$', views.user_logout, name='user_logout'),
	url(r'^peek$', views.peek, name='peek'),
	url(r'^quiz/(?P<quiz_id>\d+)$', views.quiz, name='quiz'),
	url(r'^quiz/$', views.quiz, name='quiz'),
	url(r'^student/(?P<student_id>\d+)$', views.student, name='student'),
	url(r'^student/$', views.student, name='student'),
	url(r'^group/(?P<group_id>\d+)$', views.group, name='group'),
	url(r'^group/$', views.group, name='group'),
	url(r'^question/(?P<question_id>\d+)$', views.question, name='question'),
	url(r'^question/$', views.question, name='question'),
	url(r'^student_answer/(?P<student_answer_id>\d+)$', views.student_answer, name='student_answer'),
	url(r'^student_answer/$', views.student_answer, name='student_answer'),
	url(r'^$', views.index, name='index'),
	)