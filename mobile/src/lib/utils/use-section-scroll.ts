import { useCallback, useRef } from "react";
import type { LayoutChangeEvent, ScrollView } from "react-native";

type ScrollToSectionOptions = {
  offset?: number;
  animated?: boolean;
};

type UseSectionScrollOptions = {
  defaultOffset?: number;
};

export function useSectionScroll<SectionId extends string>({
  defaultOffset = 0,
}: UseSectionScrollOptions = {}) {
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Partial<Record<SectionId, number>>>({});

  const registerSection = useCallback(
    (sectionId: SectionId) => (event: LayoutChangeEvent) => {
      sectionOffsetsRef.current[sectionId] = event.nativeEvent.layout.y;
    },
    [],
  );

  const scrollToSection = useCallback(
    (
      sectionId: SectionId,
      { offset = defaultOffset, animated = true }: ScrollToSectionOptions = {},
    ) => {
      const targetY = sectionOffsetsRef.current[sectionId];

      if (typeof targetY !== "number") return false;

      scrollViewRef.current?.scrollTo({
        y: Math.max(targetY - offset, 0),
        animated,
      });

      return true;
    },
    [defaultOffset],
  );

  return {
    scrollViewRef,
    registerSection,
    scrollToSection,
  };
}
