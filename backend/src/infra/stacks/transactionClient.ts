import {
  broadcastTransaction,
  bufferCV,
  BufferCV,
  ClarityType,
  cvToValue,
  deserializeTransaction,
  fetchCallReadOnlyFunction,
  fetchNonce,
  ListCV,
  listCV,
  makeContractCall,
  makeUnsignedContractCall,
  PostConditionMode,
  principalCV,
  serializeTransaction,
  sponsorTransaction,
  tupleCV,
  TupleCV,
  TxBroadcastResult,
  uintCV,
} from '@stacks/transactions';
import { TransactionClientPort } from '../../application/ports/transactionClient';
import { createNetwork, StacksNetwork } from '@stacks/network';
import {
  ADMIN_ADDRESS,
  ADMIN_PRIVATE_KEY,
  GAME_CONTRACT_ADDRESS,
  GOLD_TIER_USTX_BONUS,
  SEND_REWARDS_CONTRACT_ADDRESS,
  STACKS_NETWORK,
} from '../../shared/constants';
import { ContractFunctions } from '../helpers/types';
import { logger } from '../../api/helpers/logger';
import { StxTransactionData } from '../../shared/types';

// Extended type for broadcast transaction response that may include error fields
type BroadcastResponse = TxBroadcastResult & {
  error?: string;
  reason?: string;
  reason_data?: {
    actual?: number;
    expected?: number;
    is_origin?: boolean;
    principal?: string;
  };
};

// Helper function to ensure dynamic import stays dynamic (not compiled to require)
// This prevents TypeScript from converting await import() to require() in CommonJS
function dynamicImport(moduleSpecifier: string) {
  // Using Function constructor ensures the import is truly dynamic
  // and won't be statically analyzed/optimized by TypeScript
  return new Function('specifier', 'return import(specifier)')(moduleSpecifier);
}

export class TransactionClient implements TransactionClientPort {
  private network: StacksNetwork;
  private sponsorNonce: number | null = null;
  private nonceLock: Promise<void> = Promise.resolve();

  constructor() {
    this.network =
      STACKS_NETWORK === 'mainnet'
        ? createNetwork('mainnet')
        : STACKS_NETWORK === 'testnet'
          ? createNetwork('testnet')
          : createNetwork('devnet');
  }
  async fetchPoxCycleData(): Promise<{ cycleId: number }> {
    const url = `${this.network.client.baseUrl}/v2/pox`;

    const result = await fetch(url);

    if (!result.ok) {
      logger.error({
        msg: 'Failed to fetch pox data',
      });
      throw new Error('Failed to fetch pox data');
    }
    const data = await result.json();
    const cycleId = data.current_cycle.id;
    return {
      cycleId,
    };
  }
  async broadcastTransaction(serializedTx: string): Promise<TxBroadcastResult> {
    const transaction = deserializeTransaction(serializedTx);
    const result = await broadcastTransaction({
      transaction,
      network: this.network,
    });
    logger.info({
      msg: 'Transaction broadcasted',
      result,
    });
    return result;
  }

