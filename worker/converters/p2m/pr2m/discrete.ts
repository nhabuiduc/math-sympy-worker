import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Discrete extends Pr2MItemBase {

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
                return this.main.prCommon.opJoin(obj.symbols, "∧", { wrapBracket: "if-op-exclude-mul-shortcut" });
            }
            case "Or": {
                return this.main.prCommon.opJoin(obj.symbols, "∨", { wrapBracket: "if-op-exclude-mul-shortcut" });
            }
            case "Implies": {
                return this.main.prCommon.opJoin(obj.symbols, "⇒", { wrapBracket: "if-op-exclude-mul-shortcut" });
            }
        }
    }

}