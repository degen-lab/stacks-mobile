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

    const mockSuccessResponse = {
      tx_id:
        '0x7f156d3535ab90bff517c39ec002d4a3cd3f0bb8ca86589f009bbf1fa10df50f',
      nonce: 1,
      fee_rate: '400',
      sender_address: 'ST2AGP07VR9SZSKTQJ2MCYAH7GP7J4KAWD9FCPGVT',
      tx_status: 'success',
      tx_result: {
        hex: '0x0703',
        repr: '(ok true)',
      },
      tx_type: 'contract_call',
      contract_call: {
        contract_id: 'ST000000000000000000002AMW42H.pox-4',
        function_name: 'delegate-stx',
        function_signature:
          '(define-public (delegate-stx (amount-ustx uint) (delegate-to principal) (until-burn-ht (optional uint)) (pox-addr (optional (tuple (hashbytes (buff 32)) (version (buff 1)))))))',
        function_args: [
          {
            hex: '0x0100000000000000000000000002faf080',
            repr: 'u50000000',
            name: 'amount-ustx',
            type: 'uint',
          },
          {
            hex: '0x051ae6b5beb23e2ca3fb4b64fd84d791aaa53746e567',
            repr: "'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3",
            name: 'delegate-to',
            type: 'principal',
          },
          {
            hex: '0x09',
            repr: 'none',
            name: 'until-burn-ht',
            type: '(optional uint)',
          },
          {
            hex: '0x09',
            repr: 'none',
            name: 'pox-addr',
            type: '(optional (tuple (hashbytes (buff 32)) (version (buff 1))))',
          },
        ],
      },
    };

    it('should correctly parse delegate-stx transaction with none values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result).toEqual({
        functionName: 'delegate-stx',
        txStatus: 'success',
        amountUstx: 50000000,
        delegateTo: 'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3',
        untilBurnHeight: undefined,
        poxAddress: undefined,
      });
    });

    it('should correctly parse delegate-stx transaction with until-burn-height set', async () => {
      const responseWithBurnHeight = {
        ...mockSuccessResponse,
        contract_call: {
          ...mockSuccessResponse.contract_call,
          function_args: [
            ...mockSuccessResponse.contract_call.function_args.slice(0, 2),
            {
              hex: '0x0a0100000000000000000000000000030d40',
              repr: '(some u200000)',
              name: 'until-burn-ht',
              type: '(optional uint)',
            },
            mockSuccessResponse.contract_call.function_args[3],
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithBurnHeight,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result).toEqual({
        functionName: 'delegate-stx',
        txStatus: 'success',
        amountUstx: 50000000,
        delegateTo: 'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3',
        untilBurnHeight: 200000,
        poxAddress: undefined,
      });
    });

    it('should correctly parse delegate-stx transaction with pox-addr set', async () => {
      const responseWithPoxAddr = {
        ...mockSuccessResponse,
        contract_call: {
          ...mockSuccessResponse.contract_call,
          function_args: [
            ...mockSuccessResponse.contract_call.function_args.slice(0, 3),
            {
              hex: '0x0a...',
              repr: '(some (tuple (hashbytes 0x1234...) (version 0x00)))',
              name: 'pox-addr',
              type: '(optional (tuple (hashbytes (buff 32)) (version (buff 1))))',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithPoxAddr,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result.poxAddress).toBe(
        '(some (tuple (hashbytes 0x1234...) (version 0x00)))',
      );
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

    it('should correctly remove quote prefix from delegate-to address', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      // The original repr has a quote prefix: "'ST3KBBFNJ7..."
      // It should be removed in the parsed result
      expect(result.delegateTo).toBe(
        'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3',
      );
      expect(result.delegateTo.startsWith("'")).toBe(false);
    });

    it('should correctly parse amount from uint repr format', async () => {
      const responseWithDifferentAmount = {
        ...mockSuccessResponse,
        contract_call: {
          ...mockSuccessResponse.contract_call,
          function_args: [
            {
              hex: '0x...',
              repr: 'u123456789',
              name: 'amount-ustx',
              type: 'uint',
            },
            ...mockSuccessResponse.contract_call.function_args.slice(1),
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithDifferentAmount,
      });

      const result =
        await transactionClient.fetchStackingTransactionData(mockTxId);

      expect(result.amountUstx).toBe(123456789);
      expect(typeof result.amountUstx).toBe('number');
    });
  });
});
