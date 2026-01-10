import type { LeaderboardData, Submission } from "@/api/tournament";
import { buildPodiumUsers, buildLeaderboardUsers } from "../utils";

// Helper to create mock submission
const createSubmission = (
  id: number,
  score: number,
  userId?: number,
  nickName?: string,
  photoUri?: string,
): Submission =>
  ({
    id,
    score,
    user: userId
      ? {
          id: userId,
          nickName: nickName ?? `User${userId}`,
          photoUri,
        }
      : undefined,
  }) as Submission;

describe("Leaderboard Utils", () => {
  describe("buildPodiumUsers", () => {
    it("should return empty array when no data", () => {
      expect(buildPodiumUsers(undefined)).toEqual([]);
    });

    it("should build top 3 podium users with correct ranks and tiers", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
        ],
        gold: [createSubmission(1, 100, 1, "Alice")],
        silver: [createSubmission(2, 90, 2, "Bob")],
        bronze: [createSubmission(3, 80, 3, "Charlie")],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium).toHaveLength(3);
      expect(podium[0]).toMatchObject({
        rank: 1,
        name: "Alice",
        score: 100,
        tier: "Gold",
        isCurrentUser: false,
      });
      expect(podium[1]).toMatchObject({
        rank: 2,
        name: "Bob",
        score: 90,
        tier: "Silver",
      });
      expect(podium[2]).toMatchObject({
        rank: 3,
        name: "Charlie",
        score: 80,
        tier: "Bronze",
      });
    });

    it("should handle less than 3 users", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium).toHaveLength(2);
      expect(podium[0]).toMatchObject({ rank: 1, tier: "Gold" });
      expect(podium[1]).toMatchObject({ rank: 2, tier: "Silver" });
    });

    it("should handle single user", () => {
      const data: LeaderboardData = {
        top: [createSubmission(1, 100, 1, "Alice")],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium).toHaveLength(1);
      expect(podium[0]).toMatchObject({ rank: 1, tier: "Gold" });
    });

    it("should prioritize tier from tier arrays over rank-based tier", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
        ],
        gold: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
        ], // Both explicitly marked as gold
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium[0].tier).toBe("Gold");
      expect(podium[1].tier).toBe("Gold"); // Uses tier from array, not rank
    });

    it("should fallback to rank-based tier when not in tier arrays", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium[0].tier).toBe("Gold");
      expect(podium[1].tier).toBe("Silver");
      expect(podium[2].tier).toBe("Bronze");
    });

    it("should handle anonymous users", () => {
      const data: LeaderboardData = {
        top: [createSubmission(1, 100)], // No user data
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium[0].name).toBe("Anonymous");
      expect(podium[0].photoUri).toBeUndefined();
    });

    it("should include photo URI when available", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice", "https://example.com/photo.jpg"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const podium = buildPodiumUsers(data);

      expect(podium[0].photoUri).toEqual({
        uri: "https://example.com/photo.jpg",
      });
    });
  });

  describe("buildLeaderboardUsers", () => {
    it("should return empty array when no data", () => {
      expect(buildLeaderboardUsers(undefined)).toEqual([]);
    });

    it("should exclude top 3 by default", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
          createSubmission(5, 60, 5, "Eve"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data);

      expect(users).toHaveLength(2);
      expect(users[0]).toMatchObject({ rank: 4, name: "David", score: 70 });
      expect(users[1]).toMatchObject({ rank: 5, name: "Eve", score: 60 });
    });

    it("should include top 3 when excludeTop3 is false", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data, { excludeTop3: false });

      expect(users).toHaveLength(3);
      expect(users[0]).toMatchObject({ rank: 1, name: "Alice" });
      expect(users[1]).toMatchObject({ rank: 2, name: "Bob" });
      expect(users[2]).toMatchObject({ rank: 3, name: "Charlie" });
      expect(users[0].tier).toBeUndefined();
      expect(users[1].tier).toBeUndefined();
      expect(users[2].tier).toBeUndefined();
    });

    it("should not exclude anything when less than 3 users", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data, { excludeTop3: true });

      expect(users).toHaveLength(2);
      expect(users[0]).toMatchObject({ rank: 1, name: "Alice" });
      expect(users[1]).toMatchObject({ rank: 2, name: "Bob" });
    });

    it("should respect window size", () => {
      const data: LeaderboardData = {
        top: Array.from({ length: 20 }, (_, i) =>
          createSubmission(i + 1, 100 - i, i + 1, `User${i + 1}`),
        ),
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data, { windowSize: 5 });

      expect(users).toHaveLength(5);
      expect(users[0].rank).toBe(4); // Starts after top 3
      expect(users[4].rank).toBe(8);
    });

    it("should add current user at top when not in top array", () => {
      const currentUserSubmission = createSubmission(
        100,
        50,
        999,
        "CurrentUser",
      );
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 50,
      };

      const users = buildLeaderboardUsers(data);

      expect(users[0]).toMatchObject({
        rank: 50,
        name: "CurrentUser",
        score: 50,
        isCurrentUser: true,
      });
      expect(users[1]).toMatchObject({ rank: 4, name: "David" }); // First after top 3
    });

    it("should not add current user when submission has no user id", () => {
      const currentUserSubmission = createSubmission(100, 50);
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 50,
      };

      const users = buildLeaderboardUsers(data);

      expect(users[0]).toMatchObject({ rank: 4, name: "David" });
      const anonymousAtTop = users.find((u) => u.rank === 50);
      expect(anonymousAtTop).toBeUndefined();
    });

    it("should NOT duplicate current user when already in top array", () => {
      const currentUserSubmission = createSubmission(4, 70, 4, "David");
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
          createSubmission(5, 60, 5, "Eve"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 4,
      };

      const users = buildLeaderboardUsers(data);

      // David should only appear once
      const davidCount = users.filter((u) => u.name === "David").length;
      expect(davidCount).toBe(1);

      const david = users.find((u) => u.name === "David");
      expect(david).toMatchObject({
        rank: 4,
        isCurrentUser: true,
      });
    });

    it("should mark current user correctly when in top array", () => {
      const currentUserSubmission = createSubmission(4, 70, 4, "David");
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 4,
      };

      const users = buildLeaderboardUsers(data);

      expect(users).toHaveLength(1); // Only David after excluding top 3
      expect(users[0]).toMatchObject({
        name: "David",
        rank: 4,
        isCurrentUser: true,
      });
    });

    it("should NOT show current user in list when in top 3 and excludeTop3 is true", () => {
      const currentUserSubmission = createSubmission(1, 100, 1, "Alice");
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 1,
      };

      const listUsers = buildLeaderboardUsers(data);

      // Alice (current user) should NOT be in list
      const aliceInList = listUsers.find((u) => u.name === "Alice");
      expect(aliceInList).toBeUndefined();

      // List should start with David (rank 4)
      expect(listUsers[0]).toMatchObject({ rank: 4, name: "David" });
    });

    it("should show current user in list when in top 3 and excludeTop3 is false", () => {
      const currentUserSubmission = createSubmission(2, 90, 2, "Bob");
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 2,
      };

      const users = buildLeaderboardUsers(data, { excludeTop3: false });

      // Bob should appear in list and marked as current user
      const bob = users.find((u) => u.name === "Bob");
      expect(bob).toBeDefined();
      expect(bob?.isCurrentUser).toBe(true);
      expect(bob?.rank).toBe(2);

      // Should only appear once
      const bobCount = users.filter((u) => u.name === "Bob").length;
      expect(bobCount).toBe(1);
    });

    it("should assign tiers from tier arrays", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [createSubmission(4, 70, 4, "David")], // Rank 4 is explicitly gold
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data);

      expect(users[0]).toMatchObject({ name: "David", tier: "Gold" });
    });

    it("should have undefined tier when not in tier arrays and rank > 3", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data);

      expect(users[0].tier).toBeUndefined();
    });

    it("should handle empty top array with current user submission", () => {
      const currentUserSubmission = createSubmission(1, 100, 1, "Alice");
      const data: LeaderboardData = {
        top: [],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 1,
      };

      const users = buildLeaderboardUsers(data);

      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        rank: 1,
        name: "Alice",
        isCurrentUser: true,
      });
    });

    it("should handle window size larger than available users", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data, { windowSize: 20 });

      // Only David after excluding top 3
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe("David");
    });

    it("should respect window size when current user is prepended", () => {
      const currentUserSubmission = createSubmission(
        100,
        50,
        999,
        "CurrentUser",
      );
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 50,
      };

      const users = buildLeaderboardUsers(data, { windowSize: 1 });

      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        rank: 50,
        name: "CurrentUser",
        isCurrentUser: true,
      });
    });

    it("should use userPosition 0 when userPosition is null", () => {
      const currentUserSubmission = createSubmission(
        100,
        50,
        999,
        "CurrentUser",
      );
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data);

      expect(users[0]).toMatchObject({
        rank: 0,
        name: "CurrentUser",
        isCurrentUser: true,
      });
    });

    it("should handle anonymous users when excludeTop3 is false", () => {
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100),
          createSubmission(2, 90),
          createSubmission(3, 80),
          createSubmission(4, 70),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: null,
        userPosition: null,
      };

      const users = buildLeaderboardUsers(data, { excludeTop3: false });

      expect(users).toHaveLength(4);
      expect(users[0].name).toBe("Anonymous");
      expect(users[0].photoUri).toBeUndefined();
      expect(users[3]).toMatchObject({ rank: 4, name: "Anonymous" });
    });
  });

  describe("Integration: Podium + Leaderboard", () => {
    it("should not duplicate user when in top 3 with default excludeTop3", () => {
      const currentUserSubmission = createSubmission(2, 90, 2, "Bob");
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 2,
      };

      const podiumUsers = buildPodiumUsers(data);
      const listUsers = buildLeaderboardUsers(data); // excludeTop3: true by default

      // Bob should be in podium
      const bobInPodium = podiumUsers.find((u) => u.name === "Bob");
      expect(bobInPodium).toBeDefined();
      expect(bobInPodium?.rank).toBe(2);

      // Bob should NOT be in list (to avoid duplication)
      const bobInList = listUsers.find((u) => u.name === "Bob");
      expect(bobInList).toBeUndefined();

      // List should start after top 3
      expect(listUsers[0]).toMatchObject({ rank: 4, name: "David" });
    });

    it("should show current user outside top 3 in list but not in podium", () => {
      const currentUserSubmission = createSubmission(
        100,
        50,
        999,
        "CurrentUser",
      );
      const data: LeaderboardData = {
        top: [
          createSubmission(1, 100, 1, "Alice"),
          createSubmission(2, 90, 2, "Bob"),
          createSubmission(3, 80, 3, "Charlie"),
          createSubmission(4, 70, 4, "David"),
        ],
        gold: [],
        silver: [],
        bronze: [],
        userSubmission: currentUserSubmission,
        userPosition: 50,
      };

      const podiumUsers = buildPodiumUsers(data);
      const listUsers = buildLeaderboardUsers(data);

      // Current user should NOT be in podium
      const currentUserInPodium = podiumUsers.find((u) => u.isCurrentUser);
      expect(currentUserInPodium).toBeUndefined();

      // Current user should be at top of list
      expect(listUsers[0]).toMatchObject({
        rank: 50,
        name: "CurrentUser",
        isCurrentUser: true,
      });

      // Followed by rank 4+
      expect(listUsers[1]).toMatchObject({ rank: 4, name: "David" });
    });
  });
});
