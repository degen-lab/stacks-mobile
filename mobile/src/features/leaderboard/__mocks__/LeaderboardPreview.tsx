/**
 * Visual Testing Component for Leaderboard
 *
 * Usage in development:
 * import { LeaderboardPreview } from '@/features/leaderboard/__mocks__/LeaderboardPreview';
 * <LeaderboardPreview />
 */

import { useState } from "react";
import { ScrollView, Pressable } from "react-native";
import { Text, View } from "@/components/ui";
import { buildPodiumUsers, buildLeaderboardUsers } from "../utils";
import { Podium } from "../components/podium";
import { LeaderboardList } from "../components/leaderboard-list";
import {
  mockLeaderboardData,
  mockLeaderboardDataUserInTop3,
  mockLeaderboardDataUserRank1,
  mockLeaderboardDataNoUserSubmission,
  mockLeaderboardDataFewUsers,
  mockLeaderboardDataAnonymous,
} from "./mockLeaderboardData";

const mockScenarios = {
  "Normal (User at rank 400)": mockLeaderboardData,
  "User in Top 3 (Rank 2)": mockLeaderboardDataUserInTop3,
  "User is Rank 1 (Gold)": mockLeaderboardDataUserRank1,
  "No User Submission Yet": mockLeaderboardDataNoUserSubmission,
  "Few Users (Only 2)": mockLeaderboardDataFewUsers,
  "Anonymous Users Mixed": mockLeaderboardDataAnonymous,
} as const;

type ScenarioKey = keyof typeof mockScenarios;

export const LeaderboardPreview = () => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>(
    "Normal (User at rank 400)",
  );

  const data = mockScenarios[selectedScenario];
  const podiumUsers = buildPodiumUsers(data);
  const leaderboardUsers = buildLeaderboardUsers(data);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">
          Leaderboard Visual Testing
        </Text>

        <View className="mb-6">
          <Text className="text-sm font-semibold mb-2 text-secondary">
            Select Scenario:
          </Text>
          {Object.keys(mockScenarios).map((scenario) => (
            <Pressable
              key={scenario}
              onPress={() => setSelectedScenario(scenario as ScenarioKey)}
              className={`p-3 mb-2 rounded-lg ${
                selectedScenario === scenario
                  ? "bg-primary"
                  : "bg-card border border-border"
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedScenario === scenario ? "text-white" : "text-primary"
                }`}
              >
                {scenario}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* REAL Podium Component */}
        <View className="mb-6">
          <Text className="text-xl font-bold mb-3">Podium (Top 3)</Text>
          <Podium users={podiumUsers} />
        </View>

        {/* REAL LeaderboardList Component */}
        <View className="mb-6">
          <Text className="text-xl font-bold mb-3">
            Leaderboard List (After Top 3)
          </Text>
          <LeaderboardList
            users={leaderboardUsers}
            currentUserRank={data.userPosition}
          />
        </View>
      </View>
    </ScrollView>
  );
};
