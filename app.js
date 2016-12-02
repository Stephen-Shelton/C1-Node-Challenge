var axios = require('axios');
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

app.get('/summary', (req, res) => {
  axios.request(requestConfig)
    .then((response) => {
      var json = assembleJSON(response.data, false, false);
      res.send(json);
    })
    .catch((error) => {
      if (error) {
        console.log(error);
        res.send(error);
      }
    });
});

app.get('/ignore-donuts', (req, res) => {
  axios.request(requestConfig)
    .then((response) => {
      var json = assembleJSON(response.data, true, false);
      res.send(json);
    })
    .catch((error) => {
      if (error) {
        console.log(error);
        res.send(error);
      }
    });
});

app.get('/ignore-cc-payments', (req, res) => {
  axios.request(requestConfig)
    .then((response) => {
      var json = assembleJSON(response.data, false, true);
      res.send(json);
    })
    .catch((error) => {
      if (error) {
        console.log(error);
        res.send(error);
      }
    });
});

app.get('/ignore-donuts-and-cc-payments', (req, res) => {
  axios.request(requestConfig)
    .then((response) => {
      var json = assembleJSON(response.data, true, true);
      res.send(json);
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

//HELPER FUNCTIONS
function amntsToStrings(obj) {
  for (var prop in obj) {
    if (prop !== 'ccPayments') {
      obj[prop].spent = `$${Math.round(obj[prop].spent / -100)}.00`;
      obj[prop].income = `$${Math.round(obj[prop].income / 100)}.00`;
    }
  }
}

function getDateProp(transaction) {
  var transactionTime = transaction['transaction-time'];
  var endIndexOfDate = transactionTime.lastIndexOf('-');
  return transactionTime.slice(0, endIndexOfDate);
}

function calcAverage(obj) {
  var monthsCount = (obj.ccPayments) ? Object.keys(obj).length - 2 : Object.keys(obj).length - 1;
  obj.average.spent = obj.average.spent / monthsCount;
  obj.average.income = obj.average.income / monthsCount;
}

function assembleJSON(data, ignoreDonuts, ignoreCC) {
  var finalJSON = {
    average: {
      spent: 0,
      income: 0
    },
    ccPayments: {}
  };

  data.transactions.forEach((transaction, i) => {
    //case to ignore donut transactions
    if (ignoreDonuts && (transaction.merchant === "Krispy Kreme Donuts" || transaction.merchant === "Dunkin #336784")) {
      return;
    }

    //case to ignore cc payment transactions
    if (ignoreCC && (transaction.merchant === "Credit Card Payment" || transaction.merchant === "CC Payment")) {
      var id = transaction["transaction-time"];
      finalJSON.ccPayments[id] = transaction;
      return;
    }

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

  if (!ignoreCC) {
    delete finalJSON.ccPayments;
  }

  calcAverage(finalJSON);
  amntsToStrings(finalJSON);
  return JSON.stringify(finalJSON);
}
