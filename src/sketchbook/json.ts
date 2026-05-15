import fs from "node:fs";
import path from "node:path";

import * as ohm from "ohm-js";

export const jsonGrammar = ohm.grammar(
  fs.readFileSync(path.join(__dirname, "json.ohm"), "utf-8"),
);
