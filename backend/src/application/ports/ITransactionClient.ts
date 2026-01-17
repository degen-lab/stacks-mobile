import { TxBroadcastResult } from '@stacks/transactions';
import { StxTransactionData } from '../../shared/types';

export interface ITransactionClient {
  createTournamentUnsignedTransaction(
    address: string,
    publicKey: string,
    score: number,
    sponsored: boolean,
  ): Promise<string>;
  broadcastSponsoredTransaction(serializedTx: string): Promise<string>;
  getTournamentId(): Promise<number>;
  distributeRewards(addresses: string[]): Promise<string>;
  headToNextTournament(): Promise<string>;
  getTransactionStatus(txId: string): Promise<string>;
  broadcastTransaction(serializedTx: string): Promise<TxBroadcastResult>;
  fetchStackingTransactionData(txId: string): Promise<StxTransactionData>; 
}
