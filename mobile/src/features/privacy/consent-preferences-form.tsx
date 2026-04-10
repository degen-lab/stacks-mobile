import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  View,
} from "@/components/ui";

type ConsentPreferencesFormProps = {
  analyticsEnabled: boolean;
  onAnalyticsChange: (value: boolean) => void;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  manageAdChoicesLabel?: string;
  onManageAdChoices?: () => void;
  manageAdChoicesLoading?: boolean;
  loading?: boolean;
  testIDPrefix?: string;
  withSafeArea?: boolean;
};

type PreferenceRowProps = {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testID: string;
  withDivider?: boolean;
};

function PreferenceRow({
  title,
  description,
  value,
  onChange,
  testID,
  withDivider = false,
}: PreferenceRowProps) {
  return (
    <View>
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 px-4 py-4">
          <Text className="font-instrument-sans text-base text-primary">
            {title}
          </Text>
          <Text className="mt-1 text-sm leading-6 text-secondary">
            {description}
          </Text>
        </View>
        <View className="pr-4">
          <Switch.Root
            checked={value}
            onChange={onChange}
            accessibilityLabel={title}
            testID={testID}
          >
            <Switch.Icon checked={value} />
          </Switch.Root>
        </View>
      </View>
      {withDivider ? (
        <View className="mx-4 border-b border-surface-secondary" />
      ) : null}
    </View>
  );
}

export function ConsentPreferencesForm({
  analyticsEnabled,
  loading = false,
  onAnalyticsChange,
  onPrimaryPress,
  onSecondaryPress,
  primaryLabel,
  secondaryLabel,
  manageAdChoicesLabel,
  onManageAdChoices,
  manageAdChoicesLoading = false,
  testIDPrefix = "consent",
  withSafeArea = true,
}: ConsentPreferencesFormProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const Container = withSafeArea ? SafeAreaView : View;

  return (
    <Container className="flex-1 bg-surface-tertiary">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <PreferenceRow
            title="App analytics"
            description="Help us fix issues faster and improve the user experience."
            value={analyticsEnabled}
            onChange={onAnalyticsChange}
            testID={`${testIDPrefix}-analytics`}
            withDivider={!!manageAdChoicesLabel && !!onManageAdChoices}
          />
          {manageAdChoicesLabel && onManageAdChoices ? (
            <View className="px-4 py-4">
              <Text className="font-instrument-sans text-base text-primary">
                Ad choices
              </Text>
              <Text className="mt-1 text-sm leading-6 text-secondary">
                Manage Google ad consent using the privacy options available in
                your region.
              </Text>
              <Button
                size="lg"
                variant="outline"
                className="mt-4 rounded-full"
                label={manageAdChoicesLabel}
                onPress={onManageAdChoices}
                loading={manageAdChoicesLoading}
                disabled={loading || manageAdChoicesLoading}
                testID={`${testIDPrefix}-manage-ad-choices`}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View
        className="border-t border-surface-secondary bg-surface-tertiary px-4 pt-4"
        style={{
          paddingBottom: withSafeArea ? 24 : Math.max(24, bottomInset + 16),
        }}
      >
        <Button
          size="lg"
          variant="primaryNavbar"
          className="rounded-full"
          label={primaryLabel}
          onPress={onPrimaryPress}
          loading={loading}
          testID={`${testIDPrefix}-primary`}
        />
        {secondaryLabel && onSecondaryPress ? (
          <Button
            size="lg"
            variant="ghost"
            label={secondaryLabel}
            onPress={onSecondaryPress}
            disabled={loading}
            textClassName="font-instrument-sans-medium text-secondary"
            testID={`${testIDPrefix}-secondary`}
          />
        ) : null}
      </View>
    </Container>
  );
}
