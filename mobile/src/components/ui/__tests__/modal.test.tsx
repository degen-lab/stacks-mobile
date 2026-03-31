import React from "react";

import { render, screen } from "@/lib/tests";

import { Modal } from "../modal";
import { Text } from "../text";

describe("Modal", () => {
  it("renders headerTitle instead of the plain title", () => {
    const ref = React.createRef<any>();

    render(
      <Modal
        ref={ref}
        title="Plain title"
        headerTitle={<Text>Custom header title</Text>}
      >
        <Text>Body</Text>
      </Modal>,
    );

    expect(screen.getByText("Custom header title")).toBeTruthy();
    expect(screen.queryByText("Plain title")).toBeNull();
    expect(screen.getByText("Body")).toBeTruthy();
  });
});
