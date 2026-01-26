import { TransactionClient } from '../../../src/infra/stacks/transactionClient';
import { STACKS_NETWORK } from '../../../src/shared/constants';

describe('TransactionClient - fetchStackingTransactionData with real delegate-stx', () => {
  let transactionClient: TransactionClient;

  beforeEach(() => {
    transactionClient = new TransactionClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should correctly parse delegate-stx transaction (0x3bf9dd...)', async () => {
    const mockResponse = {
      tx_id:
        '0x3bf9dd597116c6a7e5f4f6b984e7f77a63bc47c7d9889a7997e65d7f2d3d5468',
      tx_status: 'success',
      tx_result: {
        hex: '0x070c000000030b6c6f636b2d616d6f756e7401000000000000000000000001826873c507737461636b6572051644bae24e4011af7c88218db46bbcd3c3fd23694212756e6c6f636b2d6275726e2d68656967687401000000000000000000000000000cf36e',
        repr: "(ok (tuple (lock-amount u6482850757) (stacker 'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG) (unlock-burn-height u848750)))",
      },
      events: [
        {
          event_index: 0,
          event_type: 'smart_contract_log',
          contract_log: {
            contract_id: 'SP000000000000000000002Q6VF78.pox-4',
            topic: 'print',
            value: {
              repr: '(ok (tuple (balance u6483850757) (burnchain-unlock-height u0) (data (tuple (amount-ustx u6500000000) (delegate-to \'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3) (end-cycle-id none) (pox-addr none) (start-cycle-id u86) (unlock-burn-height none))) (locked u0) (name "delegate-stx") (stacker \'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG)))',
            },
          },
        },
        {
          event_index: 1,
          event_type: 'smart_contract_log',
          contract_log: {
            contract_id: 'SP000000000000000000002Q6VF78.pox-4',
            topic: 'print',
            value: {
              repr: "(ok (tuple (balance u6483850757) (burnchain-unlock-height u0) (data (tuple (delegator 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3) (end-cycle-id (some u87)) (lock-amount u6482850757) (lock-period u1) (pox-addr (tuple (hashbytes 0x83ed66860315e334010bbfb76eb3eef887efee0a) (version 0x04))) (stacker 'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG) (start-burn-height u845260) (start-cycle-id u86) (unlock-burn-height u848750))) (locked u0) (name \"delegate-stack-stx\") (stacker 'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG)))",
            },
          },
        },
      ],
      contract_call: {
        contract_id:
          'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3',
        function_name: 'delegate-stx',
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await transactionClient.fetchStackingTransactionData(
      '0x3bf9dd597116c6a7e5f4f6b984e7f77a63bc47c7d9889a7997e65d7f2d3d5468',
    );

    expect(result).toEqual({
      functionName: 'delegate-stx',
      txStatus: 'success',
      balance: 6483850757,
      burnchainUnlockHeight: 0,
      locked: 0,
      stacker: 'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG',
      amountUstx: 6500000000,
      delegateTo: 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3',
      startCycleId: 86,
      endCycleId: null, // 'none' should become null
      unlockBurnHeight: null, // 'none' should become null
      poxAddress: null, // 'none' should become null
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `https://api.${STACKS_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'}.hiro.so/extended/v1/tx/0x3bf9dd597116c6a7e5f4f6b984e7f77a63bc47c7d9889a7997e65d7f2d3d5468`,
    );
  });

  it('should correctly parse delegate-stx with end-cycle-id', async () => {
    const mockResponse = {
      tx_id: '0xtest123',
      tx_status: 'success',
      tx_result: {
        repr: "(ok (tuple (lock-amount u6482850757) (stacker 'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG) (unlock-burn-height u848750)))",
      },
      events: [
        {
          event_index: 0,
          event_type: 'smart_contract_log',
          contract_log: {
            contract_id: 'SP000000000000000000002Q6VF78.pox-4',
            topic: 'print',
            value: {
              repr: '(ok (tuple (balance u6483850757) (burnchain-unlock-height u0) (data (tuple (amount-ustx u6500000000) (delegate-to \'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3) (end-cycle-id (some u100)) (pox-addr (tuple (hashbytes 0x83ed66860315e334010bbfb76eb3eef887efee0a) (version 0x04))) (start-cycle-id u86) (unlock-burn-height (some u848750)))) (locked u0) (name "delegate-stx") (stacker \'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG)))',
            },
          },
        },
      ],
      contract_call: {
        contract_id:
          'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3',
        function_name: 'delegate-stx',
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result =
      await transactionClient.fetchStackingTransactionData('0xtest123');

    expect(result.functionName).toBe('delegate-stx');
    expect(result.delegateTo).toBe(
      'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3',
    );
    expect(result.startCycleId).toBe(86);
    expect(result.endCycleId).toBe(100); // Should extract from (some u100)
    expect(result.unlockBurnHeight).toBe(848750); // Should extract from (some u848750)
    expect(result.amountUstx).toBe(6500000000);
    expect(result.poxAddress).toBe(
      '0x83ed66860315e334010bbfb76eb3eef887efee0a',
    );
  });

  it('should correctly parse delegate-stx with principal address (no contract)', async () => {
    const mockResponse = {
      tx_id: '0xtest456',
      tx_status: 'success',
      tx_result: {
        repr: "(ok (tuple (lock-amount u6482850757) (stacker 'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG) (unlock-burn-height u848750)))",
      },
      events: [
        {
          event_index: 0,
          event_type: 'smart_contract_log',
          contract_log: {
            contract_id: 'SP000000000000000000002Q6VF78.pox-4',
            topic: 'print',
            value: {
              repr: '(ok (tuple (balance u6483850757) (burnchain-unlock-height u0) (data (tuple (amount-ustx u6500000000) (delegate-to \'ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3) (end-cycle-id none) (pox-addr none) (start-cycle-id u86) (unlock-burn-height none))) (locked u0) (name "delegate-stx") (stacker \'SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG)))',
            },
          },
        },
      ],
      contract_call: {
        contract_id:
          'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3',
        function_name: 'delegate-stx',
      },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result =
      await transactionClient.fetchStackingTransactionData('0xtest456');

    // Should parse principal address without contract name
    expect(result.delegateTo).toBe('ST3KBBFNJ7RPA7YTBCKYR9NWHNAJKEHQ5CYZ3W0S3');
    expect(result.stacker).toBe('SP12BNRJE808TYZ48466V8TXWTF1ZT8V98BCA1DAG');
    expect(result.functionName).toBe('delegate-stx');
  });
});
