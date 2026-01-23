import { FastPoolClient } from '../../../src/infra/stacks/fastPoolClient';

// Save original fetch before mocking
const originalFetch = global.fetch;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FastPoolClient', () => {
  let fastPoolClient: FastPoolClient;

  beforeEach(() => {
    fastPoolClient = new FastPoolClient();
    jest.clearAllMocks();
  });

  describe('delegationTotalRewards', () => {
    const testAddress = 'SP12PM8QG33GPCAH3Z22JFSZ897Q6RA1PWF39PCF2';

    it('should correctly parse delegation total rewards from GitHub API response', async () => {
      // Mock GitHub API response structure
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            totalRewards: 150000000,
            address: testAddress,
            cycles: [
              { cycle: 1, reward: 50000000 },
              { cycle: 2, reward: 100000000 },
            ],
          }),
        ).toString('base64'),
        encoding: 'base64',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(testAddress);

      expect(result).toBe(150000000);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/friedger/stacking/contents/packages/home/data/users/${testAddress}.json`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );
    });

    it('should handle zero rewards', async () => {
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            totalRewards: 0,
            address: testAddress,
            cycles: [],
          }),
        ).toString('base64'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(testAddress);

      expect(result).toBe(0);
    });

    it('should handle large reward amounts', async () => {
      const largeAmount = 999999999999;
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            totalRewards: largeAmount,
            address: testAddress,
          }),
        ).toString('base64'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(testAddress);

      expect(result).toBe(largeAmount);
      expect(typeof result).toBe('number');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        fastPoolClient.delegationTotalRewards(testAddress),
      ).rejects.toThrow();
    });

    it('should handle invalid base64 encoding', async () => {
      const mockGitHubResponse = {
        content: 'invalid-base64-!@#$%',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      await expect(
        fastPoolClient.delegationTotalRewards(testAddress),
      ).rejects.toThrow();
    });

    it('should handle invalid JSON in decoded content', async () => {
      const mockGitHubResponse = {
        content: Buffer.from('not valid json').toString('base64'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      await expect(
        fastPoolClient.delegationTotalRewards(testAddress),
      ).rejects.toThrow();
    });
  });

  // Real API test - skipped by default, run manually to verify actual API
  describe.skip('Real API Integration', () => {
    it('should fetch real data from GitHub API for test address', async () => {
      // Restore original fetch for real API call
      global.fetch = originalFetch;

      const realClient = new FastPoolClient();
      const testAddress = 'SP12PM8QG33GPCAH3Z22JFSZ897Q6RA1PWF39PCF2';

      const result = await realClient.delegationTotalRewards(testAddress);

      console.log('Total rewards for', testAddress, ':', result);

      // Verify result is a number
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBe(991261); // Expected value for this address

      // Restore mock after test
      global.fetch = mockFetch;
    }, 15000); // 15 second timeout for real API call
  });
});
