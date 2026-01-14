import { EntityManager } from 'typeorm';
import { CryptoPurchaseService } from '../../../src/application/purchase/cryptoPurchaseService';
import { TransakPurchaseClient } from '../../../src/infra/purchase/transakPurchaseClient';
import { ICachePort } from '../../../src/application/ports/ICachePort';
import { CryptoPurchaseDomainService } from '../../../src/domain/service/cryptoPurchaseDomainService';
import { User } from '../../../src/domain/entities/user';
import { CryptoPurchase } from '../../../src/domain/entities/cryptoPurchase';
import { UserNotFoundError } from '../../../src/application/errors/userErrors';
import { TransakAccessToken } from '../../../src/shared/types';

describe('CryptoPurchaseService unit test', () => {
  let cryptoPurchaseService: CryptoPurchaseService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockCacheClient: jest.Mocked<ICachePort>;
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
    } as unknown as jest.Mocked<ICachePort>;

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
      testPurchase.fiatAmount = fiatAmount;
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
      );

      expect(result).toBe(expectedWidgetUrl);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: userId },
      });
      expect(mockPurchaseDomainService.createPurchase).toHaveBeenCalledWith(
        testUser,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(testPurchase);
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        testPurchase.id.toString(),
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
      );

      expect(mockCacheClient.get).toHaveBeenCalledWith('accessToken');
      expect(mockPurchaseClient.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockCacheClient.set).not.toHaveBeenCalled();
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        testPurchase.id.toString(),
      );
    });

    it('should refresh access token when cached token is expired', async () => {
      const expiredToken: TransakAccessToken = {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000, // expired 1 second ago
      };
      const newToken: TransakAccessToken = {
        accessToken: 'new-fresh-token',
        expiresAt: Date.now() + 3600000,
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
      );

      expect(mockCacheClient.get).toHaveBeenCalledWith('accessToken');
      expect(mockPurchaseClient.refreshAccessToken).toHaveBeenCalled();
      expect(mockCacheClient.set).toHaveBeenCalledWith('accessToken', newToken);
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        newToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        testPurchase.id.toString(),
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
      );

      expect(mockCacheClient.get).toHaveBeenCalledWith('accessToken');
      expect(mockPurchaseClient.refreshAccessToken).toHaveBeenCalled();
      expect(mockCacheClient.set).toHaveBeenCalledWith('accessToken', newToken);
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        newToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        testPurchase.id.toString(),
      );
    });

    it('should pass correct partnerCustomerId (purchase id) to widget url', async () => {
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
      );

      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        '12345', // partnerCustomerId should be the saved purchase id as string
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
      );

      expect(mockPurchaseDomainService.createPurchase).toHaveBeenCalledWith(
        testUser,
        'BTC',
        'EUR',
        500,
      );
      expect(mockPurchaseClient.createWidgetUrl).toHaveBeenCalledWith(
        cachedToken.accessToken,
        'BTC',
        'EUR',
        500,
        testPurchase.id.toString(),
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
      );

      expect(callOrder).toEqual(['save', 'createWidgetUrl']);
    });
  });
});
