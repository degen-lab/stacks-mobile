import { ReactElement, cloneElement } from "react";

const numberFormatter = new Intl.NumberFormat("en-US");

export const formatNumberToEnUs = (value: number) =>
  numberFormatter.format(value);

export const formatNumberWithDecimalsTrunc = (
  value: number | null | undefined,
  decimals: number,
) =>
  value == null || !Number.isFinite(value)
    ? ""
    : numberFormatter.format(
        Number(
          (
            Math.trunc(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
          ).toFixed(decimals),
        ),
      );

export type IconWithClassName = ReactElement<{
  className?: string;
  isEmpty?: boolean;
}>;

export const applyEmptyStateStyles = (
  icon: IconWithClassName,
  isEmpty: boolean,
): ReactElement => {
  if (!isEmpty) return icon;

  return cloneElement(icon, { isEmpty: true });
};
