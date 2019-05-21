import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Accounts } from 'meteor/accounts-base';

import './main.html';
import '../lib/collection.js';

Session.set('taskLimit', 10);
Session.set('userFilter', false);

Session.set('hcomptask',false);

lastScrollTop = 0;
$(window).scroll(function(event){

	if ($(window).scrollTop() + $(window).height() > $(document).height() - 100){
		var scrollTop = $(this).scrollTop();

		if (scrollTop > lastScrollTop){
			Session.set('taskLimit', Session.get('taskLimit') + 5);			
		}
		lastScrollTop = scrollTop;
	}
});

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

Template.header.helpers({
	tasksFound(){
  		return todoDB.find({}).count({});
  	},
});

Template.main.helpers({
  	mainAll() {
  		if (Session.get("userFilter") == false){
	  		var time = new Date() - 15000;
	  		var results = todoDB.find({'createdOn': {$gte:time}}).count();

	  		if (results > 0){
	  			if (Session.get('hcomptask')==true)
	  			{
	  				console.log(1);
	  				return todoDB.find({'Checked':false}, {sort:{createdOn: -1}, limit:Session.get('taskLimit')});
	  			}else{
	  				console.log(2);
	  				return todoDB.find({}, {sort:{createdOn: -1}, limit:Session.get('taskLimit')});
	  			}
	  		} else {
	  			if (Session.get('hcomptask')==true){
	  				console.log(3);
	  				return todoDB.find({'Checked':false}, {sort:{createdOn: 1}, limit:Session.get('taskLimit')});
	  			}
	  			else{
	  				console.log(4);
	    			return todoDB.find({}, {sort:{createdOn: 1}, limit:Session.get('taskLimit')});
	  			}
	    	}

    	} else {
    		if (Session.get('hcomptask')==true)
    			return todoDB.find({postedBy:Session.get("userFilter"), 'Checked':false}, {sort:{createdOn: 1}, limit:Session.get('taskLimit')});
    		else
    			return todoDB.find({postedBy:Session.get("userFilter")}, {sort:{createdOn: 1}, limit:Session.get('taskLimit')});
    	}  	
  	},

  	taskAge(){
  		var taskCreatedOn = todoDB.findOne({_id:this._id}).createdOn;
  		taskCreatedOn = Math.round((new Date() - taskCreatedOn) / 60000);

  		var unit = " mins";

  		if (taskCreatedOn > 60){
  			taskCreatedOn = Math.round(taskCreatedOn / 60);
  			unit = " hours";
  		}

  		if (taskCreatedOn > 1440){
  			taskCreatedOn = Math.round(taskCreatedOn / 1440);
  			unit = " days";

  		}
  		return taskCreatedOn + unit;
  	},

  	userLoggedIn(){
  		var logged = todoDB.findOne({_id:this._id}).postedBy;
  		var userName = Meteor.users.findOne({_id:logged}).username;
  		console.log(userName);
  		return Meteor.users.findOne({_id:logged}).username;
  	},

  	userId(){
  		return todoDB.findOne({_id:this._id}).postedBy;
  	},

  	isOwner() {
    	return this.owner === Meteor.userId();
    },

    PrivateOwner(){
    	if(todoDB.findOne({_id:this._id}).Status== "Private"){
    		if(Meteor.user()){
    			if(Meteor.user()._id == todoDB.findOne({_id:this._id}).postedBy){
    				return true;
    			}
    		}
    	}
    	return false;
    },
    PublicOwner(){
    	if(todoDB.findOne({_id:this._id}).Status== "Public"){
    		return true;
    	}
    	return false;
    }
});

Template.header.events({
	'click .js-hcomptask'(event)
	{
		if (Session.get('hcomptask')==true)
		{
			Session.set('hcomptask',false);
		} else {
			Session.set('hcomptask',true);
		}
	}
})


Template.main.events({
	'click .js-delete'(event, instance){
		var deleteID = this._id;

		var confirmation = confirm("Are you sure you want to delete this");

		if (confirmation == true) {
			$('#' + deleteID).fadeOut('slow','swing', function(){
				todoDB.remove({_id:deleteID});
			});			
		}	
	},

	'click .js-checked'(event){
		var taskid = "task" + this._id;
		var task = document.getElementById(taskid);
		todoDB.update({'_id':this._id}, {$set:{'Checked':task.checked}});
	},

	'click .usrClick'(event, instance){
		event.preventDefault();
		Session.set("userFilter", event.currentTarget.id);
	},
});



Template.editTodo.events({
	'click .one-only-pub'(event){
		var public = document.getElementById("public");
		var private = document.getElementById("private");
		if( private.checked==true){
			console.log("both true - public");
			private.checked=false;
		}
	},

	'click .one-only-priv'(event){
		var public = document.getElementById("public");
		var private = document.getElementById("private");
		if( public.checked==true){
			console.log("both true - private");
			public.checked=false;
		}
	},

	'click .js-editSave'(event, instance){	
		var name = $('#editname').val();
		var public = document.getElementById("public");
		var private = document.getElementById("private");
		var status = "Public"
		if(public.checked == true){
			status = "Public";
		}
		if(private.checked == true){
			status = "Private";
		}
		console.log(public.checked);
		console.log(private.checked);
		if(private.checked==false && public.checked==false){
			alert("A privacy option must be selected to proceed");
		}
		else{
			$('#editname').val('');
			$('#public').val('');
			$('#private').val(''); 
			$("#editTodo").modal("hide");
			todoDB.insert({'task':name, 'Status':status, 'createdOn':new Date().getTime(), 'postedBy':Meteor.user()._id, 'Checked':false});
		}
	},
});