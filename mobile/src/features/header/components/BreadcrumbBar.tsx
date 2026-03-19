import { usePathname, useRouter } from "expo-router";
import { HelpCircle } from "lucide-react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Pressable, Text, View, colors, useModal } from "@/components/ui";
import { truncateAddress } from "@/lib/stacks/addresses";
import ConnectWallet from "@/features/dual-stacking/components/wallet/wallet-connected";
import { BridgeHelpModal } from "@/features/sbtc-bridge/components/bridge-help-modal";
import { DualStackingHelpModal } from "@/features/dual-stacking/components/layout/modals/dual-stacking-help-modal";
import { StackingGuideModal } from "@/features/stacking/components/stacking-guide-modal";

type Crumb = { label: string; path?: string };

function extractSegmentId(pathname: string, segment: string): string {
  const parts = pathname.split("/");
  const idx = parts.findLastIndex((p) => p === segment);
  return parts[idx + 1] ?? "";
}

function getCrumbs(pathname: string): Crumb[] | null {
  if (
    pathname.includes("/Earn/bridge/deposit/") &&
    pathname.endsWith("/reclaim")
  ) {
    return [
      { label: "Earn", path: "/Earn" },
      { label: "sBTC Bridge", path: "/Earn/bridge" },
      { label: "Activity", path: "/Earn/bridge/activity" },
      { label: "Reclaim" },
    ];
  }
  if (pathname.includes("/Earn/bridge/deposit/")) {
    return [
      { label: "Earn", path: "/Earn" },
      { label: "sBTC Bridge", path: "/Earn/bridge" },
      { label: "Activity", path: "/Earn/bridge/activity" },
      {
        label: `Deposit ${truncateAddress(extractSegmentId(pathname, "deposit"))}`,
      },
    ];
  }
  if (pathname.includes("/Earn/bridge/withdraw/")) {
    return [
      { label: "Earn", path: "/Earn" },
      { label: "sBTC Bridge", path: "/Earn/bridge" },
      { label: "Activity", path: "/Earn/bridge/activity" },
      {
        label: `Withdrawal ${truncateAddress(extractSegmentId(pathname, "withdraw"))}`,
      },
    ];
  }
  if (pathname.includes("/Earn/bridge/activity")) {
    return [
      { label: "Earn", path: "/Earn" },
      { label: "sBTC Bridge", path: "/Earn/bridge" },
      { label: "Activity" },
    ];
  }
  if (pathname.includes("/Earn/bridge")) {
    return [{ label: "Earn", path: "/Earn" }, { label: "sBTC Bridge" }];
  }
  if (pathname.includes("/Earn/stacking")) {
    return [{ label: "Earn", path: "/Earn" }, { label: "Stack STX" }];
  }
  if (pathname.includes("/Earn/dual-stacking")) {
    return [{ label: "Earn", path: "/Earn" }, { label: "Dual Stacking" }];
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
      <HelpCircle size={14} color={colors.secondary} />
    </Pressable>
  );
}

export function BreadcrumbBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { ref: bridgeHelpModalRef, present: presentBridgeHelp } = useModal();
  const { ref: stackingHelpModalRef, present: presentStackingHelp } =
    useModal();
  const { ref: dualStackingHelpModalRef, present: presentDualStackingHelp } =
    useModal();

  const crumbs = getCrumbs(pathname);
  if (!crumbs) return null;

  const isBridgeHome =
    pathname === "/Earn/bridge" ||
    pathname === "/(app)/Earn/bridge" ||
    pathname === "/Earn/bridge/" ||
    pathname === "/(app)/Earn/bridge/";
  const isDualStacking =
    pathname.includes("/Earn/dual-stacking") ||
    pathname.includes("/(app)/Earn/dual-stacking");
  const isStacking =
    pathname.includes("/Earn/stacking") ||
    pathname.includes("/(app)/Earn/stacking");

  return (
    <>
      <View className="mx-4 flex-row items-center justify-between gap-3 border-b border-surface-secondary h-10">
        <View className="flex-1 flex-row items-center gap-1.5">
          {crumbs.map((crumb, i) => {
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

        {isDualStacking ? (
          <View className="flex-row items-center gap-1.5">
            <HeaderHelpButton onPress={presentDualStackingHelp} />
            <ConnectWallet />
          </View>
        ) : isBridgeHome ? (
          <HeaderHelpButton onPress={presentBridgeHelp} />
        ) : isStacking ? (
          <HeaderHelpButton onPress={presentStackingHelp} />
        ) : null}
      </View>

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
