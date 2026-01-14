import { EntityManager } from 'typeorm';
import { TransakPurchaseClient } from '../../infra/purchase/transakPurchaseClient';
import { ICachePort } from '../ports/ICachePort';
import { TransakAccessToken } from '../../shared/types';
import { UserNotFoundError } from '../errors/userErrors';
import { PurchaseNotFoundError } from '../errors/purchaseErrors';
import { User } from '../../domain/entities/user';
import { CryptoPurchase } from '../../domain/entities/cryptoPurchase';
import { CryptoPurchaseDomainService } from '../../domain/service/cryptoPurchaseDomainService';

export class CryptoPurchaseService {
  constructor(
    private entityManager: EntityManager,
    private cacheClient: ICachePort,
    private purchaseClient: TransakPurchaseClient,
    private purchaseDomainService: CryptoPurchaseDomainService,
  ) {}

  private async getAccessToken(): Promise<string> {
    const tokenData =
      await this.cacheClient.get<TransakAccessToken>('accessToken');
    const needRefresh: boolean = tokenData
      ? Date.now() >= tokenData.expiresAt
        ? true
        : false
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
    fiatAmount: number,
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

    const purchase = this.purchaseDomainService.createPurchase(
      user,
      cryptoCurrencyCode,
      fiatCurrency,
      fiatAmount,
    );
    const savedPurchase = await this.entityManager.save(purchase);
    const accessToken = await this.getAccessToken();
    return await this.purchaseClient.createWidgetUrl(
      accessToken,
      cryptoCurrencyCode,
      fiatCurrency,
      fiatAmount,
      savedPurchase.id.toString(),
      purchase.id.toString(),
    );
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
    if (!purchaseId) {
      throw new PurchaseNotFoundError(
        'partnerCustomerId not provided in webhook',
      );
    }

    const purchase = await this.entityManager.findOne(CryptoPurchase, {
      where: { id: parseInt(purchaseId, 10) },
    });

    if (!purchase) {
      throw new PurchaseNotFoundError(
        `Purchase with id ${purchaseId} not found`,
      );
    }

    // Update purchase fields
    purchase.orderId = webhookData.id;
    purchase.status = webhookData.status;

    if (webhookData.cryptoAmount !== undefined) {
      purchase.cryptoAmount = webhookData.cryptoAmount;
    }

    return await this.entityManager.save(purchase);
  }

  async getAccessTokenForWebhook(): Promise<string> {
    return this.getAccessToken();
  }
}
