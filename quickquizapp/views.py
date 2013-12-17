from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import auth
from django.views.decorators.csrf import requires_csrf_token
from django.contrib.auth.decorators import login_required
from quickquizapp.models import Student, Quiz, TopicQuestion, Topic, StudentAnswer, Group
import json
import random
import string
import os
import binascii
#import xmpp

# Create your views here.
def index(request): 
	error_msg = request.GET.get('error_msg', '')
	if request.user.is_authenticated():
		if request.user.is_tutor is True:
			return render_to_response('tutor.html', {'is_tutor': request.user.is_tutor }, context_instance=RequestContext(request))
		else:
			return render_to_response('tutor.html', {'is_tutor': request.user.is_tutor }, context_instance=RequestContext(request))
	else:
		return render_to_response('login.html', {'error_msg': error_msg }, context_instance=RequestContext(request))

def user_login(request):
	username = request.POST.get('username', None)
	password = request.POST.get('password', None)
	user = authenticate(username=username, password=password)
	quiz_array = []
	user_details = {}
	if user is None:
		return HttpResponse(status=403)

	if user.is_active is True:
		login(request, user)
		print user
		return redirect('index')
	else:
		return HttpResponse(status=403)
		

def user_logout(request):
	logout(request)
	return redirect('index')

@login_required
def group(request, group_id=0):
	group = {}
	groups = []
	quiz_id = request.GET.get('quiz_id', None)
	if group_id == 0:
		if quiz_id is None:
			all_groups = request.user.group_set.all()

			for each_group in all_groups:
				quizes = Quiz.objects.filter(groups=each_group)
				for quiz in quizes:
					groups_object = Group.objects.filter(quiz=quiz)
					for group_object in groups_object:
						students = []
						score = 0
						for student_object in Student.objects.filter(group__pk=group_object.id):
							try:
								student_answer = StudentAnswer.objects.get(student=student_object, quiz=quiz)
								score += student_answer.score
							except:
								pass
							student = {'id': student_object.id, 'is_tutor': student_object.is_tutor, 'first_name': student_object.first_name, 'last_name': student_object.last_name, 'username': student_object.username, 'group': group_object.name}
							students.append(student)

						group = {'id': group_object.id, 'name': group_object.name, 'is_tutor': group_object.is_tutor, 'students': students, 'score': score}
						groups.append(group)
		else:
			try:
				quiz = Quiz.objects.get(id=quiz_id)
				if quiz.has_member(request.user):
					groups_object = Group.objects.filter(quiz__pk=quiz_id)

					for group_object in groups_object:
						students = []
						score = 0
						for student_object in Student.objects.filter(group__pk=group_object.id):
							try:
								student_answer = StudentAnswer.objects.get(student=student_object, quiz=quiz)
								score += student_answer.score
							except:
								pass
							student = {'id': student_object.id, 'is_tutor': student_object.is_tutor, 'first_name': student_object.first_name, 'last_name': student_object.last_name, 'username': student_object.username, 'group': group_object.name}
							students.append(student)

						group = {'id': group_object.id, 'name': group_object.name, 'is_tutor': group_object.is_tutor, 'students': students, 'score': score}
						groups.append(group)
			except:
				pass	
		return HttpResponse(json.dumps(groups), content_type='application/json')



				
	else:
		try:
			group_object = Group.objects.get(id=group_id)

			if group_object.has_member(request.user):
				students = []
				for student_object in Student.objects.filter(group__pk=group_object.id):
					student = {'id': student_object.id, 'is_tutor': request.user.is_tutor, 'first_name': student_object.first_name, 'last_name': student_object.last_name, 'username': student_object.username, 'group': group_object.name}
					students.append(student)
				group = {'id': group_object.id, 'name': group_object.name, 'is_tutor': group_object.is_tutor, 'students': students}
		except:
			pass
		return HttpResponse(json.dumps(group), content_type='application/json')

@login_required
def student(request, student_id=0):
	if request.method == "PUT":
		print "PUT"
	if request.method == "GET":
		student = {}
		students = []
		quiz_id = request.GET.get('quiz_id', None)
		if student_id == 0:
			try:
				quiz = Quiz.objects.get(id=quiz_id)
				if quiz.has_member(request.user):
					groups = Group.objects.filter(quiz__pk=quiz_id)

					for group in groups:
						for student_object in Student.objects.filter(group__pk=group.id):
							student = {'id': student_object.id, 'is_tutor': student_object.is_tutor, 'first_name': student_object.first_name, 'last_name': student_object.last_name, 'username': student_object.username, 'group': group.name}
							students.append(student)
			except:
				pass	
			return HttpResponse(json.dumps(students), content_type='application/json')		
		else:
			student = {'id': request.user.id, 'is_tutor': request.user.is_tutor, 'first_name': request.user.first_name, 'last_name': request.user.last_name, 'username': request.user.username}
			return HttpResponse(json.dumps(student), content_type='application/json')
	
