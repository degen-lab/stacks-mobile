import { colors } from "@/components/ui";
import { ItemVariant } from "@/lib/enums";

const ORANGE_ICON = require("@/assets/game/hero/orange.svg");
const PURPLE_ICON = require("@/assets/game/hero/purple.svg");
const BLACK_ICON = require("@/assets/game/hero/black.svg");

export type SkinId = "orange" | "purple" | "black";

export type SkinAsset = {
  id: SkinId;
  name: string;
  accent: string;
  icon: number;
};

export type Skin = SkinAsset & {
  cost: number;
};

export const DEFAULT_SKIN_ID: SkinId = "orange";

export const SKIN_ID_TO_VARIANT: Record<
  Exclude<SkinId, "orange">,
  ItemVariant
> = {
  purple: ItemVariant.PurpleSkin,
  black: ItemVariant.BlackSkin,
};

export const SKIN_VARIANT_TO_ID: Partial<Record<ItemVariant, SkinId>> = {
  [ItemVariant.PurpleSkin]: "purple",
  [ItemVariant.BlackSkin]: "black",
};

export const SKIN_ASSETS: SkinAsset[] = [
  {
    id: DEFAULT_SKIN_ID,
    name: "Orange",
    accent: colors.stacks.bloodOrange,
    icon: ORANGE_ICON,
  },
  {
    id: "purple",
    name: "Purple",
    accent: colors.stacks.purple,
    icon: PURPLE_ICON,
  },
  {
    id: "black",
    name: "Black",
    accent: colors.neutral[950],
    icon: BLACK_ICON,
  },
];

export const getSkinById = (id: SkinId): SkinAsset => {
  const skin = SKIN_ASSETS.find((s) => s.id === id);
  if (!skin) {
    throw new Error(`Skin with id "${id}" not found`);
  }
  return skin;
};
