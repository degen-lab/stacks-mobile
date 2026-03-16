import { useEffect } from "react";
import { ArrowLeft } from "lucide-react-native";

import { Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useSaveTerms } from "@/api/dual-stacking/enrollment/use-save-terms";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowDetails: () => void;
  onAccept: () => void;
  address: string;
};

export function TermsAndConditionsSheet({
  open,
  onOpenChange,
  onShowDetails,
  onAccept,
  address,
}: Props) {
  const { ref, present, dismiss } = useModal();
  const { mutateAsync: saveTerms, isPending } = useSaveTerms();

  useEffect(() => {
    if (open) present();
    else dismiss();
  }, [open, present, dismiss]);

  const handleAgree = async () => {
    if (!address) return;
    try {
      await saveTerms({ address });
      onOpenChange(false);
      onAccept();
    } catch (err) {
      console.log("Error saving terms acceptance:", err);
    }
  };

  return (
    <Modal
      ref={ref}
      snapPoints={["60%"]}
      onDismiss={() => onOpenChange(false)}
      enablePanDownToClose
    >
      <View className="px-5 pb-6 gap-6">
        <View className="gap-3">
          <Text className="font-matter text-3xl text-primary leading-9">
            Accept Terms and{"\n"}Conditions
          </Text>
          <View className="flex-row flex-wrap items-center">
            <Text className="font-instrument-sans text-base text-secondary font-medium leading-6">
              To enroll, you must accept our{" "}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={onShowDetails}
              label="Terms & Conditions ↗"
              textClassName="text-secondary text-base underline"
            />
          </View>
        </View>

        <View className="flex-row gap-3 mt-4">
          <Button
            variant="outline"
            size="lg"
            onPress={() => onOpenChange(false)}
            className="flex-1"
            leftIcon={<ArrowLeft size={16} color="#78716c" />}
            label="Go back"
          />
          <Button
            variant="default"
            size="lg"
            onPress={handleAgree}
            disabled={isPending}
            loading={isPending}
            className="flex-1"
            label={isPending ? "Saving..." : "Accept and Continue"}
          />
        </View>
      </View>
    </Modal>
  );
}
