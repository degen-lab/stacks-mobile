import { CryptoPurchase } from "../entities/cryptoPurchase";
import { User } from "../entities/user";

export class CryptoPurchaseDomainService {

  createPurchase(user: User, cryptoCurrencyCode: string, fiatCurrency: string, cryptoAmount: number): CryptoPurchase {
    const purchase = new CryptoPurchase();
    purchase.cryptoCurrencyCode = cryptoCurrencyCode;
    purchase.fiatCurrency = fiatCurrency;
    purchase.user = user;
    purchase.fiatAmount = cryptoAmount;
    return purchase;
  }
} 
