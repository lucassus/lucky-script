import fs from "node:fs";
import path from "node:path";

import * as ohm from "ohm-js";

export const grammar = ohm.grammar(
  fs.readFileSync(path.join(__dirname, "grammar.ohm"), "utf-8"),
);
