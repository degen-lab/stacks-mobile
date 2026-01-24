import { FastPoolClient } from '../../../src/infra/stacks/fastPoolClient';
import { GITHUB_API_KEY } from '../../../src/shared/constants';

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

    it('should correctly sum rewards for contiguous cycles', async () => {
      // Mock GitHub API response with cycles as object (actual structure)
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            totalRewards: 150000000,
            address: testAddress,
            cycles: {
              '10': { cycle: 10, rewards: 50000000 },
              '11': { cycle: 11, rewards: 100000000 },
            },
          }),
        ).toString('base64'),
        encoding: 'base64',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(
        testAddress,
        10,
        12,
      );

      expect(result).toBe(150000000);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/friedger/stacking/contents/packages/home/data/users/${testAddress}.json`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            Authorization: `Bearer ${GITHUB_API_KEY}`,
          },
        },
      );
    });

    it('should break on first missing cycle', async () => {
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            cycles: {
              '10': { cycle: 10, rewards: 50000000 },
              // cycle 11 is missing
              '12': { cycle: 12, rewards: 100000000 },
            },
          }),
        ).toString('base64'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(
        testAddress,
        10,
        13,
      );

      // Should only count cycle 10, break at 11
      expect(result).toBe(50000000);
    });

    it('should handle null endCycleId and loop until missing cycle', async () => {
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            cycles: {
              '10': { cycle: 10, rewards: 30000000 },
              '11': { cycle: 11, rewards: 40000000 },
              '12': { cycle: 12, rewards: 50000000 },
              // cycle 13 missing - will break here
            },
          }),
        ).toString('base64'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(
        testAddress,
        10,
        null,
      );

      // Should sum cycles 10, 11, 12 and break at 13
      expect(result).toBe(120000000);
    });

    it('should return 0 when start cycle does not exist', async () => {
      const mockGitHubResponse = {
        content: Buffer.from(
          JSON.stringify({
            cycles: {
              '10': { cycle: 10, rewards: 50000000 },
            },
          }),
        ).toString('base64'),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubResponse,
      });

      const result = await fastPoolClient.delegationTotalRewards(
        testAddress,
        5,
        15,
      );

      // Starts at cycle 5 which doesn't exist, breaks immediately
      expect(result).toBe(0);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        fastPoolClient.delegationTotalRewards(testAddress, 10, 20),
      ).rejects.toThrow('GitHub API error: 404 Not Found');
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
        fastPoolClient.delegationTotalRewards(testAddress, 10, 20),
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
        fastPoolClient.delegationTotalRewards(testAddress, 10, 20),
      ).rejects.toThrow();
    });
  });

  describe('getRewardFolderRef', () => {
    it('should return the SHA of the latest commit', async () => {
      const mockCommits = [
        {
          sha: 'abc123def456',
          commit: {
            message: 'add rewards 126',
            author: { name: 'friedger', date: '2026-01-17T23:05:52Z' },
          },
        },
        {
          sha: 'def789ghi012',
          commit: {
            message: 'add rewards 125',
            author: { name: 'friedger', date: '2026-01-15T20:00:00Z' },
          },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      });

      const result = await fastPoolClient.getRewardFolderRef();

      expect(result).toBe('abc123def456');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/friedger/stacking/commits?path=packages/home/data/rewards',
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            Authorization: `Bearer ${GITHUB_API_KEY}`,
          },
        },
      );
    });

    it('should throw error when no commits found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await expect(fastPoolClient.getRewardFolderRef()).rejects.toThrow(
        'No commits found for rewards folder',
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(fastPoolClient.getRewardFolderRef()).rejects.toThrow(
        'GitHub API error: 403 Forbidden',
      );
    });
  });

  // Real API test - skipped by default, run manually to verify actual API
  // eslint-disable-next-line jest/no-disabled-tests
  describe.skip('Real API Integration', () => {
    it('should fetch real data from GitHub API for test address', async () => {
      // Restore original fetch for real API call
      global.fetch = originalFetch;

      const realClient = new FastPoolClient();
      const testAddress = 'SP12PM8QG33GPCAH3Z22JFSZ897Q6RA1PWF39PCF2';

      // Test with specific cycle range (address has cycles 14, 16, 18, 20)
      const result = await realClient.delegationTotalRewards(
        testAddress,
        14,
        21,
      );

      console.log('Total rewards for', testAddress, 'cycles 14-20:', result);

      // Verify result is a number
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      // Will return 477296 (only cycle 14) due to break on missing cycle 15
      expect(result).toBe(477296);

      // Restore mock after test
      global.fetch = mockFetch;
    }, 15000);

    it('should fetch reward folder reference', async () => {
      global.fetch = originalFetch;

      const realClient = new FastPoolClient();
      const ref = await realClient.getRewardFolderRef();

      console.log('Latest reward folder commit SHA:', ref);

      expect(typeof ref).toBe('string');
      expect(ref).toHaveLength(40); // Git SHA is 40 characters

      global.fetch = mockFetch;
    }, 15000);
  });
});
