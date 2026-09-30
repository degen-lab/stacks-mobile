import { TransakPurchaseClient } from '../../../src/infra/purchase/transakPurchaseClient';
import { AppPlatform } from '../../../src/shared/types';

describe('TransakPurchaseClient', () => {
  const originalFetch = global.fetch;
  const endUserIp = '203.0.113.10';

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('sends partner and end-user IP headers when creating a widget URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { widgetUrl: 'https://transak.test/widget' },
      }),
    });

    const client = new TransakPurchaseClient();

    await client.createWidgetUrl(
      'access-token',
      'STX',
      'USD',
      100,
      undefined,
      '1',
      '2',
      AppPlatform.IOS,
      'BUY',
      endUserIp,
      'wallet-address',
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': expect.any(String),
          'x-user-ip': endUserIp,
        }),
      }),
    );
  });

  it('sends partner and end-user IP headers when fetching a quote', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ response: { cryptoAmount: 1 } }),
    });

    const client = new TransakPurchaseClient();

    await client.getQuote(
      {
        fiatAmount: 100,
        cryptoCurrency: 'STX',
      },
      endUserIp,
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/pricing/public/quotes?'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': expect.any(String),
          'x-user-ip': endUserIp,
        }),
      }),
    );
  });

  it('sends partner API key header when refreshing an access token', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { accessToken: 'access-token', expiresAt: 4102444800 },
      }),
    });

    const client = new TransakPurchaseClient();

    await client.refreshAccessToken();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/partners/api/v2/refresh-token'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': expect.any(String),
        }),
      }),
    );
  });
});
