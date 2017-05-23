//aws javascript sdk
var AWS = require('aws-sdk');
//nunjucks template engine similar to jinja2
var jinja2 = require('nunjucks');


var FROM_ADDRESS='madhusudan.gohil@incontact.com'
var REPLY_TO_ADDRESS='madhusudan.gohil@incontact.com'


var CLIENTS = [    
    ['ms_gohil@yahoo.com', 'madhu', 'gohil', 'Firefly II'],
	['madhusudan.gohil@gmail.com', 'madhusudan', 'S Gohil', 'Riley']                
]

var EMPLOYEES = [
	['maamgohil@hotmail.com', 'Amita', 'Gohil']
]


var TEMPLATE_S3_BUCKET = 'mg-garden-templates'


function get_template_from_s3(key, callback){
	var template = '';    
    var s3 = new AWS.S3();
	var getParams = {
		Bucket: TEMPLATE_S3_BUCKET, // your bucket name,
		Key: key // path to the object you're looking for
	}
    
	s3.getObject(getParams, function(err, data) {
    // Handle any error and exit
    if (err)
        console.log(err);
	else
	{
		template = data.Body.toString('utf-8'); // Use the encoding necessary		
		callback(template);
		//console.log(template);
	}
	});
}

function render_come_to_work_template(employee_first_name, recipients,callback){	
    subject = 'Work Schedule Reminder'
    get_template_from_s3('come_to_work.html', function(t){
		template = t;
		//console.log(template);		
		html_email = jinja2.renderString(template, {first_name: employee_first_name})
		plaintext_email = 'Hello' + employee_first_name + ', \nPlease remember to be into work by 8am';
		callback({'html_email' : html_email,  'plaintext_email' : plaintext_email, 'subject': subject}, recipients);
	})
	
    
}

function render_daily_tasks_template(recipients, callback){
	
    var subject = 'Daily Tasks Reminder'
    var tasks = {
        'Monday': '1. Clean the dog areas\n',
        'Tuesday': '1. Clean the cat areas\n',
        'Wednesday': '1. Feed the aligator\n',
        'Thursday': '1. Clean the dog areas\n',
        'Friday': '1. Clean the cat areas\n',
        'Saturday': '1. Relax!\n2. Play with the puppies! It\'s the weekend!',
        'Sunday': '1. Relax!\n2. Play with the puppies! It\'s the weekend!'
    }
    
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
	var d = new Date();
    var today = days[d.getDay()];
	plaintext_email = "Remember to do all of these today:\n" + 
        "1. Feed the dogs\n" + 
        "2. Feed the rabbits\n" + 
        "3. Feed the cats\n" + 
        "4. Feed the turtles\n" + 
        "5. Walk the dogs\n" + 
        "6. Empty cat litterboxes\n" + 
        "And:\n" + 
        tasks[today];    
		
	get_template_from_s3('daily_tasks.html', function(t)
	{
		html_email = jinja2.renderString(t, {day_of_week: today, daily_tasks: tasks[today]});
		callback({'html_email' : html_email,  'plaintext_email' : plaintext_email, 'subject': subject}, recipients);
	});
}

function render_pickup_template(client_first_name, client_pet_name, recipients, callback){
	
    subject = 'Pickup Reminder'
	plaintext_email = 'Hello ' +  client_first_name + ' , \nPlease remember to pickup ' + client_pet_name  + ' by 7pm!';
	
    get_template_from_s3('pickup.html', function(t){
			html_email = jinja2.renderString(t, {first_name: client_first_name, pet_name: client_pet_name});
			callback({'html_email' : html_email,  'plaintext_email' : plaintext_email, 'subject': subject}, recipients)
	});
}

function send_email(email, recipients)
{
    try{
		
		var ses = new AWS.SES();
		var eparam = {Source: FROM_ADDRESS,
            Destination: {
                ToAddresses: recipients
            },
            Message: {
                Subject: {
                    Data: email.subject,
                },
                Body: {
                    Text: {
                        Data: email.plaintext_email
                    },
                    Html: {
                        Data: email.html_email
                    }
                }
            },
            ReplyToAddresses:[REPLY_TO_ADDRESS]};
			response = ses.sendEmail(eparam, function(err,data){
			if(err) 
				console.log(err)
			else 
				console.log(data);
		});
		
	}
	catch(e)
	{
		console.log('Failed to send message via SES');
        console.log(e.message);
        throw e;
	}
        
 
}

exports.handler = function(event,context,callback)
{	
    var event_trigger = event['resources'][0].substring(event['resources'][0].indexOf('/')+1);
    console.log('event triggered by ' + event_trigger);
	if (!AWS.config.region) {
		AWS.config.update({
		region: 'us-west-2'
		});
	}
    switch(event_trigger)
	{
		case 'come_to_work':
			for(var i=0; i < EMPLOYEES.length; i++)
			{
				var address = [];
				address.push(EMPLOYEES[i][0]);				
				render_come_to_work_template(EMPLOYEES[i][1], address, send_email);				
				callback("success");
			}            
			break;
        case 'daily_tasks':		
		for(var i=0; i < EMPLOYEES.length; i++)
			{
				var address = [];
				address.push(EMPLOYEES[i][0]);				
				render_daily_tasks_template(address, send_email);				
				callback("success");
			}        
			break;
		case 'pickup':
        for(var i=0; i < CLIENTS.length; i++)
			{
            var address = []
            address.push(CLIENTS[i][0]);           
			render_pickup_template(CLIENTS[i][1], CLIENTS[i][3], address, send_email);            
			callback("success");
			}
			break;
		default:
			return 'No template for this trigger!'
	}
        

}
