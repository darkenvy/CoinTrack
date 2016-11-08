var request = require('request');


var url = 'http://api.cryptocoincharts.info/tradingPair/BTC_USD';
var data = {};
var cb = function(err, res, body) {
  if (err) {console.log(err); return;}
  var result = JSON.parse(body);
  var prettyCoinA = result.coin1,
      prettyCoinB = result.coin2,
      price = parseInt(result.markets[0].price);
  console.log(prettyCoinA, prettyCoinB, price);
};

request.get(url, data, cb);