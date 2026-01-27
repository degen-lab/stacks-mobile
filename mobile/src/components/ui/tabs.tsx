import { createContext, useContext, ReactNode } from "react";
import { Pressable, View as RNView } from "react-native";
import { Text, View } from "@/components/ui";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
};

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      {children}
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: ReactNode;
};

export function TabsList({ children }: TabsListProps) {
  return <View className="flex-row">{children}</View>;
}

type TabsTriggerProps = {
  value: string;
  children: ReactNode;
};

export function TabsTrigger({ value, children }: TabsTriggerProps) {
  const { value: activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <Pressable onPress={() => onValueChange(value)} className="flex-1">
      <RNView
        className={`items-center justify-center px-4 py-3 border-b-2 ${
          isActive ? "border-bitcoin-500" : "border-tertiary"
        }`}
      >
        <Text
          className={`text-base font-instrument-sans ${
            isActive ? "text-bitcoin-500" : "text-tertiary"
          }`}
        >
          {children}
        </Text>
      </RNView>
    </Pressable>
  );
}

type TabsContentProps = {
  value: string;
  children: ReactNode;
};

export function TabsContent({ value, children }: TabsContentProps) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) return null;

  return <>{children}</>;
}
