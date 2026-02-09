import { EntityManager } from 'typeorm';
import { TransakPurchaseClient } from '../../infra/purchase/transakPurchaseClient';
import { ICachePort } from '../ports/ICachePort';
import { AppPlatform, TransakAccessToken } from '../../shared/types';
import { UserNotFoundError } from '../errors/userErrors';
import { PurchaseNotFoundError } from '../errors/purchaseErrors';
import { User } from '../../domain/entities/user';
import { CryptoPurchase } from '../../domain/entities/cryptoPurchase';
import { CryptoPurchaseDomainService } from '../../domain/service/cryptoPurchaseDomainService';
import { logger } from '../../api/helpers/logger';

export class CryptoPurchaseService {
  constructor(
    private entityManager: EntityManager,
    private cacheClient: ICachePort,
    private purchaseClient: TransakPurchaseClient,
    private purchaseDomainService: CryptoPurchaseDomainService,
  ) {}

  private async getAccessToken(): Promise<string> {
    let tokenData: TransakAccessToken | undefined = undefined;
    try {
      tokenData = await this.cacheClient.get<TransakAccessToken>('accessToken');
    } catch {
      logger.info('No access token found in cache, refreshing');
    }
    // expiresAt from Transak is in seconds (Unix timestamp), Date.now() is milliseconds
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const needRefresh: boolean = tokenData
      ? nowInSeconds >= tokenData.expiresAt
      : true;
    if (needRefresh) {
      const newAccessTokenData: TransakAccessToken =
        await this.purchaseClient.refreshAccessToken();
      await this.cacheClient.set('accessToken', newAccessTokenData);
      return newAccessTokenData.accessToken;
    }
    return tokenData!.accessToken;
  }

  async createPurchaseSession(
    userId: number,
    cryptoCurrencyCode: string,
    fiatCurrency: string,
    fiatAmount: number | undefined,
    cryptoAmount: number | undefined,
    platform: AppPlatform,
    productsAvailed: string,
    walletAddress?: string,
  ): Promise<string> {
    const user = await this.entityManager.findOne(User, {
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UserNotFoundError(
        `Error: User with id ${userId} doesn't exists`,
      );
    }

    const fiatAmountCents =
      fiatAmount === undefined ? undefined : Math.round(fiatAmount * 100);
    const cryptoDecimals = this.getCryptoDecimals(cryptoCurrencyCode);
    const cryptoAmountBaseUnits =
      cryptoAmount === undefined
        ? undefined
        : Math.round(cryptoAmount * Math.pow(10, cryptoDecimals));

    const purchase = this.purchaseDomainService.createPurchase(
      user,
      cryptoCurrencyCode,
      fiatCurrency,
      fiatAmountCents,
      cryptoAmountBaseUnits,
    );
    let savedPurchase: CryptoPurchase;
    try {
      savedPurchase = await this.entityManager.save(purchase);
    } catch (error) {
      logger.error({
        msg: 'Failed to save purchase',
        err: error,
        userId: user.id,
        cryptoCurrencyCode,
        fiatCurrency,
        fiatAmount,
        cryptoAmount,
      });
      throw error;
    }
    const accessToken = await this.getAccessToken();
    return await this.purchaseClient.createWidgetUrl(
      accessToken,
      cryptoCurrencyCode,
      fiatCurrency,
      fiatAmount,
      cryptoAmount,
      user.id.toString(),
      savedPurchase.id.toString(),
      platform,
      productsAvailed,
      walletAddress,
    );
  }

  private getCryptoDecimals(cryptoCurrencyCode: string): number {
    return cryptoCurrencyCode.toUpperCase() === 'STX' ? 6 : 8;
  }

  async updatePurchaseFromWebhook(webhookData: {
    id: string; // Transak order ID
    partnerCustomerId?: string;
    partnerOrderId?: string; // Our purchase ID
    status: string;
    cryptoAmount?: number;
    transactionHash?: string;
  }): Promise<CryptoPurchase> {
    const purchaseId = webhookData.partnerOrderId;
    const partnerCustomerId = webhookData.partnerCustomerId;
    if (!purchaseId) {
      throw new PurchaseNotFoundError('puchase not provided in webhook');
    }
    if (!partnerCustomerId) {
      throw new PurchaseNotFoundError(
        'partnerCustomerId not provided in webhook',
      );
    }

    const purchase = await this.entityManager.findOne(CryptoPurchase, {
      where: {
        id: parseInt(purchaseId, 10),
        user: { id: parseInt(partnerCustomerId, 10) },
      },
    });

    if (!purchase) {
      throw new PurchaseNotFoundError(
        `Purchase with id ${purchaseId} not found`,
      );
    }

    // Update purchase fields
    purchase.status = webhookData.status;

    if (webhookData.cryptoAmount !== undefined) {
      const cryptoDecimals = this.getCryptoDecimals(
        purchase.cryptoCurrencyCode,
      );
      purchase.cryptoAmount = Math.round(
        webhookData.cryptoAmount * Math.pow(10, cryptoDecimals),
      );
    }

    return await this.entityManager.save(purchase);
  }

  async getAccessTokenForWebhook(): Promise<string> {
    return this.getAccessToken();
  }
}
