import { ExternalLink } from "@/components/external-link";
import {
  Button,
  FocusAwareStatusBar,
  GoogleIcon,
  Image,
  Text,
  View,
} from "@/components/ui";

type LoginLayoutProps = {
  onGoogleSignIn: () => void;
  isLoading: boolean;
  isDisabled: boolean;
};

export default function LoginLayout({
  onGoogleSignIn,
  isLoading,
  isDisabled,
}: LoginLayoutProps) {
  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 px-10 py-12 bg-[#F7F6F5] dark:bg-neutral-900">
        <View className="flex-1 justify-center items-center">
          <Image
            source={require("@/assets/images/login-image.svg")}
            className="w-44 h-44 mb-8"
            contentFit="contain"
          />

          <Text
            className={`text-center text-5xl font-matter text-primary mb-4 leading-[1.15] tracking-tighter`}
          >
            Welcome to Stacks{" "}
            <Text className={`text-5xl text-tertiary`}>Mobile</Text>
          </Text>

          <Text className="text-center text-base font-instrument-sans text-secondary mb-8 px-4">
            Play games. Earn points. Start in seconds.
          </Text>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onPress={onGoogleSignIn}
            loading={isLoading}
            disabled={isDisabled}
            testID="google-signin-button"
          >
            <View className="flex-row items-center justify-center gap-2">
              <GoogleIcon size={20} />
              <Text className="font-matter text-base text-primary">
                Continue with Google
              </Text>
            </View>
          </Button>

          <Text className="mt-8 text-center text-base text-secondary px-4 font-instrument-sans">
            By proceeding, you agree with{" "}
            <ExternalLink href="https://mobile.stacks.co/terms-and-conditions">
              <Text className="text-primary underline">Terms of Use</Text>
            </ExternalLink>
          </Text>
        </View>
      </View>
    </>
  );
}
