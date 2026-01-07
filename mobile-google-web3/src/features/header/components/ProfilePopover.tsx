import type { ImageSource } from "expo-image";
import { LogOut, Settings, User } from "lucide-react-native";

import { Text, View } from "@/components/ui";
import { Popover } from "@/components/ui/popover";
import { Avatar } from "./Avatar";
import type { MenuItemProps } from "./MenuItem";
import { MenuList } from "./MenuList";

type ProfilePopoverProps = {
  visible: boolean;
  onClose: () => void;
  name: string;
  email: string;
  avatarSource: ImageSource;
  onPressSettings: () => void;
  onPressViewProfile: () => void;
  onPressAccountHistory?: () => void;
  onPressSignOut: () => void;
  signingOut: boolean;
};

export function ProfilePopover({
  visible,
  onClose,
  name,
  email,
  avatarSource,
  onPressSettings,
  onPressViewProfile,
  onPressSignOut,
  signingOut,
}: ProfilePopoverProps) {
  const items: MenuItemProps[] = [
    {
      label: "View profile",
      icon: <User size={18} className="text-primary dark:text-white" />,
      onPress: () => {
        onClose();
        onPressViewProfile();
      },
    },
    {
      label: "Settings",
      icon: <Settings size={18} className="text-primary dark:text-white" />,
      onPress: () => {
        onClose();
        onPressSettings();
      },
    },
    {
      label: "Sign out",
      icon: <LogOut size={18} className="text-red-500 dark:text-red-400" />,
      onPress: () => {
        if (!signingOut) {
          onPressSignOut();
        }
      },
      variant: "danger",
      loading: signingOut,
    },
  ];

  return (
    <Popover visible={visible} onClose={onClose}>
      <View className="space-y-5 px-2 pb-3">
        <View className="items-center gap-3 pb-2">
          <Avatar source={avatarSource} size="lg" />
          <View className="items-center gap-1">
            <Text className="font-matter text-lg text-primary dark:text-white">
              {name}
            </Text>
            <Text className="text-sm text-secondary dark:text-sand-300 mb-3">
              {email}
            </Text>
          </View>
        </View>

        <MenuList items={items} />
      </View>
    </Popover>
  );
}
