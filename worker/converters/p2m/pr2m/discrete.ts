import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { Pr2MCommon } from "./pr2m-common";

export class Discrete {

    constructor(
        private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult },
        private common: Pr2MCommon
    ) {
    }

    convert(obj: P2Pr.Discrete): Pr2M.CResult {
        switch (obj.op) {
            case "Not": {
                const rs = this.main.convert(obj.symbols[0]);
                return {
                    blocks: [
                        blockBd.textBlock(`¬`),
                        ...blockBd.wrapBracketIfOp(rs),
                    ], prUnit: "not"
                }
            }

            case "And": {
                return this.common.opJoin(obj.symbols, "∧", { wrapBracket: "if-op-exclude-mul-shortcut" });
            }
            case "Or": {
                return this.common.opJoin(obj.symbols, "∨", { wrapBracket: "if-op-exclude-mul-shortcut" });
            }
            case "Implies": {
                return this.common.opJoin(obj.symbols, "⇒", { wrapBracket: "if-op-exclude-mul-shortcut" });
            }
        }
    }

}