import {
  cvToJSON,
  hexToCV,
  ClarityValue,
  ClarityType,
  IntCV,
  UIntCV,
  BufferCV,
  OptionalCV,
  ResponseCV,
  TupleCV,
  ListCV,
} from "@stacks/transactions";
import { Buffer } from "buffer";

export const shortFormattedString = (
  address: string | null,
  nrLetters: number,
): string => {
  if (!address) return "";
  return `${address.slice(0, nrLetters)}...${address.slice(-nrLetters)}`;
};

export const transformClarityValue = (result: string): unknown => {
  if (!result.startsWith("0x")) {
    throw new Error("Unexpected format for result value");
  }
  const clarityValue: ClarityValue = hexToCV(result);

  // Recursive function to handle Clarity values
  const handleClarityValue = (value: ClarityValue): unknown => {
    switch (value.type) {
      case ClarityType.Int:
      case ClarityType.UInt:
        return (value as IntCV | UIntCV).value;

      case ClarityType.BoolTrue:
        return true;

      case ClarityType.BoolFalse:
        return false;

      case ClarityType.Buffer:
        return Buffer.from((value as BufferCV).value, "hex").toString("hex");

      case ClarityType.PrincipalStandard:
      case ClarityType.PrincipalContract:
        return cvToJSON(value).value;

      case ClarityType.OptionalNone:
        return null;

      case ClarityType.OptionalSome:
        const someCV = value as OptionalCV;
        if ("value" in someCV) {
          return handleClarityValue(someCV.value);
        }
        return null;

      case ClarityType.ResponseOk:
        return handleClarityValue((value as ResponseCV).value);

      case ClarityType.ResponseErr:
        return { error: handleClarityValue((value as ResponseCV).value) };

      case ClarityType.List:
        const listValues = (value as ListCV).value.map(handleClarityValue);
        return listValues;

      case ClarityType.Tuple:
        const formattedTuple: Record<string, unknown> = {};
        Object.entries((value as TupleCV).value).forEach(([key, subValue]) => {
          formattedTuple[key] = handleClarityValue(subValue);
        });
        return formattedTuple;

      default:
        throw new Error("Unknown Clarity value type");
    }
  };

  return handleClarityValue(clarityValue);
};
