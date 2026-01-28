import { TransactionClient } from '../../../src/infra/stacks/transactionClient';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('TransactionClient', () => {
  let transactionClient: TransactionClient;

  beforeEach(() => {
    transactionClient = new TransactionClient();
    jest.clearAllMocks();
  });

  describe('fetchStackingTransactionData', () => {
    const mockTxId =
      '0x7f156d3535ab90bff517c39ec002d4a3cd3f0bb8ca86589f009bbf1fa10df50f';

    // Full response matching the actual API response
    const mockSuccessResponse = {
      tx_id: mockTxId,
      tx_status: 'success',
      tx_type: 'contract_call',
      contract_call: {
        contract_id: 'ST000000000000000000002AMW42H.pox-4',
        function_name: 'delegate-stx',
      },
      events: [
        {
          event_index: 0,
          event_type: 'smart_contract_log',
          tx_id: mockTxId,
          contract_log: {
            contract_id: 'ST000000000000000000002AMW42H.pox-4',
            topic: 'print',
            value: {
              repr: '(ok (tuple (balance u47999393) (burnchain-unlock-height u0) (data (tuple (amount-ustx u50000000) (delegate-to \'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3) (end-cycle-id none) (pox-addr none) (start-cycle-id u149) (unlock-burn-height none))) (locked u0) (name "delegate-stx") (stacker \'ST2AGP07VR9SZSKTQJ2MCYAH7GP7J4KAWD9FCPGVT)))',
            },
          },
        },
      ],
    };

    it('should correctly parse delegate-stx transaction from smart contract log', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result).toEqual({
        functionName: 'delegate-stx',
        txStatus: 'success',
        balance: 47999393,
        burnchainUnlockHeight: 0,
        locked: 0,
        stacker: 'ST2AGP07VR9SZSKTQJ2MCYAH7GP7J4KAWD9FCPGVT',
        amountUstx: 50000000,
        delegateTo: 'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3',
        startCycleId: 149,
        endCycleId: null,
        unlockBurnHeight: null,
        poxAddress: null,
      });
    });

    it('should correctly parse transaction with end-cycle-id and unlock-burn-height set', async () => {
      const responseWithOptionals = {
        ...mockSuccessResponse,
        events: [
          {
            ...mockSuccessResponse.events[0],
            contract_log: {
              ...mockSuccessResponse.events[0].contract_log,
              value: {
                repr: '(ok (tuple (balance u100000000) (burnchain-unlock-height u150000) (data (tuple (amount-ustx u75000000) (delegate-to \'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3) (end-cycle-id u160) (pox-addr none) (start-cycle-id u150) (unlock-burn-height u200000))) (locked u50000000) (name "delegate-stx") (stacker \'ST2AGP07VR9SZSKTQJ2MCYAH7GP7J4KAWD9FCPGVT)))',
              },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithOptionals,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result.balance).toBe(100000000);
      expect(result.burnchainUnlockHeight).toBe(150000);
      expect(result.locked).toBe(50000000);
      expect(result.amountUstx).toBe(75000000);
      expect(result.startCycleId).toBe(150);
      expect(result.endCycleId).toBe(160);
      expect(result.unlockBurnHeight).toBe(200000);
    });

    it('should handle pending transaction status', async () => {
      const pendingResponse = {
        ...mockSuccessResponse,
        tx_status: 'pending',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => pendingResponse,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result.txStatus).toBe('pending');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        transactionClient.fetchStackingTransactionData(mockTxId),
      ).rejects.toThrow('Error: failed to fetch transaction data');
    });

    it('should throw error when smart contract log event is missing', async () => {
      const responseWithoutEvents = {
        ...mockSuccessResponse,
        events: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutEvents,
      });

      await expect(
        transactionClient.fetchStackingTransactionData(mockTxId),
      ).rejects.toThrow(
        'Error: smart contract log event not found in transaction',
      );
    });

    it('should correctly remove quote prefix from principal addresses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      // Both delegate-to and stacker should have quote prefix removed
      expect(result.delegateTo).toBe(
        'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3',
      );
      expect(result.stacker).toBe('ST2AGP07VR9SZSKTQJ2MCYAH7GP7J4KAWD9FCPGVT');
      expect(result.delegateTo.startsWith("'")).toBe(false);
      expect(result.stacker.startsWith("'")).toBe(false);
    });

    it('should correctly parse different amount values', async () => {
      const responseWithDifferentAmount = {
        ...mockSuccessResponse,
        events: [
          {
            ...mockSuccessResponse.events[0],
            contract_log: {
              ...mockSuccessResponse.events[0].contract_log,
              value: {
                repr: '(ok (tuple (balance u999999999) (burnchain-unlock-height u0) (data (tuple (amount-ustx u123456789) (delegate-to \'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3) (end-cycle-id none) (pox-addr none) (start-cycle-id u100) (unlock-burn-height none))) (locked u0) (name "delegate-stx") (stacker \'ST2AGP07VR9SZSKTQJ2MCYAH7GP7J4KAWD9FCPGVT)))',
              },
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithDifferentAmount,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result.amountUstx).toBe(123456789);
      expect(result.balance).toBe(999999999);
      expect(typeof result.amountUstx).toBe('number');
    });
  });
});
