from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import AbstractUser



# Create your models here.

class Topic(models.Model):
	name = models.CharField(max_length=50)
	difficulty_level = models.IntegerField(default=1)

	def __unicode__(self):
		return self.name

class TopicQuestion(models.Model):
	question = models.CharField(max_length=200)
	
	optionA = models.CharField(max_length=100, null=True, blank=True)
	optionB = models.CharField(max_length=100, null=True, blank=True)
	optionC = models.CharField(max_length=100, null=True, blank=True)
	optionD = models.CharField(max_length=100, null=True, blank=True)
	optionE = models.CharField(max_length=100, null=True, blank=True)

	answer = models.CharField(max_length=10)
	image = models.ImageField(null=True, upload_to='images/questions', blank=True)

	score = models.IntegerField(default=1)
	topic = models.ForeignKey(Topic)

	def __unicode__(self):
		return self.question

class Student(AbstractUser):
	is_tutor = models.BooleanField(default=False)
	image = models.ImageField(null=True, upload_to='images/students/', blank=True)
	token = models.CharField(max_length=50, null=True, blank=True)

class Group(models.Model):
	name = models.CharField(max_length=50)
	students = models.ManyToManyField(Student)
	is_tutor = models.BooleanField(default=False)

	def has_member(self, participant):
		is_member = False
		for student in Student.objects.filter(group__pk=self.id):
			if student == participant:
				is_member = True
				break
		return is_member


	def __unicode__(self):
		return self.name

class Quiz(models.Model):
	name = models.CharField(max_length=50)
	start_time = models.DateTimeField(null=True)
	end_time = models.DateTimeField(null=True)
	token = models.CharField(max_length=50, null=True)
	is_active = models.BooleanField(default=False)
	groups = models.ManyToManyField(Group)
	questions = models.ManyToManyField(TopicQuestion)


	def has_member (self, participant):
		is_member = False
		groups = Group.objects.filter(quiz__pk=self.id)

		for group in groups:
			for student in Student.objects.filter(group__pk=group.id):
				if student == participant:
					is_member = True
					break
		return is_member

	def __unicode__(self):
		return self.name

class StudentAnswer(models.Model):
	answer = models.CharField(max_length=50, null=True)
	student = models.ForeignKey(Student)
	question = models.ForeignKey(TopicQuestion)
	quiz = models.ForeignKey(Quiz)
	score = models.IntegerField(default=0)
	def __unicode__(self):
		return self.question.question