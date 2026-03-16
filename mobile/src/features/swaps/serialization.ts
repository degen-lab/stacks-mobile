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

function describeValue(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toBigIntLike(value: unknown, path: string): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      throw new TypeError(`${path}: Expected an integer, received ${value}`);
    }
    return BigInt(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      throw new TypeError(`${path}: Expected a non-empty integer string`);
    }
    return BigInt(normalized);
  }

  if (value instanceof Uint8Array) {
    const hex = Buffer.from(value).toString("hex");
    return BigInt(`0x${hex || "0"}`);
  }

  if (Array.isArray(value) && value.every((entry) => Number.isInteger(entry))) {
    return toBigIntLike(Uint8Array.from(value), path);
  }

  if (typeof value === "object" && value !== null) {
    if (
      "type" in value &&
      value.type === "Buffer" &&
      "data" in value &&
      Array.isArray(value.data)
    ) {
      return toBigIntLike(value.data, path);
    }

    if ("valueOf" in value && typeof value.valueOf === "function") {
      const primitive = value.valueOf();
      if (primitive !== value) {
        return toBigIntLike(primitive, path);
      }
    }

    if ("value" in value) {
      return toBigIntLike(value.value, path);
    }
  }

  throw new TypeError(
    `${path}: Unsupported integer-like value ${describeValue(value)}`,
  );
}

function parsePrincipal(value: string) {
  const [address, contractName] = value.split(".");

  return contractName
    ? contractPrincipalCV(address, contractName)
    : standardPrincipalCV(address);
}

export function parseSerializedClarityValue(
  value: SerializedClarityValue,
  path = "clarity value",
): ClarityValue {
  switch (value.type) {
    case "int":
      return intCV(toBigIntLike(value.value, `${path}.value`));
    case "uint":
      return uintCV(toBigIntLike(value.value, `${path}.value`));
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
      return parsePrincipal(value.value);
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
    case "buffer": {
      const normalized = value.value.startsWith("0x")
        ? value.value.slice(2)
        : value.value;
      const bytes = HEX_PATTERN.test(value.value)
        ? Uint8Array.from(Buffer.from(normalized, "hex"))
        : Uint8Array.from(Buffer.from(value.value, "utf8"));

      return bufferCV(bytes);
    }
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
  if (postCondition.type === "stx-postcondition") {
    return {
      ...postCondition,
      amount: toBigIntLike(postCondition.amount, `${path}.amount`).toString(),
    };
  }

  if (postCondition.type === "ft-postcondition") {
    return {
      ...postCondition,
      amount: toBigIntLike(postCondition.amount, `${path}.amount`).toString(),
      asset: postCondition.asset as AssetIdentifier,
    };
  }

  return {
    ...postCondition,
    asset: postCondition.asset as AssetIdentifier,
    assetId: parseSerializedClarityValue(
      postCondition.assetId,
      `${path}.assetId`,
    ),
  };
}

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