@login_required
def quiz(request, quiz_id=0):
	if request.method == "PATCH":
		patch_load = json.loads(request.body)
		keys = patch_load.keys()
		print keys
		id =  patch_load['id']

		quiz = Quiz.objects.get(id=id)

		if 'is_active' in keys:
			is_active = patch_load['is_active']
			quiz.is_active = patch_load['is_active']

		quiz.save()
		
		return HttpResponse(json.dumps({'quizes': 'yay'}), content_type='application/json')
	if request.method == "GET":
		quiz = {}
		quizes = []
	
		if quiz_id == 0:
			groups = request.user.group_set.all()
			for group in groups:
				quiz_objects = Quiz.objects.filter(groups=group)
				for quiz_object in quiz_objects:
					quiz = {'id': quiz_object.id, 'name': quiz_object.name, 'start_time': str(quiz_object.start_time), 'is_active': quiz_object.is_active}
					quizes.append(quiz)		
			return HttpResponse(json.dumps(quizes), content_type='application/json')	
		else:
			try:
				quiz_object = Quiz.objects.get(id=quiz_id)
				quiz = {'id': quiz_object.id, 'name': quiz_object.name, 'date': str(quiz_object.start_time)}
			except:
				pass	
			return HttpResponse(json.dumps(quiz), content_type='application/json')
	
@login_required
def question(request, question_id=0):
	question = {}
	questions = []
	quiz_id = request.GET.get('quiz_id', None)

	if question_id == 0:
		if quiz_id is not None:
			try:
				quiz = Quiz.objects.get(id=quiz_id)
				print quiz
				if quiz.has_member(request.user):
					i = 1
					for question_object in quiz.questions.all():
						question = {'id': question_object.id, 'score': question_object.score, 'index': i}
						questions.append(question)
						i = i + 1
			except:
				pass
		return HttpResponse(json.dumps(questions), content_type='application/json')
	else:
		if quiz_id is not None:
			try:
				quiz = Quiz.objects.get(id=quiz_id)
				if quiz.has_member(request.user):
					question_object = TopicQuestion.objects.get(id=question_id)
					question = {'id': question_object.id, 'question': question_object.question, 'answer': question_object.answer, 'score': question_object.score}
					question['optionA'] = question_object.optionA
					question['optionB'] = question_object.optionB
					question['optionC'] = question_object.optionC
					question['optionD'] = question_object.optionD
					question['optionE'] = question_object.optionE
			except:
				pass
		return HttpResponse(json.dumps(question), content_type='application/json')

@login_required
def student_answer(request, student_answer_id=0):
	if request.method == 'POST':

		patch_load = json.loads(request.body)
		keys = patch_load.keys()
		quiz_id =  patch_load['quiz_id']
		question_id =  patch_load['question_id']
			
		quiz = Quiz.objects.get(id=quiz_id)
		question = TopicQuestion.objects.get(id=question_id)

		student_answer = StudentAnswer(quiz=quiz, question=question, student=request.user)
		student_answer.save()
		return HttpResponse(status=200)

	elif request.method == 'PUT':
		student_answer_id = request.PUT.get('student_answer_id', None)
		answer = request.PUT.get('answer', None)
		student_answer = StudentAnswer.objects.get(pk=student_answer_id)
		student_answer.answer = answer
		student_answer.save()
	elif request.method == 'GET':
		student_answer = {}
		student_answers = []

		quiz_id = request.GET.get('quiz_id', None)
		if student_answer_id == 0:
			if quiz_id is not None:
				try:
					quizes = Quiz.objects.filter(pk=quiz_id)
					for quiz in quizes:
						for answer in StudentAnswer.objects.filter(quiz=quiz, student=request.user):
							score += answer.score
						student_answer = {'id': student_answer_object.id, 'quiz_id': student_answer.quiz.id, 'quiz_name': student_answer.quiz.name, 'score': score}
						student_answers.append(student_answer)
				except:
					pass
			return HttpResponse(json.dumps(student_answers), content_type='application/json')
		else:
			try:
				student_answer_object = StudentAnswer.objects.get(id=student_answer_id)
				score = 0
				for answer in StudentAnswer.objects.filter(quiz=student_answer.quiz, student=request.user):
					score += answer.score
				student_answer = {'id': student_answer_object.id, 'quiz_id': student_answer.quiz.id, 'quiz_name': student_answer.quiz.name, 'score': score}
			except:
				pass
			return HttpResponse(json.dumps(student_answer), content_type='application/json')


def peek(request):
	return render_to_response('peek.html', {}, context_instance=RequestContext(request))


def delegate_student(request, quiz_id):
	if request.user.is_authenticated() and request.user.is_tutor:
		quiz = Quiz.objects.get(id=quiz_id)
		raw_token = binascii.b2a_hex(os.urandom(15))
		quiz.token = raw_token			
		for k, v in request.GET.iteritems():
			student = Student.objects.get(id=v)
			student.token = raw_token
			student.save()
		quiz.save()
		return HttpResponse("Student delegated", content_type='text/plain')
	else:
		return HttpResponse('Authentication failure', content_type='text/plain')

def end_question(request, quiz_id):
	if request.user.is_authenticated() and request.user.is_tutor:
		quiz = Quiz.objects.get(id=quiz_id)
		quiz.token = None
		quiz.save()
		return HttpResponse("Question Ended", content_type='text/plain')
	else:
		return HttpResponse('Authentication failure', content_type='text/plain')
	

# def start_quiz(request, quiz_id):
# 	if request.user.is_authenticated() and request.user.is_tutor:
# 		quiz = Quiz.objects.get(id=quiz_id)
# 		quiz.is_active = True
# 		quiz.save()
# 		return HttpResponse('Quiz started Successfully', content_type='text/plain')
# 	else:
# 		return HttpResponse('Authentication failure', content_type='text/plain')

def end_quiz(request, quiz_id):
	if request.user.is_authenticated() and request.user.is_tutor:
		quiz = Quiz.objects.get(id=quiz_id)
		quiz.is_active = False
		quiz.save()
		return HttpResponse('Quiz ended Successfully', content_type='text/plain')
	else:
		return HttpResponse('Authentication failure', content_type='text/plain')


