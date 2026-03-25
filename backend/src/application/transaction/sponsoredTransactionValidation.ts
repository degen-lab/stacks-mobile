import { createNetwork } from '@stacks/network';
import {
  addressFromVersionHash,
  addressToString,
  AuthType,
  cvToValue,
  deserializeTransaction,
  isContractCallPayload,
  isTokenTransferPayload,
} from '@stacks/transactions';
import { GAME_CONTRACT_ADDRESS, STACKS_NETWORK } from '../../shared/constants';
import { UnsupportedSponsoredTransactionError } from '../errors/sponsoredTransactionErrors';
import { DefiOperation } from '../../domain/entities/defiOperation';
import { DefiOperationType } from '../../domain/entities/enums';

const SUPPORTED_CONTRACT_CALLS: Record<
  string,
  Record<string, ReadonlySet<string>>
> = {
  mainnet: {
    'SP1HFCRKEJ8BYW4D0E3FAWHFDX8A25PPAA83HWWZ9.dual-stacking-v2_0_4': new Set([
      'enroll',
      'opt-out',
      'change-reward-address',
    ]),
    'SP1HFCRKEJ8BYW4D0E3FAWHFDX8A25PPAA83HWWZ9.dual-stacking-v2_0_5': new Set([
      'enroll',
      'opt-out',
      'change-reward-address',
    ]),
    'SP000000000000000000002Q6VF78.pox-4': new Set([
      'allow-contract-caller',
      'disallow-contract-caller',
      'revoke-delegate-stx',
    ]),
    'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3': new Set([
      'delegate-stx',
    ]),
  },
  testnet: {
    'ST39770H89J51RQEZPJ4JNTA7QCTXRMVQF60FY2X3.dual-stacking-v2-testing':
      new Set(['enroll', 'opt-out', 'change-reward-address']),
  },
  devnet: {},
};

export type SponsoredTxSummary =
  | {
      kind: 'submission';
      originAddress: string;
      contractId: string;
      functionName: string;
    }
  | {
      kind: 'contract_call';
      originAddress: string;
      contractId: string;
      functionName: string;
    }
  | {
      kind: 'swap';
      originAddress: string;
      contractId: string;
      functionName: string;
    }
  | {
      kind: 'stx_transfer';
      originAddress: string;
      recipient: string;
    };

function getConfiguredNetwork() {
  if (STACKS_NETWORK === 'mainnet') return createNetwork('mainnet');
  if (STACKS_NETWORK === 'testnet') return createNetwork('testnet');
  return createNetwork('devnet');
}

function getConfiguredGameContractId(): string {
  return GAME_CONTRACT_ADDRESS.replace(/\.clar$/, '');
}

export function parseSponsoredTransaction(
  serializedTx: string,
  defiOperation?: DefiOperation,
): SponsoredTxSummary {
  const transaction = deserializeTransaction(serializedTx);
  const network = getConfiguredNetwork();

  if (transaction.chainId !== network.chainId) {
    throw new UnsupportedSponsoredTransactionError(
      'Transaction network does not match backend network',
    );
  }

  if (transaction.auth.authType !== AuthType.Sponsored) {
    throw new UnsupportedSponsoredTransactionError(
      'Sponsored transactions must use sponsored auth',
    );
  }

  const spendingCondition = transaction.auth.spendingCondition;
  if (!spendingCondition?.signer) {
    throw new UnsupportedSponsoredTransactionError(
      'Transaction is missing an origin signer',
    );
  }

  const originAddress = addressToString(
    addressFromVersionHash(
      network.addressVersion.singleSig,
      spendingCondition.signer,
    ),
  );

  if (isTokenTransferPayload(transaction.payload)) {
    if (defiOperation) {
      throw new UnsupportedSponsoredTransactionError(
        'STX transfers cannot be sponsored via a swap defi operation',
      );
    }
    return {
      kind: 'stx_transfer',
      originAddress,
      recipient: String(cvToValue(transaction.payload.recipient)),
    };
  }

  if (isContractCallPayload(transaction.payload)) {
    const contractId = `${addressToString(transaction.payload.contractAddress)}.${transaction.payload.contractName.content}`;
    const functionName = transaction.payload.functionName.content;

    if (
      contractId === getConfiguredGameContractId() &&
      functionName === 'submit-score'
    ) {
      return {
        kind: 'submission',
        originAddress,
        contractId,
        functionName,
      };
    }

    if (defiOperation?.operationType === DefiOperationType.Swap) {
      const prepared = defiOperation.preparedContractCall;
      if (!prepared) {
        throw new UnsupportedSponsoredTransactionError(
          'DefiOperation has no stored contract call — cannot validate sponsorship',
        );
      }
      const expectedContractId = `${prepared.contractAddress}.${prepared.contractName}`;
      if (
        contractId !== expectedContractId ||
        functionName !== prepared.functionName
      ) {
        throw new UnsupportedSponsoredTransactionError(
          `Signed transaction (${contractId}.${functionName}) does not match prepared swap (${expectedContractId}.${prepared.functionName})`,
        );
      }
      if (defiOperation.senderAddress !== originAddress) {
        throw new UnsupportedSponsoredTransactionError(
          'Swap transaction sender does not match the DefiOperation sender address',
        );
      }
      return { kind: 'swap', originAddress, contractId, functionName };
    }

    const supportedCalls = SUPPORTED_CONTRACT_CALLS[STACKS_NETWORK] ?? {};
    const supportedFunctions = supportedCalls[contractId];
    if (!supportedFunctions?.has(functionName)) {
      throw new UnsupportedSponsoredTransactionError(
        `Contract call ${contractId}.${functionName} is not eligible for sponsorship`,
      );
    }

    return {
      kind: 'contract_call',
      originAddress,
      contractId,
      functionName,
    };
  }

  throw new UnsupportedSponsoredTransactionError(
    'Only supported contract calls and STX transfers can be sponsored',
  );
}
