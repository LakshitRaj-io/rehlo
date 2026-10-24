import { z } from "zod";

/** Saved-stay ids read back from local storage. */
export const savedSchema = z.array(z.string());
