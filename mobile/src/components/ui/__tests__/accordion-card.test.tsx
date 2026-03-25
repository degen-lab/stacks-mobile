import { StyleSheet } from "react-native";
import { useState } from "react";

import { fireEvent, render } from "@/lib/tests";

import { AccordionCard } from "../accordion-card";

function AccordionHarness() {
  const [open, setOpen] = useState(false);

  return (
    <AccordionCard
      title="What is sBTC?"
      body="sBTC is Bitcoin you can use on Stacks."
      isOpen={open}
      onToggle={() => setOpen((current) => !current)}
      testID="accordion"
    />
  );
}

describe("AccordionCard", () => {
  it("toggles content and updates chevron rotation", () => {
    const { getByTestId, getByText, queryByText } = render(
      <AccordionHarness />,
    );

    expect(queryByText("sBTC is Bitcoin you can use on Stacks.")).toBeNull();
    expect(
      getByTestId("accordion-trigger").props.accessibilityState.expanded,
    ).toBe(false);
    expect(
      StyleSheet.flatten(getByTestId("accordion-chevron").props.style),
    ).toMatchObject({
      transform: [{ rotate: "0deg" }],
    });

    fireEvent.press(getByTestId("accordion-trigger"));

    expect(getByText("sBTC is Bitcoin you can use on Stacks.")).toBeTruthy();
    expect(
      getByTestId("accordion-trigger").props.accessibilityState.expanded,
    ).toBe(true);
    expect(
      StyleSheet.flatten(getByTestId("accordion-chevron").props.style),
    ).toMatchObject({
      transform: [{ rotate: "180deg" }],
    });
  });
});
