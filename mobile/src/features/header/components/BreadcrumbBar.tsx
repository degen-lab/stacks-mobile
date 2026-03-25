import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import { HelpCircle } from "lucide-react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Pressable, Text, View, colors, useModal } from "@/components/ui";
import { getEarnAssetBreadcrumbLabel } from "@/features/earn/lib/asset-route";
import { truncateAddress } from "@/lib/stacks/addresses";
import { EarnHelpModal } from "@/features/earn/components/earn-help-modal";
import { ConnectedWallet } from "@/features/header/components/connected-wallet";
import { BridgeHelpModal } from "@/features/sbtc-bridge/components/bridge-help-modal";
import { DualStackingHelpModal } from "@/features/dual-stacking/components/layout/modals/dual-stacking-help-modal";
import { StackingGuideModal } from "@/features/stacking/components/stacking-guide-modal";

type Crumb = { label: string; path?: string };
type HeaderHelpKind = "earn" | "bridge" | "stacking" | "dual-stacking";
type BreadcrumbConfig = {
  crumbs: Crumb[];
  helpKind?: HeaderHelpKind;
  walletVariant?: "default" | "dual-stacking";
};

function extractSegmentId(pathname: string, segment: string): string {
  const parts = pathname.split("/");
  const idx = parts.findLastIndex((p) => p === segment);
  return parts[idx + 1] ?? "";
}

function getBreadcrumbConfig(
  pathname: string,
  assetLabel?: string | string[],
): BreadcrumbConfig | null {
  const isEarnHome =
    pathname === "/Earn" ||
    pathname === "/(app)/Earn" ||
    pathname === "/Earn/" ||
    pathname === "/(app)/Earn/";

  if (isEarnHome) {
    return {
      crumbs: [{ label: "Earn" }],
      helpKind: "earn",
      walletVariant: "default",
    };
  }

  if (
    pathname.includes("/Earn/sbtc-bridge/deposit/") &&
    pathname.endsWith("/reclaim")
  ) {
    return {
      crumbs: [
        { label: "Earn", path: "/Earn" },
        { label: "sBTC Bridge", path: "/Earn/sbtc-bridge" },
        { label: "Activity", path: "/Earn/sbtc-bridge/activity" },
        { label: "Reclaim" },
      ],
    };
  }
  if (pathname.includes("/Earn/sbtc-bridge/deposit/")) {
    return {
      crumbs: [
        { label: "Earn", path: "/Earn" },
        { label: "sBTC Bridge", path: "/Earn/sbtc-bridge" },
        { label: "Activity", path: "/Earn/sbtc-bridge/activity" },
        {
          label: `Deposit ${truncateAddress(extractSegmentId(pathname, "deposit"))}`,
        },
      ],
    };
  }
  if (pathname.includes("/Earn/sbtc-bridge/withdraw/")) {
    return {
      crumbs: [
        { label: "Earn", path: "/Earn" },
        { label: "sBTC Bridge", path: "/Earn/sbtc-bridge" },
        { label: "Activity", path: "/Earn/sbtc-bridge/activity" },
        {
          label: `Withdrawal ${truncateAddress(extractSegmentId(pathname, "withdraw"))}`,
        },
      ],
    };
  }
  if (pathname.includes("/Earn/sbtc-bridge/activity")) {
    return {
      crumbs: [
        { label: "Earn", path: "/Earn" },
        { label: "sBTC Bridge", path: "/Earn/sbtc-bridge" },
        { label: "Activity" },
      ],
      helpKind: "bridge",
      walletVariant: "default",
    };
  }
  if (pathname.includes("/Earn/sbtc-bridge")) {
    return {
      crumbs: [{ label: "Earn", path: "/Earn" }, { label: "sBTC Bridge" }],
      helpKind: "bridge",
      walletVariant: "default",
    };
  }
  if (pathname.includes("/Earn/stacking")) {
    return {
      crumbs: [{ label: "Earn", path: "/Earn" }, { label: "Stack STX" }],
      helpKind: "stacking",
      walletVariant: "default",
    };
  }
  if (pathname.includes("/Earn/dual-stacking")) {
    return {
      crumbs: [{ label: "Earn", path: "/Earn" }, { label: "Dual Stacking" }],
      helpKind: "dual-stacking",
      walletVariant: "dual-stacking",
    };
  }
  if (pathname.includes("/Earn/assets/")) {
    return {
      crumbs: [
        { label: "Earn", path: "/Earn" },
        { label: getEarnAssetBreadcrumbLabel(assetLabel) },
      ],
      walletVariant: "default",
    };
  }
  return null;
}

function HeaderHelpButton({
  onPress,
  accessibilityLabel = "Help",
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HelpCircle size={16} color={colors.secondary} />
    </Pressable>
  );
}

export function BreadcrumbBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { assetLabel } = useGlobalSearchParams<{
    assetLabel?: string | string[];
  }>();
  const { ref: earnHelpModalRef, present: presentEarnHelp } = useModal();
  const { ref: bridgeHelpModalRef, present: presentBridgeHelp } = useModal();
  const { ref: stackingHelpModalRef, present: presentStackingHelp } =
    useModal();
  const { ref: dualStackingHelpModalRef, present: presentDualStackingHelp } =
    useModal();

  const config = getBreadcrumbConfig(pathname, assetLabel);
  if (!config) return null;

  const handleHelpPress = () => {
    if (config.helpKind === "earn") {
      presentEarnHelp();
      return;
    }
    if (config.helpKind === "bridge") {
      presentBridgeHelp();
      return;
    }
    if (config.helpKind === "stacking") {
      presentStackingHelp();
      return;
    }
    if (config.helpKind === "dual-stacking") {
      presentDualStackingHelp();
    }
  };

  return (
    <>
      <View className="mx-4 flex-row items-center justify-between gap-3 border-b border-surface-secondary h-12">
        <View className="flex-1 flex-row items-center gap-1.5">
          {config.crumbs.map((crumb, i) => {
            return (
              <View key={crumb.label} className="flex-row items-center gap-1.5">
                {i > 0 && (
                  <Text className="font-matter text-sm text-secondary">
                    {">"}
                  </Text>
                )}
                {crumb.path ? (
                  <Pressable
                    onPress={() => router.push(crumb.path as any)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to ${crumb.label}`}
                  >
                    <Text className="font-matter text-sm text-secondary">
                      {crumb.label}
                    </Text>
                  </Pressable>
                ) : (
                  <Text className="font-matter text-sm font-medium text-primary">
                    {crumb.label}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {config.helpKind || config.walletVariant ? (
          <View className="flex-row items-center gap-1.5">
            {config.helpKind ? (
              <HeaderHelpButton onPress={handleHelpPress} />
            ) : null}
            {config.walletVariant ? (
              <ConnectedWallet variant={config.walletVariant} />
            ) : null}
          </View>
        ) : null}
      </View>

      <EarnHelpModal
        modalRef={earnHelpModalRef as React.RefObject<BottomSheetModal>}
      />
      <BridgeHelpModal
        modalRef={bridgeHelpModalRef as React.RefObject<BottomSheetModal>}
      />
      <DualStackingHelpModal
        modalRef={dualStackingHelpModalRef as React.RefObject<BottomSheetModal>}
      />
      <StackingGuideModal
        modalRef={stackingHelpModalRef as React.RefObject<BottomSheetModal>}
      />
    </>
  );
}
