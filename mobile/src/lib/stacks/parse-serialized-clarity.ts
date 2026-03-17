import { Buffer } from "buffer";
import {
  bufferCV,
  contractPrincipalCV,
  falseCV,
  intCV,
  listCV,
  noneCV,
  responseErrorCV,
  responseOkCV,
  someCV,
  standardPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  trueCV,
  tupleCV,
  type ClarityValue,
  type PostCondition,
  uintCV,
} from "@stacks/transactions";

import type {
  SerializedClarityValue,
  SerializedPostCondition,
  SwapContractCallParams,
} from "@/api/defi";

const HEX_PATTERN = /^(?:0x)?[0-9a-f]+$/i;
type AssetIdentifier = `${string}.${string}::${string}`;

function parseIntegerString(value: string, path: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new TypeError(`${path}: Expected a non-empty integer string`);
  }

  return BigInt(normalized);
}

function parsePrincipalValue(value: string) {
  const [address, contractName] = value.split(".");

  return contractName
    ? contractPrincipalCV(address, contractName)
    : standardPrincipalCV(address);
}

function parseBufferValue(value: string) {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  const encoding = HEX_PATTERN.test(value) ? "hex" : "utf8";

  return bufferCV(Uint8Array.from(Buffer.from(normalized, encoding)));
}

export function parseSerializedClarityValue(
  value: SerializedClarityValue,
  path = "clarity value",
): ClarityValue {
  switch (value.type) {
    case "int":
      return intCV(parseIntegerString(value.value, `${path}.value`));
    case "uint":
      return uintCV(parseIntegerString(value.value, `${path}.value`));
    case "none":
      return noneCV();
    case "some":
      return someCV(parseSerializedClarityValue(value.value, `${path}.value`));
    case "true":
      return trueCV();
    case "false":
      return falseCV();
    case "address":
    case "principal":
    case "contract":
      return parsePrincipalValue(value.value);
    case "ok":
      return responseOkCV(
        parseSerializedClarityValue(value.value, `${path}.value`),
      );
    case "err":
      return responseErrorCV(
        parseSerializedClarityValue(value.value, `${path}.value`),
      );
    case "tuple":
      return tupleCV(
        Object.fromEntries(
          Object.entries(value.value).map(([key, entry]) => [
            key,
            parseSerializedClarityValue(entry, `${path}.value.${key}`),
          ]),
        ),
      );
    case "list":
      return listCV(
        value.value.map((entry, index) =>
          parseSerializedClarityValue(entry, `${path}.value[${index}]`),
        ),
      );
    case "ascii":
      return stringAsciiCV(value.value);
    case "utf8":
      return stringUtf8CV(value.value);
    case "buffer":
      return parseBufferValue(value.value);
    default: {
      const neverValue: never = value;
      throw new Error(
        `Unsupported clarity value: ${JSON.stringify(neverValue)}`,
      );
    }
  }
}

export function parseSerializedPostCondition(
  postCondition: SerializedPostCondition,
  path = "post condition",
): PostCondition {
  switch (postCondition.type) {
    case "stx-postcondition":
      return {
        ...postCondition,
        amount: parseIntegerString(
          postCondition.amount,
          `${path}.amount`,
        ).toString(),
      };
    case "ft-postcondition":
      return {
        ...postCondition,
        amount: parseIntegerString(
          postCondition.amount,
          `${path}.amount`,
        ).toString(),
        asset: postCondition.asset as AssetIdentifier,
      };
    case "nft-postcondition":
      return {
        ...postCondition,
        asset: postCondition.asset as AssetIdentifier,
        assetId: parseSerializedClarityValue(
          postCondition.assetId,
          `${path}.assetId`,
        ),
      };
  }
}

// Convert serialized backend params like { type: "uint", value: "123" } into
// Clarity values and post conditions for fee estimation and transaction building.
export function parseSerializedContractCallParams(
  params: SwapContractCallParams,
) {
  return {
    ...params,
    functionArgs: params.functionArgs.map((value, index) =>
      parseSerializedClarityValue(value, `functionArgs[${index}]`),
    ),
    postConditions: params.postConditions.map((value, index) =>
      parseSerializedPostCondition(value, `postConditions[${index}]`),
    ),
  };
}
