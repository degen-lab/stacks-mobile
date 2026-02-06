const fs = require('fs');
const path = require('path');

// Load JSON file once
const jsonPath = path.join(__dirname, 'data', 'stackingTxId.json');
const txIds = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

module.exports = {
  loadTxId: function(context, events, done) {
    // Randomly select a txId (duplicates are possible, which is realistic)
    const randomIndex = Math.floor(Math.random() * txIds.length);
    context.vars.txId = txIds[randomIndex].txId;
    return done();
  }
};