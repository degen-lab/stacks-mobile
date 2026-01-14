import { TRANSAK_API_KEY, TRANSAK_API_SECRET, TRANSAK_BASE_URL, TRANSAK_USER_AUTH_TOKEN } from "../../shared/constants";
import { TransakAccessToken, TransakApiRoutes } from "../../shared/types";

export class TransakPurchaseClient { 
 

  async createWidgetUrl(accessToken: string, cryptoCurrencyCode: string, fiatCurrency: string, fiatAmount: number, partnerCustomerId): Promise<string> {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'access-token': accessToken,
        authorization: TRANSAK_USER_AUTH_TOKEN,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey: TRANSAK_API_KEY,
          referrerDomain: 'TRANSAK_REFERRER_DOMAIN',
          cryptoCurrencyCode,
          fiatCurrency,
          fiatAmount,
          partnerCustomerId
        }
      })
    };
    const response = await fetch(`${TRANSAK_BASE_URL}${TransakApiRoutes.CREATE_WIDGET_URL}`, options)
    const responseBody = await response.json();
    return responseBody.data.widgetUrl;
  }

  async refreshAccessToken(): Promise<TransakAccessToken> {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-secret': TRANSAK_API_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: TRANSAK_API_KEY,
      })
    };

    const response = await fetch(`${TRANSAK_BASE_URL}${TransakApiRoutes.REFRESH_ACCESS_TOKEN}`, options);
    const responseBody = await response.json();
    return responseBody.data;
  }
}
