import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RefObject } from "react";
import { Modal, ScrollView, View, Text } from "@/components/ui";
import { Wallet } from "lucide-react-native";

type Props = {
  modalRef: RefObject<BottomSheetModal>;
};

export function StackingGuideModal({ modalRef }: Props) {
  return (
    <Modal ref={modalRef} snapPoints={["65%"]} title="How Stacking Works">
      <View className="flex-1 px-6 pb-8">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-6">
            <GuideSection
              number={1}
              title="You stay in control"
              body="Your STX stays in your wallet. You’re only granting permission to lock it for rewards — we can’t move it."
            />

            <GuideSection
              number={2}
              title="Locked by cycles"
              body="Stacking works in reward cycles. Your STX locks for one cycle at a time and can renew automatically."
            />

            <GuideSection
              number={3}
              title="You earn rewards"
              body="While your STX is locked, you earn rewards each cycle. The reward amount can change from cycle to cycle."
            />

            <GuideSection
              number={4}
              title="Fast Pool payouts"
              body="Fast Pool pays rewards in STX on the Stacks network, which keeps payouts fast and low-cost — even for smaller amounts."
            />
          </View>

          <View className="mt-8 mb-4 border-t border-surface-secondary/50 pt-4">
            <View className="flex-row items-center justify-center gap-2">
              <Wallet size={16} color="#78716c" />
              <Text className="text-xs font-instrument-sans text-secondary">
                After revoking, funds unlock after the current cycle ends.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function GuideSection({
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row gap-4">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
        <Text className="font-matter font-bold text-primary">{number}</Text>
      </View>

      <View className="flex-1 pt-1">
        <Text className="mb-1 font-matter text-base text-primary">{title}</Text>
        <Text className="font-instrument-sans text-sm leading-5 text-secondary">
          {body}
        </Text>
      </View>
    </View>
  );
}
