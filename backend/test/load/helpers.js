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
  },
  
  extractTokenOutId: function(context, events, done) {
    // Extract first tokenOutId from possible pairs response
    // Response structure: { "token-xrp": [...], "token-abc": [...] }
    const possiblePairs = context.vars.possiblePairs;
    if (possiblePairs && typeof possiblePairs === 'object') {
      const keys = Object.keys(possiblePairs);
      if (keys.length > 0) {
        context.vars.tokenOutId = keys[0]; // Get first available token
      }
    }
    return done();
  }
};