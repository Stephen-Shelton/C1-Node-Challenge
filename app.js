var axios = require('axios');
var yargs = require('yargs');
var express = require('express');

var port = process.env.PORT || 3000;
var app = express();

app.get('/', (req, res) => {
  axios.request({
    url: 'https://2016.api.levelmoney.com/api/v2/core/get-all-transactions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    data: {
      "args": {
        "uid": 1110590645,
        "token": "A179B7FA6F856285D72615219B9EE192",
        "api-token": "AppTokenForInterview",
        "json-strict-mode": false,
        "json-verbose-response": false
      }
    }
  })
    .then((response) => {
      var data = response.data;

      var sampleTransactionTime = data.transactions[0]['transaction-time'];
      var index = sampleTransactionTime.lastIndexOf('-');
      var newDateStr = sampleTransactionTime.slice(0, index);
      console.log(newDateStr);
      console.log(sampleTransactionTime);

      res.send(data);

    })
    .catch((error) => {
      if (error) {
        console.log(error);
        res.send(error);
      }
    });
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

// Determine how much money the user spends and makes in each of the months for which we have data, and in the "average" month. What "average" means is up to you.

// Output these numbers in the following format (and optionally in a more pretty format, if you see fit)

// {"2014-10": {"spent": "$200.00", "income": "$500.00"},
//
// "2014-11": {"spent": "$1510.05", "income": "$1000.00"},
//
// ...
//
// "2015-04": {"spent": "$300.00", "income": "$500.00"},
//
// "average": {"spent": "$750.00", "income": "$950.00"}}
