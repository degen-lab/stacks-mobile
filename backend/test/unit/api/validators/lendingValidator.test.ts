jest.mock('@stacks/transactions', () => ({
  validateStacksAddress: jest.fn((addr: string) => {
    return /^(SP|ST|SM|SN)[0-9A-Z]{39}$/.test(addr);
  }),
}));

import { saveLendingOperationSchema } from '../../../../src/api/validators/lendingValidator';

const validStacksAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';
const validTxId = 'a'.repeat(64);
const validContract = `${validStacksAddress}.some-contract`;

describe('saveLendingOperationSchema', () => {
  const validInput = {
    txId: validTxId,
    senderAddress: validStacksAddress,
    amount: 100,
    assetId: 'asset-123',
    assetContract: validContract,
  };

  it('should accept valid input', () => {
    const result = saveLendingOperationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.txId).toBe(`0x${validTxId}`);
      expect(result.data.senderAddress).toBe(validStacksAddress);
      expect(result.data.amount).toBe(100);
      expect(result.data.assetId).toBe('asset-123');
      expect(result.data.assetContract).toBe(validContract);
    }
  });

  it('should add 0x prefix to txId when missing', () => {
    const result = saveLendingOperationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.txId).toMatch(/^0x/);
    }
  });

  it('should preserve 0x prefix when already present', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      txId: `0x${validTxId}`,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.txId).toBe(`0x${validTxId}`);
    }
  });

  it('should reject empty txId', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      txId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject txId with wrong length', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      txId: 'abc123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject txId with non-hex characters', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      txId: 'g'.repeat(64),
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid senderAddress', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      senderAddress: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero amount', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      amount: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should reject decimal amount', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      amount: 10.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty assetId', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      assetId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid assetContract format (missing dot)', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      assetContract: validStacksAddress,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid assetContract format (invalid principal)', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      assetContract: 'invalid-principal.contract-name',
    });
    expect(result.success).toBe(false);
  });

  it('should reject assetContract with invalid contract name (uppercase)', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      assetContract: `${validStacksAddress}.InvalidContract`,
    });
    expect(result.success).toBe(false);
  });

  it('should accept assetContract with valid contract name (lowercase, hyphens)', () => {
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      assetContract: `${validStacksAddress}.my-contract-v2`,
    });
    expect(result.success).toBe(true);
  });

  it('should accept multisig address as senderAddress', () => {
    const multisigAddress = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      senderAddress: multisigAddress,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.senderAddress).toBe(multisigAddress);
    }
  });

  it('should accept assetContract with multisig principal', () => {
    const multisigPrincipal = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4';
    const result = saveLendingOperationSchema.safeParse({
      ...validInput,
      assetContract: `${multisigPrincipal}.some-contract`,
    });
    expect(result.success).toBe(true);
  });
});
