var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
    	res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

//Adding an API endpoint
app.post('/webhook/', function (req, res) {
	messaging_events = req.body.entry[0].messaging
	for (i = 0; i < messaging_events.length; i++) {
		event = req.body.entry[0].messaging[i]
		sender = event.sender.id
		//Checking for attachments
   		if (event.message.attachments) {
    		//Checking if there are any image attachments 
    		if(event.message.attachments[0].type === "image"){
     			var imageURL = event.message.attachments[0].payload.url;
     			analyzePicture(sender, imageURL);
    		}
   		}
   		//used for outputting text right now
		else if (event.message && event.message.text) {
			text = event.message.text
			sendTextMessage(sender, text + " I have poems for you") //text.substring(0, 200))
		}
	}
	res.sendStatus(200)
})
var token = "EAAH4wv1b3eIBAKQzcA9ZAafSz6UJBi5FdNnMPPsKPBmEVSH9ijU9tXZAPc6aqsHrXRsmZBoZAbuc7jIkPnVkL93AseFSqj0SfE6edxzEhhvNHtemJaduleqPkXtLg7iJ5O0v5dAOBTE0QmfQNDt93KkWzMUpDKZAr19ZAx6r3XdgZDZD"

//Adding function to echo back messages
function sendTextMessage(sender, text) {
	messageData = {
		text: text
	}
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}}, 
		function(error, response, body) {
			if (error) {
				console.log('Error sending messages: ', error)
			} else if (response.body.error) {
				console.log('Error: ', response.body.error)
			}
	})
}

function analyzePicture(sender, url) {
	//Require the client
	var Clarifai = require('clarifai');

	// instantiate a new Clarifai app passing in your clientId and clientSecret
	var app = new Clarifai.App(
		'4-xM5EbfrWiqnMl6GBd7GYAj7dsT1q56sc-y_qu_',
		'_mwAiy80BDc5vlifDVArYwMKEcOlcvT1aCOe9zqH'
		);
	// predict the contents of an image by passing in a url
	app.models.predict(Clarifai.GENERAL_MODEL, url).then(
  	function(response) {
  		for (var i = 0; i < 5; i++) {
  			if (response.outputs[0].data.concepts[i].name != "no person") {
				sendTextMessage(sender, "I see a " + response.outputs[0].data.concepts[i].name); //.outputs[0].data
  			}
  		}
  	},
  	function(err) {
    	console.error(err);
  	}
	);
}

