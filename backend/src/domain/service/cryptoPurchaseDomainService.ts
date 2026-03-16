import { CryptoPurchase } from '../entities/cryptoPurchase';
import { User } from '../entities/user';

export class CryptoPurchaseDomainService {
  createPurchase(
    user: User,
    cryptoCurrencyCode: string,
    fiatCurrency: string,
    fiatAmount?: number,
    cryptoAmount?: number,
  ): CryptoPurchase {
    const purchase = new CryptoPurchase();
    purchase.cryptoCurrencyCode = cryptoCurrencyCode;
    purchase.fiatCurrency = fiatCurrency;
    purchase.user = user;
    if (fiatAmount !== undefined) purchase.fiatAmount = fiatAmount;
    if (cryptoAmount !== undefined) purchase.cryptoAmount = cryptoAmount;
    return purchase;
  }
}
