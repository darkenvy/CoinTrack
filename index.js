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


var slotToCode = {
  'us dollar': 'USD',
  'dollar': 'USD',
  'bitcoin': 'BTC',
  'coin': 'BTC',
  'litecoin': 'LTC',
  'ethereum': 'ETH',
  'ethereum classic': 'ETC',
  'monero': 'XMR',
  'quark': 'QRK',
  'vertcoin': 'VTC',
  'primecoin': 'XPM'
}

var codeToSlot = {
  'USD': 'dollar',
  'BTC': 'bitcoin',
  'LTC': 'litecoin',
  'ETH': 'ethereum',
  'ETC': 'ethereum classic',
  'XMR': 'monero',
  'QRK': 'quark',
  'VTC': 'vertcoin',
  'XPM': 'primecoin'
}

function prettifyNumber(number) {
  if (number < 1) {
    return parseFloat(number).toFixed(3);
  } else if (number < 10) {
    return parseFloat(number).toFixed(2);
  } else if (number < 500) {
    return parseFloat(number).toFixed(1);
  } else if (number >= 500) {
    return parseInt(number);
  }
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
  var coinA = intent.slots.CoinA;
  var coinB = intent.slots.CoinB;
  var prefixUtterence = '';
  console.log('+++slots:', coinA, coinB);

  // Verify each coin is declared
  if (('value' in coinB) && ('value' in coinA)) { // A & B
    coinA = slotToCode[coinA.value];
    coinB = slotToCode[coinB.value];
  } else if ('value' in coinB) { // only B
    coinA = slotToCode[coinB.value];
    coinB = 'USD';
  } else if ('value' in coinA) { // only A
    coinA = slotToCode[coinA.value];
    coinB = 'USD';
  } else { // None
    coinA = 'BTC'
    coinB = 'USD';
    prefixUtterence = 'Did you mean Bitcoin to US Dollars? ';
  }
  // Failsafe to make sure coinA and coinB is not undefined.
  coinA === undefined ? coinA = 'BTC' : false;
  coinB === undefined ? coinA = 'USD' : false;

  // Get prices from database and/or API. It is abstracted.
  db.retrieve(coinA, coinB)
  .then(entry => {
    var split = entry.Item.prices.split('_');
    var prettyCoinA = codeToSlot[split[0]];
    var prettyCoinB = codeToSlot[split[1]];
    var prettyNumber = prettifyNumber(entry.Item.value);
    var phrase = 'The price of one ' + prettyCoinA + 
                 ' is ' + prettyNumber + 
                 ' ' + prettyCoinB + 's';
    response.tell(phrase);
  })

}


// ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– //

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
  // Create an instance of the SpaceGeek skill.
  var fact = new Fact();
  fact.execute(event, context);
};






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