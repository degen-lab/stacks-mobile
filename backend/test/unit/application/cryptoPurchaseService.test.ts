import { EntityManager } from 'typeorm';
import { CryptoPurchaseService } from '../../../src/application/purchase/cryptoPurchaseService';
import { TransakPurchaseClient } from '../../../src/infra/purchase/transakPurchaseClient';
import { CachePort } from '../../../src/application/ports/cachePort';
import { CryptoPurchaseDomainService } from '../../../src/domain/service/cryptoPurchaseDomainService';
import { User } from '../../../src/domain/entities/user';
import { CryptoPurchase } from '../../../src/domain/entities/cryptoPurchase';
import { UserNotFoundError } from '../../../src/application/errors/userErrors';
import { PurchaseNotFoundError } from '../../../src/application/errors/purchaseErrors';
import { AppPlatform, TransakAccessToken } from '../../../src/shared/types';

describe('CryptoPurchaseService unit test', () => {
  let cryptoPurchaseService: CryptoPurchaseService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockCacheClient: jest.Mocked<CachePort>;
  let mockPurchaseClient: jest.Mocked<TransakPurchaseClient>;
  let mockPurchaseDomainService: jest.Mocked<CryptoPurchaseDomainService>;

  beforeEach(() => {
    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    mockCacheClient = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CachePort>;

    mockPurchaseClient = {
      createWidgetUrl: jest.fn(),
      refreshAccessToken: jest.fn(),
    } as unknown as jest.Mocked<TransakPurchaseClient>;

    mockPurchaseDomainService = {
      createPurchase: jest.fn(),
    } as unknown as jest.Mocked<CryptoPurchaseDomainService>;

    cryptoPurchaseService = new CryptoPurchaseService(
      mockEntityManager,
      mockCacheClient,
      mockPurchaseClient,
      mockPurchaseDomainService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPurchaseSession', () => {
    const userId = 1;
    const cryptoCurrencyCode = 'STX';
    const fiatCurrency = 'USD';
    const fiatAmount = 100;
    const expectedWidgetUrl = 'https://transak.com/widget?session=abc123';

    let testUser: User;
    let testPurchase: CryptoPurchase;

    beforeEach(() => {
      testUser = new User();
      testUser.id = userId;
      testUser.googleId = 'test-google-id';
      testUser.nickName = 'test-nickname';

      testPurchase = new CryptoPurchase();
      testPurchase.id = 999;
      testPurchase.cryptoCurrencyCode = cryptoCurrencyCode;
      testPurchase.fiatCurrency = fiatCurrency;
      testPurchase.fiatAmount = fiatAmount * 100;
      testPurchase.user = testUser;
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        cryptoPurchaseService.createPurchaseSession(
          userId,
          cryptoCurrencyCode,
          fiatCurrency,
          fiatAmount,
          undefined,
          AppPlatform.ANDROID,
          'BUY',
        ),
      ).rejects.toThrow(UserNotFoundError);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: userId },
      });
      expect(mockPurchaseDomainService.createPurchase).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalled();
      expect(mockPurchaseClient.createWidgetUrl).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError with correct message', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        cryptoPurchaseService.createPurchaseSession(
          userId,
          cryptoCurrencyCode,
          fiatCurrency,
          fiatAmount,
          undefined,
          AppPlatform.ANDROID,
          'BUY',
        ),
      ).rejects.toThrow(`Error: User with id ${userId} doesn't exists`);
    });

    it('should create purchase session successfully when user exists', async () => {
      const cachedToken: TransakAccessToken = {
        accessToken: 'valid-access-token',
        expiresAt: Date.now() + 3600000, // expires in 1 hour
      };

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockResolvedValue(testPurchase);
      mockCacheClient.get.mockResolvedValue(cachedToken);
      mockPurchaseClient.createWidgetUrl.mockResolvedValue(expectedWidgetUrl);

      const result = await cryptoPurchaseService.createPurchaseSession(
        userId,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(result).toBe(expectedWidgetUrl);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: userId },
      });
      expect(mockPurchaseDomainService.createPurchase).toHaveBeenCalledWith(
        testUser,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount * 100,
        undefined,
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(testPurchase);
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined, // cryptoAmount
        testUser.id.toString(), // partnerCustomerId = user ID
        testPurchase.id.toString(), // partnerOrderId = purchase ID
        AppPlatform.ANDROID,
        'BUY',
        undefined,
      );
    });

    it('should use cached access token when not expired', async () => {
      const cachedToken: TransakAccessToken = {
        accessToken: 'cached-token',
        expiresAt: Date.now() + 3600000, // expires in 1 hour
      };

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockResolvedValue(testPurchase);
      mockCacheClient.get.mockResolvedValue(cachedToken);
      mockPurchaseClient.createWidgetUrl.mockResolvedValue(expectedWidgetUrl);

      await cryptoPurchaseService.createPurchaseSession(
        userId,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(mockCacheClient.get).toHaveBeenCalledWith('accessToken');
      expect(mockPurchaseClient.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockCacheClient.set).not.toHaveBeenCalled();
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined, // cryptoAmount
        testUser.id.toString(), // partnerCustomerId = user ID
        testPurchase.id.toString(), // partnerOrderId = purchase ID
        AppPlatform.ANDROID,
        'BUY',
        undefined,
      );
    });

    it('should refresh access token when cached token is expired', async () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const expiredToken: TransakAccessToken = {
        accessToken: 'expired-token',
        expiresAt: nowInSeconds - 1, // expired 1 second ago (in seconds)
      };
      const newToken: TransakAccessToken = {
        accessToken: 'new-fresh-token',
        expiresAt: nowInSeconds + 3600, // expires in 1 hour (in seconds)
      };

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockResolvedValue(testPurchase);
      mockCacheClient.get.mockResolvedValue(expiredToken);
      mockPurchaseClient.refreshAccessToken.mockResolvedValue(newToken);
      mockPurchaseClient.createWidgetUrl.mockResolvedValue(expectedWidgetUrl);

      await cryptoPurchaseService.createPurchaseSession(
        userId,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(mockCacheClient.get).toHaveBeenCalledWith('accessToken');
      expect(mockPurchaseClient.refreshAccessToken).toHaveBeenCalled();
      expect(mockCacheClient.set).toHaveBeenCalledWith('accessToken', newToken);
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        newToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined, // cryptoAmount
        testUser.id.toString(), // partnerCustomerId = user ID
        testPurchase.id.toString(), // partnerOrderId = purchase ID
        AppPlatform.ANDROID,
        'BUY',
        undefined,
      );
    });

    it('should refresh access token when no cached token exists', async () => {
      const newToken: TransakAccessToken = {
        accessToken: 'brand-new-token',
        expiresAt: Date.now() + 3600000,
      };

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockResolvedValue(testPurchase);
      mockCacheClient.get.mockResolvedValue(null);
      mockPurchaseClient.refreshAccessToken.mockResolvedValue(newToken);
      mockPurchaseClient.createWidgetUrl.mockResolvedValue(expectedWidgetUrl);

      await cryptoPurchaseService.createPurchaseSession(
        userId,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(mockCacheClient.get).toHaveBeenCalledWith('accessToken');
      expect(mockPurchaseClient.refreshAccessToken).toHaveBeenCalled();
      expect(mockCacheClient.set).toHaveBeenCalledWith('accessToken', newToken);
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        newToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined, // cryptoAmount
        testUser.id.toString(), // partnerCustomerId = user ID
        testPurchase.id.toString(), // partnerOrderId = purchase ID
        AppPlatform.ANDROID,
        'BUY',
        undefined,
      );
    });

    it('should pass correct partnerCustomerId (user id) and partnerOrderId (purchase id) to widget url', async () => {
      const cachedToken: TransakAccessToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
      };
      const savedPurchaseWithId = { ...testPurchase, id: 12345 };

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockResolvedValue(savedPurchaseWithId);
      mockCacheClient.get.mockResolvedValue(cachedToken);
      mockPurchaseClient.createWidgetUrl.mockResolvedValue(expectedWidgetUrl);

      await cryptoPurchaseService.createPurchaseSession(
        userId,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined, // cryptoAmount
        testUser.id.toString(), // partnerCustomerId = user ID
        '12345', // partnerOrderId = saved purchase ID
        AppPlatform.ANDROID,
        'BUY',
        undefined,
      );
    });

    it('should handle different crypto currencies', async () => {
      const cachedToken: TransakAccessToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
      };

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockResolvedValue(testPurchase);
      mockCacheClient.get.mockResolvedValue(cachedToken);
      mockPurchaseClient.createWidgetUrl.mockResolvedValue(expectedWidgetUrl);

      await cryptoPurchaseService.createPurchaseSession(
        userId,
        'BTC',
        'EUR',
        500,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(mockPurchaseDomainService.createPurchase).toHaveBeenCalledWith(
        testUser,
        'BTC',
        'EUR',
        500 * 100,
        undefined,
      );
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        'BTC',
        'EUR',
        500,
        undefined, // cryptoAmount
        testUser.id.toString(), // partnerCustomerId = user ID
        testPurchase.id.toString(), // partnerOrderId = purchase ID
        AppPlatform.ANDROID,
        'BUY',
        undefined,
      );
    });

    it('should save purchase before requesting widget url', async () => {
      const cachedToken: TransakAccessToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
      };
      const callOrder: string[] = [];

      mockEntityManager.findOne.mockResolvedValue(testUser);
      mockPurchaseDomainService.createPurchase.mockReturnValue(testPurchase);
      mockEntityManager.save.mockImplementation(async () => {
        callOrder.push('save');
        return testPurchase;
      });
      mockCacheClient.get.mockResolvedValue(cachedToken);
      mockPurchaseClient.createWidgetUrl.mockImplementation(async () => {
        callOrder.push('createWidgetUrl');
        return expectedWidgetUrl;
      });

      await cryptoPurchaseService.createPurchaseSession(
        userId,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        undefined,
        AppPlatform.ANDROID,
        'BUY',
      );

      expect(callOrder).toEqual(['save', 'createWidgetUrl']);
    });
  });

  describe('updatePurchaseFromWebhook', () => {
    const validWebhookData = {
      id: 'transak-order-123',
      partnerOrderId: '456',
      partnerCustomerId: '789',
      status: 'COMPLETED',
      cryptoAmount: 100,
    };

    it('should throw PurchaseNotFoundError when partnerOrderId is missing', async () => {
      await expect(
        cryptoPurchaseService.updatePurchaseFromWebhook({
          ...validWebhookData,
          partnerOrderId: undefined,
        }),
      ).rejects.toThrow('purchase not provided in webhook');
    });

    it('should throw PurchaseNotFoundError when partnerCustomerId is missing', async () => {
      await expect(
        cryptoPurchaseService.updatePurchaseFromWebhook({
          ...validWebhookData,
          partnerCustomerId: undefined,
        }),
      ).rejects.toThrow('partnerCustomerId not provided in webhook');
    });

    it('should return existing purchase when webhook already processed (idempotency)', async () => {
      const existingPurchase = new CryptoPurchase();
      existingPurchase.id = 456;
      existingPurchase.status = 'PENDING';
      existingPurchase.user = { id: 789 } as User;

      mockCacheClient.get.mockResolvedValue('1'); // Already processed
      mockEntityManager.findOne.mockResolvedValue(existingPurchase);

      const result =
        await cryptoPurchaseService.updatePurchaseFromWebhook(validWebhookData);

      expect(result).toBe(existingPurchase);
      expect(result.status).toBe('PENDING'); // Unchanged
      expect(mockEntityManager.save).not.toHaveBeenCalled();
      expect(mockCacheClient.get).toHaveBeenCalledWith(
        'webhook:processed:transak-order-123:COMPLETED',
      );
    });

    it('should return stub when idempotency hit but purchase not found', async () => {
      mockCacheClient.get.mockResolvedValue('1'); // Already processed
      mockEntityManager.findOne.mockResolvedValue(null); // Purchase purged

      const result =
        await cryptoPurchaseService.updatePurchaseFromWebhook(validWebhookData);

      expect(result).toBeInstanceOf(CryptoPurchase);
      expect(result.id).toBe(456);
      expect(result.status).toBe('COMPLETED');
      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });

    it('should update purchase and set idempotency key on first processing', async () => {
      const existingPurchase = new CryptoPurchase();
      existingPurchase.id = 456;
      existingPurchase.status = 'PENDING';
      existingPurchase.user = { id: 789 } as User;
      existingPurchase.cryptoCurrencyCode = 'STX';

      mockCacheClient.get.mockResolvedValue(null); // Not yet processed
      mockEntityManager.findOne.mockResolvedValue(existingPurchase);
      mockEntityManager.save.mockImplementation(
        async (entity) => entity as unknown as CryptoPurchase,
      );

      const result =
        await cryptoPurchaseService.updatePurchaseFromWebhook(validWebhookData);

      expect(result.status).toBe('COMPLETED');
      // STX uses 6 decimals: 100 * 10^6 = 100000000
      expect(result.cryptoAmount).toBe(100_000_000);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 456,
          status: 'COMPLETED',
          cryptoAmount: 100_000_000,
        }),
      );
      expect(mockCacheClient.set).toHaveBeenCalledWith(
        'webhook:processed:transak-order-123:COMPLETED',
        '1',
        86400,
      );
    });

    it('should proceed when cache get throws (cache unavailable)', async () => {
      const existingPurchase = new CryptoPurchase();
      existingPurchase.id = 456;
      existingPurchase.status = 'PENDING';
      existingPurchase.user = { id: 789 } as User;
      existingPurchase.cryptoCurrencyCode = 'STX';

      mockCacheClient.get.mockRejectedValue(new Error('Redis down'));
      mockEntityManager.findOne.mockResolvedValue(existingPurchase);
      mockEntityManager.save.mockImplementation(
        async (entity) => entity as unknown as CryptoPurchase,
      );

      const result =
        await cryptoPurchaseService.updatePurchaseFromWebhook(validWebhookData);

      expect(result.status).toBe('COMPLETED');
      expect(result.cryptoAmount).toBe(100_000_000);
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should throw PurchaseNotFoundError when purchase not found (normal flow)', async () => {
      mockCacheClient.get.mockResolvedValue(null);
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        cryptoPurchaseService.updatePurchaseFromWebhook(validWebhookData),
      ).rejects.toThrow(PurchaseNotFoundError);

      await expect(
        cryptoPurchaseService.updatePurchaseFromWebhook(validWebhookData),
      ).rejects.toThrow(`Purchase with id 456 not found`);
    });
  });
});
