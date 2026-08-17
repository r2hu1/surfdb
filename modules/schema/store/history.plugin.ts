import { temporal } from "zundo";
import { DEFAULTS } from "../config/defaults";

export const HISTORY_OPTIONS = {
  limit: DEFAULTS.maxUndoDepth,
} as const;

export { temporal };
