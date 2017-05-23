var AWS = require('aws-sdk');
var jinja2 = require('jinja');

# Start of some things you need to change
#
#
# Recipient emails or domains in the AWS Email Sandbox must be verified
# You'll want to change this to the email you verify in SES
var FROM_ADDRESS='thewoofgardenstaff@gmail.com'
var REPLY_TO_ADDRESS='thewoofgardenstaff@gmail.com'

# You'll also need to change these to email addresses you verify in AWS
var CLIENTS = [    
    ['ms_gohil@yahoo.com', 'madhu', 'gohil', 'Firefly II'],
	['madhusudan.gohil@gmail.com', 'madhusudan', 'S Gohil', 'Riley']                
]

var EMPLOYEES = [
	['maamgohil@hotmail.com', 'Amita', 'Gohil']
]

# Change to the bucket you create on your AWS account
var TEMPLATE_S3_BUCKET = 'mg-templates'
#
#
# End of things you need to change

function get_template_from_s3(key){
	var template = '';
    """Loads and returns html template from Amazon S3"""
    var s3 = new AWS.S3();
	var getParams = {
		Bucket: TEMPLATE_S3_BUCKET, // your bucket name,
		Key: key // path to the object you're looking for
	}
    
	s3.getObject(getParams, function(err, data) {
    // Handle any error and exit
    if (err)
        return err;
		
		let template = data.Body.toString('utf-8'); // Use the encoding necessary		
	});	
    return template;
}

function render_come_to_work_template(employee_first_name){
    subject = 'Work Schedule Reminder'
    template = get_template_from_s3('come_to_work.html')
    html_email = template.render(first_name = employee_first_name)
    plaintext_email = 'Hello {0}, \nPlease remember to be into work by 8am'.format(employee_first_name)
    return {'html_email' : html_email,  'plaintext_email' : plaintext_email, 'subject': subject};
}

function render_daily_tasks_template(){
	
    var subject = 'Daily Tasks Reminder'
    var template = get_template_from_s3('daily_tasks.html')
    var tasks = {
        'Monday': '1. Clean the dog areas\n',
        'Tuesday': '1. Clean the cat areas\n',
        'Wednesday': '1. Feed the aligator\n',
        'Thursday': '1. Clean the dog areas\n',
        'Friday': '1. Clean the cat areas\n',
        'Saturday': '1. Relax!\n2. Play with the puppies! It\'s the weekend!',
        'Sunday': '1. Relax!\n2. Play with the puppies! It\'s the weekend!'
    }
    # Gets an integer value from 0 to 6 for today (Monday - Sunday)
    # Keep in mind this will run in GMT and you will need to adjust runtimes accordingly 
    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
	var d = new Date();
    var today = days[d.getDay()];
    var html_email = template.render(day_of_week = today, daily_tasks = tasks[today])
    plaintext_email = (
        "Remember to do all of these today:\n"
        "1. Feed the dogs\n"
        "2. Feed the rabbits\n"
        "3. Feed the cats\n"
        "4. Feed the turtles\n"
        "5. Walk the dogs\n"
        "6. Empty cat litterboxes\n"
        "And:\n"
        "{0}".format(tasks[today])
    )
    return html_email, plaintext_email, subject
}

function render_pickup_template(client_first_name, client_pet_name){
	
    subject = 'Pickup Reminder'
    template = get_template_from_s3('pickup.html')
    html_email = template.render(first_name = client_first_name, pet_name = client_pet_name)
    plaintext_email = 'Hello {0}, \nPlease remember to pickup {1} by 7pm!'.format(client_first_name, client_pet_name)
    return html_email, plaintext_email, subject
}

function send_email(html_email, plaintext_email, subject, recipients)
{
    try:
        ses = boto3.client('ses')
        response = ses.send_email(
            Source=FROM_ADDRESS,
            Destination={
                'ToAddresses': recipients,
                'CcAddresses': [],
                'BccAddresses': []
            },
            Message={
                'Subject': {
                    'Data': subject,
                },
                'Body': {
                    'Text': {
                        'Data': plaintext_email
                    },
                    'Html': {
                        'Data': html_email
                    }
                }
            },
            ReplyToAddresses=[
                REPLY_TO_ADDRESS,
            ]
        )
    except Exception as e:
        print 'Failed to send message via SES'
        print e.message
        raise e
}

exports.handler = function(event,context)
{
	console.log('In handler');
    var event_trigger = event['resources'][0]
    console.log('event triggered by ' + event_trigger);
    switch(event_trigger)
	{
		case 'come_to_work':
			for(var i=0; i < EMPLOYEES.length; i++)
			{
				var email = {};
				email['address'] = EMPLOYEES[i][0];
				email['first_name'] = EMPLOYEES[i][1]
				var mail = render_come_to_work_template(email['first_name'])
				send_email(mail.html_email, mail.plaintext_email, mail.subject, email)
			}            
			break;
        case 'daily_tasks':		
		for(var i=0; i < EMPLOYEES.length; i++)
			{
				var email = {};
				email['address'] = EMPLOYEES[i][0];
				email['first_name'] = EMPLOYEES[i][1]
				var mail = render_daily_tasks_template();
				send_email(mail.html_email, mail.plaintext_email, mail.subject, email);
			}        
			break;
		case 'pickup':
        for(var i=0; i < EMPLOYEES.length; i++)
			{
            var email = {}
            email['address'] = client[i][0];
            email['first_name'] = client[i][1]
            email['pet_name'] = client[i][3]
            html_email, plaintext_email, subject = render_pickup_template(email['first_name'], email['pet_name'])
            send_email(html_email, plaintext_email, subject, email)
			}
			break;
		default:
			return 'No template for this trigger!'
	}
        

}
