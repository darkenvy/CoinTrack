// { Item: { time: 1478468824386, value: 710.01028, prices: 'BTC_USD' }
var request = require('request');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB.DocumentClient();

// ---------------------- API ------------------------- //
function coinPriceAPI(coinA, coinB) {
  return new Promise((resolve, reject) => {
    // http://api.cryptocoincharts.info/tradingPair/BTC_USD
    var url = 'http://api.cryptocoincharts.info/tradingPair/' + coinA + '_' + coinB;
    var data = {};
    var cb = function(err, res, body) {
      var result = JSON.parse(body);
      var prettyCoinA = result.coin1,
          prettyCoinB = result.coin2,
          price = result.markets[0].price;
      console.log('coinPriceAPI', prettyCoinA, prettyCoinB, price);
      resolve([coinA, coinB, price]);
    };
    request.get(url, data, cb);
  })
}

// ------------- Database GET Call ----------------- //
function checkDatabase(coinA, coinB) {
  return new Promise((resolve, reject) => {
    var item = {
      TableName : 'cointrack_cache',
      Key: {
         prices: "BTC_USD"
      }
    }
    dynamodb.get(item, (err, data) => resolve(data) );
  })
}

// ----------------- Time Logic -------------------- //
function isExpired(entry) {
  // Simply returns it's current value (if not expired) or updates the database
  return new Promise((resolve, reject) => {
    if (Object.keys(entry).length == 0 || Date.now() - entry.Item.time > 300000) {
      console.log('+++ expired');
      console.log('then entry: ', entry);
      resolve([true, entry]);
    } else {
      console.log('--- not expired');
      console.log('then entry: ', entry);
      resolve([false, entry]);
    }
  })
}

// ------------- Database PUT Call ----------------- //
function updateEntry(expired, coinA, coinB, ent) {
  return new Promise((resolve, reject) => {
    console.log('inside updateEntry. expired = ', expired, ent);
    if (expired) {
      console.log('if yes');

      var update = (coinA, coinB, price) => {
        return new Promise((resolve, reject) => {
          var item = {
            TableName: 'cointrack_cache',
            Item: {
              prices: coinA + '_' + coinB,
              value: price,
              time: Date.now()
            }
          }
          dynamodb.put(item, (err, data) => resolve(item));
        })
      }

      // get API info, then update DB
      coinPriceAPI(coinA, coinB)
      .then(metadata => update(metadata[0], metadata[1], metadata[2]))
      .then(f => resolve(f))
    } else {
      // return with same data
      resolve(ent);
    }
  })

}

// -------------------- Main -------------------- //
var db = {
  retrieve: function(coinA, coinB) {

    return new Promise((resolve, reject) => {
      checkDatabase(coinA, coinB)
      .then(entry => isExpired(entry))
      .then(expiredData => resolve( 
        updateEntry(expiredData[0], coinA, coinB, expiredData[1]) 
      ))
    })

  }
};

module.exports = db;




