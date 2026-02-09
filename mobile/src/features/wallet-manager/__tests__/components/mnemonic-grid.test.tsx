import { fireEvent, render } from "@/lib/tests";
import { MnemonicWordGrid } from "../../components/mnemonic-grid";

describe("MnemonicWordGrid", () => {
  const mockWords = [
    "abandon",
    "ability",
    "able",
    "about",
    "above",
    "absent",
    "absorb",
    "abstract",
    "absurd",
    "abuse",
    "access",
    "accident",
  ];

  describe("Display Mode", () => {
    it("renders words in revealed mode", () => {
      const { getByText } = render(
        <MnemonicWordGrid words={mockWords} revealed={true} wordCount={12} />,
      );

      expect(getByText("abandon")).toBeTruthy();
      expect(getByText("ability")).toBeTruthy();
      expect(getByText("accident")).toBeTruthy();
    });

    it("renders words in hidden mode", () => {
      const { getAllByText, queryByText } = render(
        <MnemonicWordGrid words={mockWords} revealed={false} wordCount={12} />,
      );

      expect(queryByText("abandon")).toBeFalsy();
      expect(getAllByText("••••••••").length).toBeGreaterThan(0);
    });

    it("renders empty grid when no words provided", () => {
      const { getByText } = render(
        <MnemonicWordGrid words={[]} revealed={true} wordCount={12} />,
      );

      expect(getByText("1")).toBeTruthy();
      expect(getByText("12")).toBeTruthy();
    });

    it("renders 24-word grid", () => {
      const words24 = Array(24).fill("test");
      const { getByText } = render(
        <MnemonicWordGrid words={words24} revealed={true} wordCount={24} />,
      );

      expect(getByText("1")).toBeTruthy();
      expect(getByText("24")).toBeTruthy();
    });
  });

  describe("Editable Mode", () => {
    it("renders editable inputs", () => {
      const onWordChange = jest.fn();
      const { getAllByPlaceholderText } = render(
        <MnemonicWordGrid
          words={Array(12).fill("")}
          revealed={true}
          editable={true}
          onWordChange={onWordChange}
          wordCount={12}
        />,
      );

      const inputs = getAllByPlaceholderText("word");
      expect(inputs).toHaveLength(12);
    });

    it("calls onWordChange when input changes", () => {
      const onWordChange = jest.fn();
      const { getAllByPlaceholderText } = render(
        <MnemonicWordGrid
          words={Array(12).fill("")}
          revealed={true}
          editable={true}
          onWordChange={onWordChange}
          wordCount={12}
        />,
      );

      const firstInput = getAllByPlaceholderText("word")[0];
      fireEvent.changeText(firstInput, "abandon");

      expect(onWordChange).toHaveBeenCalledWith(0, "abandon");
    });

    it("trims and lowercases input", () => {
      const onWordChange = jest.fn();
      const { getAllByPlaceholderText } = render(
        <MnemonicWordGrid
          words={Array(12).fill("")}
          revealed={true}
          editable={true}
          onWordChange={onWordChange}
          wordCount={12}
        />,
      );

      const firstInput = getAllByPlaceholderText("word")[0];
      fireEvent.changeText(firstInput, "  ABANDON  ");

      expect(onWordChange).toHaveBeenCalledWith(0, "abandon");
    });
  });

  describe("Validation", () => {
    it("highlights invalid words", () => {
      const { getByText } = render(
        <MnemonicWordGrid
          words={["abandon", "invalid", "ability"]}
          revealed={true}
          editable={false}
          wordCount={12}
          invalidWordIndices={[1]}
        />,
      );

      const invalidWord = getByText("invalid");
      expect(invalidWord).toBeTruthy();
    });

    it("applies error styling to invalid inputs", () => {
      const { getAllByPlaceholderText } = render(
        <MnemonicWordGrid
          words={["abandon", "invalid", ""]}
          revealed={true}
          editable={true}
          wordCount={12}
          invalidWordIndices={[1]}
        />,
      );

      const inputs = getAllByPlaceholderText("word");
      expect(inputs[1]).toBeTruthy();
    });
  });

  describe("Custom Height", () => {
    it("applies custom maxHeight", () => {
      const { UNSAFE_root } = render(
        <MnemonicWordGrid
          words={mockWords}
          revealed={true}
          wordCount={12}
          maxHeight={500}
        />,
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
