var axios = require('axios');
var yargs = require('yargs');
var express = require('express');

var port = process.env.PORT || 3000;
var app = express();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

var requestConfig = {
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
};

//criteria:
//if amount is negative, it's spend regardless of account
//if amount is positive, it's income regardless of account
app.get('/summary', (req, res) => {
  axios.request(requestConfig)
    .then((response) => {
      var data = response.data;
      var finalJSON = {
        average: {
          spent: 0,
          income: 0
        }
      };

      data.transactions.forEach((transaction, i) => {
        var dateStr = getDateProp(transaction);
        var amount = transaction.amount;

        //add amount to average income or average spent
        if (amount > 0) {
          finalJSON.average.income += amount;
        } else {
          finalJSON.average.spent += amount;
        }

        //add amount to month's totals
        if (finalJSON[dateStr]) {
          if (amount > 0) {
            finalJSON[dateStr].income += amount;
          } else {
            finalJSON[dateStr].spent += amount;
          }
        } else {
          finalJSON[dateStr] = {
            spent: 0,
            income: 0
          };

          if (amount > 0) {
            finalJSON[dateStr].income = amount;
          } else {
            finalJSON[dateStr].spent = amount;
          }
        }
      });

      calcAverage(finalJSON);
      amntsToStrings(finalJSON);
      finalJSON = JSON.stringify(finalJSON);
      res.send(finalJSON);
    })
    .catch((error) => {
      if (error) {
        console.log(error);
        res.send(error);
      }
    });
});

app.get('/ignore-donuts', (req, res) => {

});

app.get('/ignore-cc-payments', (req, res) => {

});

app.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

// Determine how much money the user spends and makes in each of the months for which we have data, and in the "average" month. What "average" means is up to you.

// Output these numbers in the following format (and optionally in a more pretty format, if you see fit)

//Spent criteria


//Income criteria
  //amount positive and account-id val is "nonce:comfy-checking/hdhehe"

// {"2014-10": {"spent": "$200.00", "income": "$500.00"},
//
// "2014-11": {"spent": "$1510.05", "income": "$1000.00"},
//
// ...
//
// "2015-04": {"spent": "$300.00", "income": "$500.00"},
//
// "average": {"spent": "$750.00", "income": "$950.00"}}

// CC CARD PAYMENT EXAMPLE
// {
//   "amount": 5194500,
//   "is-pending": false,
//   "aggregation-time": 1417582920000,
//   "account-id": "nonce:comfy-cc/hdhehe",
//   "clear-date": 1417643220000,
//   "transaction-id": "1417643220000",
//   "raw-merchant": "CREDIT CARD PAYMENT",
//   "categorization": "Unknown",
//   "merchant": "Credit Card Payment",
//   "transaction-time": "2014-12-03T05:02:00.000Z"
// },
// {
//   "amount": -5194500,
//   "is-pending": false,
//   "aggregation-time": 1417592640000,
//   "account-id": "nonce:comfy-checking/hdhehe",
//   "clear-date": 1417724460000,
//   "transaction-id": "1417724460000",
//   "raw-merchant": "CC PAYMENT",
//   "categorization": "Unknown",
//   "merchant": "CC Payment",
//   "transaction-time": "2014-12-03T07:44:00.000Z"
// },

//INCOME EXAMPLE
// {
//   "amount": 17081500,
//   "is-pending": false,
//   "aggregation-time": 1412859120000,
//   "account-id": "nonce:comfy-checking/hdhehe",
//   "clear-date": 1412909700000,
//   "transaction-id": "1412909700000",
//   "raw-merchant": "ZENPAYROLL",
//   "categorization": "Unknown",
//   "merchant": "Zenpayroll",
//   "transaction-time": "2014-10-09T12:52:00.000Z"
// }

//NEGATIVE MONEY FROM CHECKING NOT CC PAYMENT
// {
//   "amount": -860800,
//   "is-pending": false,
//   "aggregation-time": 1412764860000,
//   "account-id": "nonce:comfy-checking/hdhehe",
//   "clear-date": 1412948520000,
//   "transaction-id": "1412948520000",
//   "raw-merchant": "AT&T BILL PAYMENT",
//   "categorization": "Unknown",
//   "merchant": "At&T Bill Payment",
//   "transaction-time": "2014-10-08T10:41:00.000Z"
// },

//HELPER FUNCTIONS
function amntsToStrings(obj) {
  for (var prop in obj) {
    obj[prop].spent = `$${Math.round(obj[prop].spent / -100)}.00`;
    obj[prop].income = `$${Math.round(obj[prop].income / 100)}.00`;
  }
}

function getDateProp(transaction) {
  var transactionTime = transaction['transaction-time'];
  var endIndexOfDate = transactionTime.lastIndexOf('-');
  return transactionTime.slice(0, endIndexOfDate);
}

function calcAverage(obj) {
  var monthsCount = Object.keys(obj).length - 1;
  obj.average.spent = obj.average.spent / monthsCount;
  obj.average.income = obj.average.income / monthsCount;
}
