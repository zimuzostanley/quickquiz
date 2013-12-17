from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from quickquizapp.models import Student, Topic, TopicQuestion, Quiz, Group, StudentAnswer
import requests
import xmpp

class UserCreationForm(forms.ModelForm):
	#password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
	#password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)
	class Meta:
		model = Student
		fields = ('is_tutor','image')

	def save(self, commit=True):
		user = super(UserCreationForm, self).save(commit=False)
		
		user.set_password(self.cleaned_data['password'])

		if commit:
			user.save()

		return user

class UserChangeForm(forms.ModelForm):
	#password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
	#password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)

	password = ReadOnlyPasswordHashField(label= ("Password"), help_text= ("<a href=\"password/\">Click to change password</a>"))

	class Meta:
		model = Student
		fields = ('is_tutor','image')

	def save(self, commit=True):
		user = super(UserChangeForm, self).save(commit=False)
		print "Happpy"
		user.set_password(self.cleaned_data['password'])

		if commit:
			user.save()

		return user

class CustomUserAdmin(UserAdmin):
	add_form = UserCreationForm
	form = UserChangeForm

	list_filter = ('is_active', 'is_superuser', 'is_tutor')
	fieldsets = (
		(None, {
			'classes': ('wide',),
			'fields': ('first_name', 'last_name', 'username', 'password', 'email', 'is_tutor', 'image', 'is_superuser', 'is_active')
			}
			),
		)

	add_fieldsets = (
		(None, {
			'classes': ('wide',),
			'fields': ('first_name', 'last_name', 'username', 'password', 'email', 'is_tutor', 'image', 'is_superuser', 'is_active')
			}
			),
		)
	filter_horizontal = ()


class UserGroupAdmin(admin.ModelAdmin):
	filter_horizontal = ('students',)

class QuizAdmin(admin.ModelAdmin):
	filter_horizontal = ('groups', 'questions')
	readonly_fields = ('start_time', 'end_time', 'token')


class QuestionInline(admin.TabularInline):
	model = TopicQuestion
	extra = 10

class TopicAdmin(admin.ModelAdmin):
	inlines = [QuestionInline]

admin.site.register(Student, CustomUserAdmin)
admin.site.register(Group, UserGroupAdmin)
admin.site.register(Topic, TopicAdmin)
admin.site.register(Quiz, QuizAdmin)

admin.site.register(StudentAnswer)
