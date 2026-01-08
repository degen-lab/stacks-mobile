import { useStacksPrice } from "@/api/market/use-stacks-price";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { RelativePathString, useRouter } from "expo-router";
import HomeScreenLayout from "./Home.layout";

export default function HomeScreen() {
  const { balance: stxBalance } = useStxBalance();
  const router = useRouter();
  const { data: stxPriceUsd } = useStacksPrice();

  const navigateToPortfolio = () => {
    router.push("/(app)/Earn" as RelativePathString);
  };

  const navigateToPlay = () => {
    router.push("/(app)/Play" as RelativePathString);
  };

  const navigateToEarn = () => {
    router.push("/(app)/Earn" as RelativePathString);
  };

  const navigateToReferral = () => {
    router.push("/referral" as RelativePathString);
  };

  return (
    <HomeScreenLayout
      usdBalance={stxPriceUsd ? stxBalance * stxPriceUsd : 0}
      navigateToPortfolio={navigateToPortfolio}
      navigateToPlay={navigateToPlay}
      navigateToEarn={navigateToEarn}
      navigateToReferral={navigateToReferral}
    />
  );
}
