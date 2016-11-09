/**
 * This simple sample has no external dependencies or session management, and shows the most basic
 * example of how to create a Lambda function for handling Alexa Skill requests.
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Space Geek for a space fact"
 *  Alexa: "Here's your space fact: ..."
 */
var APP_ID = undefined; //OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var AlexaSkill = require('./AlexaSkill');
var AWS = require("aws-sdk");
var db = require('./database');
// var dynamodb = new AWS.DynamoDB();
var dynamodb = new AWS.DynamoDB.DocumentClient();
var Fact = function () {
  AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Fact.prototype = Object.create(AlexaSkill.prototype);
Fact.prototype.constructor = Fact;
Fact.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
  // any initialization logic goes here //console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
};
Fact.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
  evalStatement(response); //console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– //

/**
 * Overridden to show that a subclass can override this function to teardown session state.
 */
Fact.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
  // any cleanup logic goes here
};

Fact.prototype.intentHandlers = {
  "GetNewFactIntent": function (intent, session, response) {
    evalStatement(response, intent);
  },
  "AMAZON.HelpIntent": function (intent, session, response) {
    response.ask("You can say tell me a space fact, or, you can say exit... What can I help you with?", "What can I help you with?");
  },
  "AMAZON.StopIntent": function (intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  },
  "AMAZON.CancelIntent": function (intent, session, response) {
    var speechOutput = "Goodbye";
    response.tell(speechOutput);
  }
};

// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– //

function slotToCode(coinUtterance) {
  // converts utterance of coin into the quick find code of the coin.
  // "Bitcoin" -> "BTC"
  var code = 'BTC';
  switch (coinUtterance.toLowerCase()) {
    case 'us dollar':
      code = 'USD';
      break;
    case 'dollar':
      code = 'USD';
      break;
    case 'bitcoin':
      code = 'BTC';
      break;
    case 'coin':
      code = 'BTC';
      break;
    case 'litecoin':
      code = 'LTC';
      break;
    case 'ethereum':
      code = 'ETH';
      break;
    case 'ethereum classic':
      code = 'ETC';
      break;
    case 'monero':
      code = 'XMR';
      break;
    case 'quark':
      code = 'QRK';
      break;
    case 'vertcoin':
      code = 'VTC';
      break;
    case 'primecoin':
      code = 'XPM';
      break;
    default:
      code = 'BTC';
      break;
  }
  return code;
}

function orientation(response, prettyCoinA, prettyCoinB, price) {
  // price is for the prettyCoinB 
  // if the price is less than one 'cent' (1/100 : 0.01) then flip orientation
  if (price < 0.01) {
    response.tell('Let me rephrase it this way: One ' + prettyCoinB + ' is worth ' + (1/parseFloat(price)).toFixed(1) + ' ' + prettyCoinA + 's');
  } else {
    response.tell('One ' + prettyCoinA + ' is worth '  + parseFloat(price).toFixed(1) + ' ' + prettyCoinB + 's');
  }
}


function evalStatement(response, intent) {
  
  // // CREATE ITEM
  // var putDBItem = {
  //   TableName: 'cointrack_cache',
  //   Item: {
  //     prices: "BTC_USD",
  //     value: 710.01028,
  //     time: Date.now()
  //   }
  // }
  
  // var putDBCB = function (err, data) {
  //   response.tell("woohoo " + JSON.stringify(data) + ". error? " + JSON.stringify(err))
  // };




  // // GET ITEM
  // var getDBItem = {
  //   TableName : 'cointrack_cache',
  //   Key: {
  //      prices: "BTC_USD"
  //   }
  // }
  // var getDBCB = function (err, data) {
  //   response.tell("woohoo " + JSON.stringify(data) + ". error? " + JSON.stringify(err))
  // };

  // // dynamodb.put(putDBItem, putDBCB);
  // dynamodb.get(getDBItem, getDBCB);

  db.retrieve('BTC', 'USD')
    .then(entry => console.log('entry: ', entry))


  // var coinA = intent.slots.CoinA;
  // var coinB = intent.slots.CoinB;
  // console.log('+++slots:', coinA, coinB);
  
  // if (('value' in coinB) && ('value' in coinA)) { // A & B
  //   getCoinPrice(response, slotToCode(coinA.value), slotToCode(coinB.value));
  // } else if ('value' in coinB) { // only B
  //   getCoinPrice(response, slotToCode(coinB.value), 'USD');
  // } else if ('value' in coinA) { // only A
  //   getCoinPrice(response, slotToCode(coinA.value), 'USD');
  // } else { // None
  //   response.tell("This will be help: no coinB or coinA");
  // }
}


// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– //

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  // Create an instance of the SpaceGeek skill.
  var fact = new Fact();
  fact.execute(event, context);
};

