import { fireEvent, render } from "@/lib/tests";

import { PasswordInput } from "../password-input";

describe("PasswordInput", () => {
  it("renders secure input and toggles visibility", () => {
    const onPasswordChange = jest.fn();
    const onToggleShowPassword = jest.fn();

    const { getByTestId } = render(
      <PasswordInput
        password="secret"
        showPassword={false}
        onPasswordChange={onPasswordChange}
        onToggleShowPassword={onToggleShowPassword}
        inputTestID="password-input"
        toggleTestID="password-toggle"
      />,
    );

    expect(getByTestId("password-input").props.secureTextEntry).toBe(true);

    fireEvent.changeText(getByTestId("password-input"), "new-pass");
    expect(onPasswordChange).toHaveBeenCalledWith("new-pass");

    fireEvent.press(getByTestId("password-toggle"));
    expect(onToggleShowPassword).toHaveBeenCalledTimes(1);
  });

  it("shows plain text when visibility is enabled", () => {
    const { getByTestId } = render(
      <PasswordInput
        password="secret"
        showPassword
        onPasswordChange={jest.fn()}
        onToggleShowPassword={jest.fn()}
        inputTestID="password-input"
        toggleTestID="password-toggle"
      />,
    );

    expect(getByTestId("password-input").props.secureTextEntry).toBe(false);
  });
});
