const fs = require('fs');
const path = require('path');

// Load JSON file once
const jsonPath = path.join(__dirname, 'data', 'stackingTxId.json');
const txIds = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Import Stacks transaction libraries for signing
let privateKeyToPublic, deserializeTransaction, serializeTransaction, TransactionSigner;
try {
  const stacksTransactions = require('@stacks/transactions');
  privateKeyToPublic = stacksTransactions.privateKeyToPublic;
  deserializeTransaction = stacksTransactions.deserializeTransaction;
  serializeTransaction = stacksTransactions.serializeTransaction;
  TransactionSigner = stacksTransactions.TransactionSigner;
} catch (e) {
  console.warn('@stacks/transactions not available, transaction signing will be disabled');
}

// Test accounts from submit-scores-loop.ts with addresses and private keys
// These will be used to create real transactions that can be broadcast
const testAccounts = [
  { address: 'STGHJT24QG2K5WSTEGCTX6T47312AZ0F9E3SE2T4', privateKey: '681837769284afd23d14099499524fce672d833e54e7c28eef25d62b7365207201' },
  { address: 'STVAEYDE5TW4C6MSGZY0ZFM2TZ0FAEWH7SC5V2TX', privateKey: '76f0e71dd6f489d35ebd70ce376031ba9522884f8623ae38042ec314167039e301' },
  { address: 'ST9ZQV0B9RBD81GADPN9ZJFA0CHANTTSEBC0YFAW', privateKey: 'a22ffb6f622e5c84f17c382c32d577fac73ac10c729c8db1846f4ea70400361901' },
  { address: 'ST3VM1808GG9ZKFVF4BTZ6WEGQDJ99BRMMB0NHHQ', privateKey: '23755eaac97490a80d588ea07c567785d9295280ebf6e71b6b82136f77915efa01' },
  { address: 'ST3PR8FN3EWBQZ9ZP74H23H5SVA911R089REB08XZ', privateKey: '9efda38b665b49a1edbdcb7bf27906f7ed4cb35a33491cc063fb58b2e5d94c0101' },
  { address: 'ST21JX79D3KRS2FCX9J43Z31MVMG28MTQJY8FE4YJ', privateKey: '418e28007db480d1de7b4210f56231a942e241e254f64fd2bc9d171f42f7d72001' },
  { address: 'ST2Z3TWNSKS5AFGCX9P0Y91541QW65VKE3E47Y1JF', privateKey: '9e979b88eb932dff4e8b713005a748cb68133680b6ebe5cd43b44317e500f33d01' },
  { address: 'ST3PX95XFAVNQ95QTDB94AZ0RYE2TQZ8TS0XEARZW', privateKey: 'c58fc4a522a9f9df2fed39d768d64046ddc2e34b55ccb46bc76c811bdd4925e001' },
  { address: 'STQHFDKDQDF9EAXW8GE851A5N4591RXVNQYR9VWF', privateKey: '138d4d781b48fd53d109b4e247208d1dd160c4d303c9b9ae8013bc9bd2556e8801' },
  { address: 'ST2SZH7EN48WB6M31FKCVEKBY1K3T2GNE91VKQM9C', privateKey: 'a00c30d6cf8f0a5bf02fb9b424810699d4daddd6d34ce33828e85484f23df95d01' },
  { address: 'ST1KQPWX7NVHFWNNPJ49MJNAN76ME3KZ7J6531GY7', privateKey: 'a87b8c82b8fa39fa050383bb0d322ecaee00f6e4c3168723bdf022b83281f93f01' },
  { address: 'ST3J968VFH5KCAC5FDH1K2W107Q72JCQ9MRP3FTX7', privateKey: 'fd0ace05a3c21f60748c0fb53505334e050725f55a320f8b0a8b2f273fc534eb01' },
  { address: 'ST9GB6DAG4HTH0ZSAF10YWVANKWAFVGWKB0S0340', privateKey: '3b119f61f73ede8fdc299f391ea5a7e4d08c996cf51ccb3cecf61e516a3d1c2001' },
  { address: 'ST5PV2VFNRZAVEDFYF3X334W4H8VDZ6Z78Q92GHA', privateKey: '55dc9b1771a4249ee891a2c5c449654c1aabd422c265345287237eeecdc0438201' },
  { address: 'STTBFP45G02TW7JCVTSJ1GR0403X76P1J05AAY7N', privateKey: '3cff0e8c9dc6a1899622cdbe7d764f83ac37a636ae1b89e8b1f4b91b1942c70501' },
  { address: 'ST25722PAD2YXQ8X2MPRNBJ1E7STZBD1HVMBEQ0RD', privateKey: 'e6be6b775d8f0d97cbbd7736c74bd3251268f0082edad14232da91770346b96d01' },
  { address: 'ST2CJXVMZKVZ8A1G7CG4P3WMD9TAV6671MXF9GYZJ', privateKey: 'a8b9ae1edb02eb5ae063cbb718bd6a778de50ee10171291fddb8505b985748e501' },
  { address: 'ST1QFJEPX5TE1XJM2DBCRWDS52YNGGSQT4Y8XCGGT', privateKey: 'd08fa104f8d32e4771d22c8745dfe99c3ffd4c4d85a448a84827411e8030e17801' },
  { address: 'ST2K99A2KXYRTA5FJ28M4XTNPCJTD2PWK65ZA2R9A', privateKey: 'e9996a0e05c6a6d72268c7163f5edc21b4d8206c29b7f0a64698cfd7534cb46401' },
  { address: 'STV7PXNG9T98ZHG088D4CRDK4QDW3B6T3VKBVAEJ', privateKey: '2b8e06e2bc5bb72353788e8aca94e58b0fdffb0dfc760bc79513c7e0e03b86d901' },
  { address: 'ST25F4HKRG6WJB95HH4E543ZEFCJTKTCFWERH0YQ4', privateKey: 'd3300b933a9711c4845a05f8571c791b39071909ef7372e38b45ac5a07f96b4501' },
  { address: 'ST06N64HBK4Z37P4J4JXR0BT5Y35690E9SXVH01F', privateKey: '30ad47d1c8b146be109cd1df97c39bc5a8b12dae724d366ad31e56424c3f141601' },
  { address: 'ST1845JZXE3BXFX89WYJHEH39A877Z4CQ4SRD7J5E', privateKey: '1c4267e48469d69847c71955cb281168d9e328435efdc0744684b3dd8b40aa6d01' },
  { address: 'ST25N0GH49NVD9JNS4WN5233NY2PXMJB3E332ST4A', privateKey: 'f669669c7dd00529ec200817f96a55bef44e7066fa8fc17ed7dacc9d39f835df01' },
  { address: 'ST230YRB0FNTXD3XRH60CYE7B4P7SFG4MF7SNAPW4', privateKey: 'a1f9afcf3dd3e7d4a42ea94aa4e78b426212789bcfc4804c767dd5b08eab5c4a01' },
  { address: 'STZZ6TT3F0RBJW4SPSV4XH9FM9DVN3WDE8DTVT07', privateKey: 'fc9656f80bcd0660d02ef0908f2aab445838f06fae6deb41732f56a4dafc17b501' },
  { address: 'ST1J6FN427Q8SB9NT045EBQ2MRWMEA7AYA4DQY8X6', privateKey: 'c5b894fa5626e4b4520732b0fb41bca2902c357eae7fab28be5e140edd412a4a01' },
  { address: 'ST14S5CW7GS7QMTFG7WTGSJ03RHW34ZKEKBE3NWZC', privateKey: '7ad47c34e23c224f0b7cc2a54268145e9685ab09a55d6b2dc4f4996084334ff301' },
  { address: 'STFDNA2CB762APYKAZKX4F2MJG00B67ZZAW4KFFD', privateKey: '9ac47a95531adc6b9d0645a1f54e7f6c373a786e4d38455108650185cf18b2bf01' },
  { address: 'ST347P4096GPTD3E88WTAF0TWPANSNA45TZGB7W3S', privateKey: '7617f16367c71837e9054d421703bb1d412f13f781a1644bdec0deaf1742a77b01' },
];

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
  },
  
  generateFakeTxId: function(context, events, done) {
    // Generate a fake txId for load testing (0x + 64 hex chars)
    // Format: 0x + 64 random hex characters
    const hexChars = '0123456789abcdef';
    let txId = '0x';
    for (let i = 0; i < 64; i++) {
      txId += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    context.vars.fakeTxId = txId;
    return done();
  },
  
  loadStacksAccount: function(context, events, done) {
    // Assign one account per virtual user (by userId) so the same address isn't
    // used by multiple users → avoids user (origin) nonce conflicts. With only
    // 30 accounts, keep total VUs ≤ 30 or add more accounts to avoid reuse.
    const userId = context.vars.userId != null ? Number(context.vars.userId) : 0;
    const index = Math.abs(userId) % testAccounts.length;
    const account = testAccounts[index];
    context.vars.stacksAddress = account.address;
    context.vars.privateKey = account.privateKey;
    
    // Derive public key from private key
    if (privateKeyToPublic) {
      try {
        const publicKey = privateKeyToPublic(account.privateKey);
        // Handle both string and Uint8Array return types
        if (typeof publicKey === 'string') {
          context.vars.publicKey = publicKey;
        } else {
          // Convert Uint8Array to hex string
          const bytes = publicKey instanceof Uint8Array ? publicKey : new Uint8Array(publicKey);
          const hexKey = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          context.vars.publicKey = hexKey;
        }
      } catch (e) {
        console.error('Error deriving public key:', e);
        return done(new Error('Failed to derive public key'));
      }
    } else {
      return done(new Error('@stacks/transactions not available'));
    }
    return done();
  },
  
  signTransaction: function(context, events, done) {
    // Sign the unsigned transaction using the private key
    if (!deserializeTransaction || !serializeTransaction || !TransactionSigner) {
      return done(new Error('Transaction signing libraries not available'));
    }
    
    const unsignedTx = context.vars.unsignedTransaction;
    const privateKey = context.vars.privateKey;
    
    if (!unsignedTx || !privateKey) {
      return done(new Error('Missing unsignedTransaction or privateKey'));
    }
    
    try {
      // Deserialize the transaction
      const tx = deserializeTransaction(unsignedTx);
      
      // Extract 32-byte private key from 66-char secret key (remove 01 suffix if present)
      const privateKeyHex = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      const keyHex = privateKeyHex.length === 66 ? privateKeyHex.slice(0, 64) : privateKeyHex;
      
      // Sign the transaction
      const signer = new TransactionSigner(tx);
      signer.signOrigin(keyHex);
      
      // Get the signed transaction
      const signedTx = signer.getTxInComplete();
      
      // Serialize the signed transaction
      const signedSerializedTx = serializeTransaction(signedTx);
      context.vars.signedTransaction = signedSerializedTx;
      
      return done();
    } catch (e) {
      console.error('Error signing transaction:', e);
      return done(new Error(`Failed to sign transaction: ${e.message}`));
    }
  },
  
  buildCreateTransactionBody: function(context, events, done) {
    // Body for /transaction/create (testing endpoint; no session/minigame)
    context.vars.createTransactionBody = {
      address: context.vars.stacksAddress,
      publicKey: context.vars.publicKey,
      score: Math.floor(Math.random() * 4000) + 1000,
      submissionType: 1, // 0 = Raffle, 1 = WeeklyContest
      isSponsored: true,
    };
    return done();
  },
  
  buildBroadcastBody: function(context, events, done) {
    // Build the broadcast request body ensuring submissionId is a number
    // Artillery may capture it as an object, so we need to ensure it's a number
    let submissionId = context.vars.submissionId;
    
    // Convert to number if it's not already
    if (typeof submissionId !== 'number') {
      // If it's an object, try to extract the value
      if (typeof submissionId === 'object' && submissionId !== null) {
        submissionId = submissionId.id || submissionId.value || submissionId;
      }
      // Convert to number
      submissionId = parseInt(submissionId, 10);
    }
    
    // Ensure we have a valid number
    if (isNaN(submissionId)) {
      return done(new Error(`Invalid submissionId: ${context.vars.submissionId}`));
    }
    
    context.vars.broadcastBody = {
      submissionId: submissionId,
      serializedTx: context.vars.signedTransaction,
    };
    return done();
  }
};