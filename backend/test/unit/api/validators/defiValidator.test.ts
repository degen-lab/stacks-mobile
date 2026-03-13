import { swapParamsSchema } from '../../../../src/api/validators/defiValidator';

jest.mock('@stacks/transactions', () => ({
  validateStacksAddress: jest.fn((addr: string) => {
    // Mock: accept standard (SP/ST) and multisig (SM/SN) Stacks addresses
    return /^(SP|ST|SM|SN)[0-9A-Z]{39}$/.test(addr);
  }),
}));

const validStacksAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';

describe('swapParamsSchema', () => {
  const validInput = {
    tokenInId: 'token-a',
    tokenOutId: 'token-b',
    amount: '100.5',
    senderAddress: validStacksAddress,
  };

  it('should accept valid input', () => {
    const result = swapParamsSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tokenInId).toBe('token-a');
      expect(result.data.tokenOutId).toBe('token-b');
      expect(result.data.amount).toBe(100.5);
      expect(result.data.senderAddress).toBe(validStacksAddress);
    }
  });

  it('should reject empty tokenInId', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      tokenInId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty tokenOutId', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      tokenOutId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty amount', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      amount: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-numeric amount', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      amount: 'not-a-number',
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero amount', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      amount: '0',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      amount: '-10',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid Stacks address', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      senderAddress: 'invalid-address',
    });
    expect(result.success).toBe(false);
  });

  it('should reject address with wrong prefix', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      senderAddress: 'XX2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty senderAddress', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      senderAddress: '',
    });
    expect(result.success).toBe(false);
  });

  it('should transform amount string to number', () => {
    const result = swapParamsSchema.safeParse({
      ...validInput,
      amount: '42.75',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.amount).toBe('number');
      expect(result.data.amount).toBe(42.75);
    }
  });

  it('should accept another valid Stacks address (ST format)', () => {
    const stAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const result = swapParamsSchema.safeParse({
      ...validInput,
      senderAddress: stAddress,
    });
    expect(result.success).toBe(true);
  });

  it('should accept multisig address (SM mainnet format)', () => {
    const multisigAddress = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
    const result = swapParamsSchema.safeParse({
      ...validInput,
      senderAddress: multisigAddress,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.senderAddress).toBe(multisigAddress);
    }
  });

  it('should accept multisig address (SN testnet format)', () => {
    const testnetMultisig = 'SN3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
    const result = swapParamsSchema.safeParse({
      ...validInput,
      senderAddress: testnetMultisig,
    });
    expect(result.success).toBe(true);
  });
});
