var params = {
  Name: 'come_to_work', /* required */
  Description: 'come to work',
  EventPattern: '',
  RoleArn: '',
  ScheduleExpression: 'cron(0 12 ? * MON-FRI *)',
  State: ENABLED
};
cloudwatchevents.putRule(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
})