  /**
   * Initialize sponsor nonce from network
   */
  private async initializeSponsorNonce(): Promise<void> {
    if (this.sponsorNonce !== null) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.nonceLock = this.nonceLock.then(async () => {
        if (this.sponsorNonce === null) {
          logger.info({
            msg: 'Initializing sponsor nonce from network',
          });
          const fetchedNonce = await fetchNonce({
            address: ADMIN_ADDRESS,
            network: this.network,
          });
          this.sponsorNonce = Number(fetchedNonce);
          logger.info({
            msg: 'Sponsor nonce initialized',
            nonce: this.sponsorNonce,
          });
        }
        resolve();
      });
    });
  }

  /**
   * Get the next sponsor nonce (increments after each use)
   */
  private async getNextSponsorNonce(): Promise<number> {
    await this.initializeSponsorNonce();

    return new Promise<number>((resolve) => {
      this.nonceLock = this.nonceLock.then(() => {
        if (this.sponsorNonce === null) {
          throw new Error('Sponsor nonce not initialized');
        }
        const currentNonce = this.sponsorNonce;
        this.sponsorNonce = this.sponsorNonce + 1;
        logger.info({
          msg: 'Sponsor nonce obtained and incremented',
          nonce: currentNonce,
          nextNonce: this.sponsorNonce,
        });
        resolve(currentNonce);
      });
    });
  }

  /**
   * Refetch sponsor nonce from network (used on BadNonce errors)
   */
  private async refetchSponsorNonce(): Promise<number> {
    logger.info({
      msg: 'Refetching sponsor nonce from network',
    });
    const fetchedNonce = await fetchNonce({
      address: ADMIN_ADDRESS,
      network: this.network,
    });
    this.sponsorNonce = Number(fetchedNonce);
    logger.info({
      msg: 'Sponsor nonce refetched',
      nonce: this.sponsorNonce,
    });
    return this.sponsorNonce;
  }

  async headToNextTournament(): Promise<string> {
    logger.info({
      msg: 'Heading to next tournament',
    });
    const [contractAddress, contractName] = GAME_CONTRACT_ADDRESS.split('.');
    const txOptions = {
      contractAddress,
      contractName,
      functionName: ContractFunctions.startTournament,
      functionArgs: [],
      network: this.network,
      senderKey: ADMIN_PRIVATE_KEY,
      postConditionMode: PostConditionMode.Allow, // Allow contract to transfer STX
    };
    const transaction = await makeContractCall(txOptions);
    const result = await broadcastTransaction({
      transaction,
      network: this.network,
    });

    if (!result.txid) {
      logger.error({
        msg: 'Transaction failed to broadcast',
        result,
      });
      throw new Error(
        'Transaction failed to broadcast: No transaction ID returned',
      );
    }

    logger.info({
      msg: 'Head to next tournament transaction broadcasted',
      txId: result.txid,
    });

    // Don't check status immediately - transaction might not be indexed yet
    // The worker will check status later if needed
    return result.txid;
  }

  async distributeRewards(addresses: string[]): Promise<string> {
    logger.info({
      msg: 'Distributing rewards to addresses',
      length: addresses.length,
      addresses,
    });

    // Check admin balance before attempting distribution
    const adminBalance = await this.getAdminBalance();
    const totalRequired =
      BigInt(GOLD_TIER_USTX_BONUS) * BigInt(addresses.length);
    const adminBalanceSTX = Number(adminBalance) / 1000000;
    const totalRequiredSTX = Number(totalRequired) / 1000000;

    logger.info({
      msg: 'Admin balance check',
      adminBalance: adminBalance.toString(),
      adminBalanceSTX,
      totalRequired: totalRequired.toString(),
      totalRequiredSTX,
      addressesCount: addresses.length,
      rewardPerAddress: GOLD_TIER_USTX_BONUS,
    });

    if (adminBalance < totalRequired) {
      throw new Error(
        `Insufficient balance: Admin has ${adminBalanceSTX} STX but needs ${totalRequiredSTX} STX to distribute rewards to ${addresses.length} addresses`,
      );
    }

    const [contractAddress, contractName] =
      SEND_REWARDS_CONTRACT_ADDRESS.split('.');
    const recipients: ListCV<TupleCV> = listCV(
      addresses.map((address) => {
        return tupleCV({
          to: principalCV(address),
          ustx: uintCV(GOLD_TIER_USTX_BONUS),
          memo: bufferCV(Buffer.from('')),
        });
      }),
    );
    logger.info({
      msg: 'Sending many rewards',
      recipientsCount: addresses.length,
      contractAddress,
      contractName,
    });
    const txOptions = {
      contractAddress,
      contractName,
      functionName: ContractFunctions.sendMany,
      functionArgs: [recipients],
      network: this.network,
      senderKey: ADMIN_PRIVATE_KEY,
      postConditionMode: PostConditionMode.Allow, // Allow contract to transfer STX
    };
    const transaction = await makeContractCall(txOptions);
    const result: TxBroadcastResult = await broadcastTransaction({
      transaction,
      network: this.network,
    });

    if (!result.txid) {
      logger.error({
        msg: 'Transaction failed to broadcast',
        result,
        addressesCount: addresses.length,
      });
      throw new Error(
        'Transaction failed to broadcast: No transaction ID returned',
      );
    }

    logger.info({
      msg: 'Rewards distribution transaction broadcasted',
      txId: result.txid,
      addressesCount: addresses.length,
      totalAmountSTX: totalRequiredSTX,
    });

    // Don't check status immediately - transaction might not be indexed yet
    // The worker will check status later when waiting for anchoring
    return result.txid;
  }
  private getRawPrivateKey(privateKey: string): string {
    if (privateKey.length === 66 && privateKey.endsWith('01')) {
      return privateKey.slice(0, 64);
    }
    if (privateKey.length === 64 && /^[0-9a-fA-F]+$/.test(privateKey)) {
      return privateKey;
    }
    if (privateKey.startsWith('xprvgetRawPrivateKey')) {
      throw new Error(
        'ADMIN_PRIVATE_KEY is in xprv format. Please provide the raw 32-byte hex private key (64 hex characters) that corresponds to ADMIN_ADDRESS.',
      );
    }
    return privateKey;
  }

  /**
   * Broadcast a transaction with automatic sponsor nonce management
   */
  async broadcastSponsoredTransaction(serializedTx: string): Promise<string> {
    const transaction = deserializeTransaction(serializedTx);

    // Get next nonce (sequential increment)
    const sponsorNonce = await this.getNextSponsorNonce();

    logger.info({
      msg: 'Sponsoring transaction with sequential nonce',
      network: this.network.client.baseUrl,
      sponsorNonce,
    });

    const sponsoredTx = await sponsorTransaction({
      transaction: transaction,
      sponsorPrivateKey: ADMIN_PRIVATE_KEY,
      sponsorNonce: sponsorNonce,
      network: this.network,
      fee: 1000, // 0.001 STX = 1000 microSTX
    });

    logger.info({
      msg: 'Transaction sponsored, broadcasting to network',
      network: this.network.client.baseUrl,
    });

    const response = (await broadcastTransaction({
      transaction: sponsoredTx,
      network: this.network,
    })) as BroadcastResponse;

    logger.info({
      msg: 'Broadcast transaction response received',
      response: {
        txid: response.txid,
        error: response.error,
        reason: response.reason,
        fullResponse: JSON.stringify(response),
      },
    });

    if (!response || !response.txid) {
      logger.error({
        msg: 'Broadcast transaction failed - no txid in response',
        response: JSON.stringify(response),
      });
      throw new Error(
        `Transaction broadcast failed: No txid in response. Response: ${JSON.stringify(response)}`,
      );
    }

    // If transaction was rejected, handle BadNonce by refetching nonce
    if (response.error) {
      const errorReason = response.reason || 'Unknown reason';

      // If BadNonce error, refetch nonce from network and retry once
      if (errorReason === 'BadNonce') {
        logger.warn({
          msg: 'BadNonce error detected, refetching nonce from network',
          txid: response.txid,
          currentNonce: this.sponsorNonce,
          errorData: response.reason_data,
        });

        // Refetch nonce from network - this gives us the current nonce on blockchain
        const fetchedNonce = await this.refetchSponsorNonce();

        // Use the fetched nonce directly (don't increment, as it's already the next nonce)
        // Update our tracking to match
        this.sponsorNonce = fetchedNonce;

        logger.info({
          msg: 'Retrying transaction with corrected nonce from network',
          txid: response.txid,
          correctedNonce: fetchedNonce,
        });

        // Retry with corrected nonce
        const retrySponsoredTx = await sponsorTransaction({
          transaction: transaction,
          sponsorPrivateKey: ADMIN_PRIVATE_KEY,
          sponsorNonce: fetchedNonce,
          network: this.network,
          fee: 1000,
        });

        // Increment our tracking after successful sponsorship
        this.sponsorNonce = fetchedNonce + 1;

        const retryResponse = (await broadcastTransaction({
          transaction: retrySponsoredTx,
          network: this.network,
        })) as BroadcastResponse;

        if (!retryResponse || !retryResponse.txid) {
          logger.error({
            msg: 'Retry transaction broadcast failed - no txid in response',
            response: JSON.stringify(retryResponse),
          });
          throw new Error(
            `Transaction broadcast failed after retry: No txid in response. Response: ${JSON.stringify(retryResponse)}`,
          );
        }

        if (retryResponse.error) {
          const retryErrorReason = retryResponse.reason || 'Unknown reason';
          logger.error({
            msg: 'Retry transaction broadcast rejected by network',
            txid: retryResponse.txid,
            error: retryResponse.error,
            reason: retryErrorReason,
            fullResponse: JSON.stringify(retryResponse),
          });
          throw new Error(
            `Transaction broadcast rejected after retry: ${retryErrorReason}. TxId: ${retryResponse.txid}`,
          );
        }

        logger.info({
          msg: 'Transaction broadcast successful after nonce correction',
          txid: retryResponse.txid,
          correctedNonce: fetchedNonce,
          nextNonce: this.sponsorNonce,
        });

        return retryResponse.txid;
      }

      // For other errors, throw immediately
      logger.error({
        msg: 'Transaction broadcast rejected by network',
        txid: response.txid,
        error: response.error,
        reason: errorReason,
        fullResponse: JSON.stringify(response),
      });
      throw new Error(
        `Transaction broadcast rejected: ${errorReason}. TxId: ${response.txid}`,
      );
    }

    logger.info({
      msg: 'Transaction broadcasted successfully',
      txid: response.txid,
      network: this.network.client.baseUrl,
    });

    return response.txid;
  }

  async createTournamentUnsignedTransaction(
    address: string,
    publicKey: string,
    score: number,
    sponsored: boolean,
  ): Promise<string> {
    const tournamentId = await this.getTournamentId();
    const userNonce = await this.getUserNonce(address, tournamentId);
    const messageHash = await this.getContractMessageHash(
      address,
      tournamentId,
      score,
      userNonce,
    );
    const signature = await this.createSignature(messageHash);

    const [contractAddress, contractName] = GAME_CONTRACT_ADDRESS.split('.');
    const txOptions = {
      contractAddress,
      contractName,
      functionName: ContractFunctions.submitScore,
      functionArgs: [
        uintCV(tournamentId),
        uintCV(score),
        uintCV(userNonce),
        bufferCV(signature),
      ],

      publicKey: publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey,
      network: this.network,
      sponsored,
    };

    const unsignedTx = await makeUnsignedContractCall(txOptions);
    return serializeTransaction(unsignedTx);
  }

  private async getUserNonce(
    address: string,
    tournamentId: number,
  ): Promise<number> {
    const [contractAddress, contractName] = GAME_CONTRACT_ADDRESS.split('.');
    const result = await fetchCallReadOnlyFunction({
      contractName,
      contractAddress,
      functionName: ContractFunctions.getUserNonce,
      functionArgs: [principalCV(address), uintCV(tournamentId)],
      senderAddress: ADMIN_ADDRESS,
      network: this.network,
    });
    return Number(cvToValue(result)) + 1;
  }

  async getTournamentId(): Promise<number> {
    const [contractAddress, contractName] = GAME_CONTRACT_ADDRESS.split('.');
    const result = await fetchCallReadOnlyFunction({
      contractName,
      contractAddress,
      functionName: ContractFunctions.getTournamentId,
      functionArgs: [],
      senderAddress: ADMIN_ADDRESS,
      network: this.network,
    });
    return Number(cvToValue(result));
  }

  private async getContractMessageHash(
    address: string,
    tournamentId: number,
    score: number,
    nonce: number,
  ): Promise<Uint8Array> {
    const [contractAddress, contractName] = GAME_CONTRACT_ADDRESS.split('.');
    const result = await fetchCallReadOnlyFunction({
      contractName,
      contractAddress,
      functionName: ContractFunctions.makeMessageHash,
      functionArgs: [
        principalCV(address),
        uintCV(tournamentId),
        uintCV(score),
        uintCV(nonce),
      ],
      senderAddress: ADMIN_ADDRESS,
      network: this.network,
    });

    if (result.type === ClarityType.Buffer) {
      const { hexToBytes } = await dynamicImport('@noble/hashes/utils.js');
      const buf = (result as BufferCV).value;
      if (typeof buf === 'string') {
        return hexToBytes(buf.replace(/^0x/, ''));
      }
      return buf;
    }
    throw new Error('Failed to get message hash from contract');
  }

  private async createSignature(messageHash: Uint8Array): Promise<Uint8Array> {
    const { signAsync } = await dynamicImport('@noble/secp256k1');
    const { hexToBytes } = await dynamicImport('@noble/hashes/utils.js');

    const rawPrivateKey = this.getRawPrivateKey(ADMIN_PRIVATE_KEY);

    const privateKeyHex = rawPrivateKey.startsWith('0x')
      ? rawPrivateKey.slice(2)
      : rawPrivateKey;

    if (privateKeyHex.length !== 64) {
      throw new Error(
        `Private key must be 32 bytes (64 hex chars), got ${privateKeyHex.length} hex characters`,
      );
    }

    const privateKeyBytes = hexToBytes(privateKeyHex);
    if (!(privateKeyBytes instanceof Uint8Array)) {
      throw new Error(
        'Private key conversion failed: hexToBytes did not return Uint8Array',
      );
    }
    if (privateKeyBytes.length !== 32) {
      throw new Error(
        `Private key must be 32 bytes (64 hex chars), got ${privateKeyBytes.length} bytes`,
      );
    }
    const signature = (await signAsync(messageHash, privateKeyBytes, {
      lowS: true,
    })) as unknown as { r: bigint; s: bigint; recovery: number };
    const recoveryId = signature.recovery;
    const r = signature.r.toString(16).padStart(64, '0');
    const s = signature.s.toString(16).padStart(64, '0');
    const v = recoveryId.toString(16).padStart(2, '0');

    return hexToBytes(r + s + v);
  }

  async fetchStackingTransactionData(
    txId: string,
  ): Promise<StxTransactionData> {
    const url = `${this.network.client.baseUrl}/extended/v1/tx/${txId}`;
    logger.info({
      msg: 'Fetching transaction status',
      txId,
      url,
    });

    const response = await fetch(url);
    if (!response.ok) {
      logger.error({
        msg: 'Failed to fetch transaction status',
        txId,
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error('Error: failed to fetch transaction data');
    }

    const data = await response.json();
    logger.info({
      msg: 'Transaction status fetched',
      txId,
      status: data.tx_status || data.status,
      fullResponse: JSON.stringify(data),
    });

    const isSuccess = data.tx_status === 'success' || data.status === 'success';
    if (!isSuccess) {
      logger.warn({
        msg: 'Transaction not in success status',
        txId,
        status: data.tx_status || data.status,
        error: data.tx_result || data.error,
      });
    }

    // Parse from smart contract log event repr (delegate-stx always has one log event)
    const scLogEvent = data.events?.[0];
    if (!scLogEvent?.contract_log?.value?.repr) {
      throw new Error(
        'Error: smart contract log event not found in transaction',
      );
    }

    const repr = scLogEvent.contract_log.value.repr;

    // Helper to extract uint value: "u12345" -> 12345
    const extractUint = (pattern: RegExp): number | null => {
      const match = repr.match(pattern);
      if (match && match[1] !== 'none') {
        return Number(match[1]);
      }
      return null;
    };

    // Helper to extract optional uint: "none" or "u12345"
    const extractOptionalUint = (pattern: RegExp): number | null => {
      const match = repr.match(pattern);
      if (match) {
        if (match[1] === 'none') return null;
        // Handle "(some uXXX)" format - extract just the number
        const numMatch = match[1].match(/u(\d+)/);
        return numMatch ? Number(numMatch[1]) : null;
      }
      return null;
    };

    // Helper to extract principal: "'ST..." -> "ST..." (handles contract addresses too)
    const extractPrincipal = (pattern: RegExp): string => {
      const match = repr.match(pattern);
      if (match && match[1]) {
        return match[1].startsWith("'") ? match[1].slice(1) : match[1];
      }
      return '';
    };

    // Parse top-level fields
    const balance = extractUint(/\(balance u(\d+)\)/) ?? 0;
    const burnchainUnlockHeight =
      extractUint(/\(burnchain-unlock-height u(\d+)\)/) ?? 0;
    const locked = extractUint(/\(locked u(\d+)\)/) ?? 0;
    const stacker = extractPrincipal(/\(stacker ('S[A-Z0-9]+)\)/);

    // Parse data tuple fields
    const amountUstx = extractUint(/\(amount-ustx u(\d+)\)/) ?? 0;
    // delegate-to can be either just a principal or principal.contract-name
    const delegateTo = extractPrincipal(
      /\(delegate-to ('S[A-Z0-9]+(?:\.[a-z0-9-]+)?)\)/,
    );
    const startCycleId = extractUint(/\(start-cycle-id u(\d+)\)/) ?? 0;
    const endCycleId = extractOptionalUint(/\(end-cycle-id (none|[^)]+)\)/);
    const unlockBurnHeight = extractOptionalUint(
      /\(unlock-burn-height (none|[^)]+)\)/,
    );

    // Parse pox-addr - can be none or a tuple with hashbytes
    let poxAddress: string | null = null;
    const poxAddrCheck = repr.match(/\(pox-addr none\)/);
    if (!poxAddrCheck) {
      // Try to extract hashbytes from pox-addr tuple
      const hashbytesMatch = repr.match(
        /\(pox-addr \(tuple[^}]+hashbytes (0x[a-fA-F0-9]+)\)/,
      );
      poxAddress = hashbytesMatch ? hashbytesMatch[1] : null;
    }

    const txData: StxTransactionData = {
      functionName: data.contract_call.function_name,
      txStatus: data.tx_status,
      balance,
      burnchainUnlockHeight,
      locked,
      stacker,
      amountUstx,
      delegateTo,
      startCycleId,
      endCycleId,
      unlockBurnHeight,
      poxAddress,
    };
    logger.info({
      msg: 'Transaction data fetched',
      txData,
    });
    return txData;
  }

  async getTransactionStatus(txId: string): Promise<string> {
    const url = `${this.network.client.baseUrl}/extended/v1/tx/${txId}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          // Transaction not yet indexed
          return 'pending';
        }
        logger.error({
          msg: 'Failed to fetch transaction status',
          txId,
          status: response.status,
          statusText: response.statusText,
        });
        return 'failed';
      }

      const data = await response.json();
      const status = data.tx_status || 'failed';

      // Log detailed error information if transaction failed
      if (
        status === 'abort_by_post_condition' ||
        status === 'abort_by_response'
      ) {
        logger.error({
          msg: 'Transaction failed with detailed error info',
          txId,
          status,
          txResult: data.tx_result,
          events: data.events,
          executionCost: data.execution_cost,
          contractCall: data.contract_call,
        });
      } else {
        logger.info({
          msg: 'Transaction status fetched',
          txId,
          status,
        });
      }

      return status;
    } catch (error) {
      logger.error({
        msg: 'Error fetching transaction status',
        txId,
        error,
      });
      // Return 'pending' on network errors (transaction might not be indexed yet)
      if (error instanceof Error && error.message.includes('404')) {
        return 'pending';
      }
      return 'failed';
    }
  }

  async getAdminBalance(): Promise<bigint> {
    const url = `${this.network.client.baseUrl}/v2/accounts/${ADMIN_ADDRESS}?proof=0`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error({
          msg: 'Failed to fetch admin balance',
          address: ADMIN_ADDRESS,
          status: response.status,
          statusText: response.statusText,
        });
        return BigInt(0);
      }
      const data = await response.json();
      const balance = BigInt(data.balance || '0');
      logger.info({
        msg: 'Admin balance fetched',
        address: ADMIN_ADDRESS,
        balance: balance.toString(),
        balanceSTX: Number(balance) / 1000000,
      });
      return balance;
    } catch (error) {
      logger.error({
        msg: 'Error fetching admin balance',
        address: ADMIN_ADDRESS,
        error,
      });
      return BigInt(0);
    }
  }
}
