import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MCommon } from "./pr2m-common";
import { Pr2MItemBase } from "./pr2m-item-base";

export class BinaryOp extends Pr2MItemBase {
    convert(obj: P2Pr.BinaryOp): Pr2M.CResult {
        const { op } = obj;
        if (op == "↦") {
            return this.main.prCommon.opJoin(obj.symbols, op, (s) => {
                return s.type == "BinaryOp" && s.op == "↦";
            });
        }

        const wrapBehavior = this.getJoinWrapBehavior(obj);

        if (op == "mod") {
            return this.main.prCommon.opJoin(obj.symbols, () => blockBd.compositeBlock("\\bmod"), wrapBehavior);
        }
        if (op == "rightarrow") {
            return this.main.prCommon.opJoin(obj.symbols, () => blockBd.compositeBlock("\\rightarrow"), wrapBehavior);
        }

        return this.main.prCommon.opJoin(obj.symbols, op, wrapBehavior);
    }

    private getJoinWrapBehavior(obj: P2Pr.BinaryOp): Pr2MCommon.JoinWrapBehavior {
        return (s: Symbol, rs: Pr2M.CResult, idx: number) => {
            if (s.type == "BinaryOp" && s.op == obj.op) {
                return true;
            }

            /**handle some special cases */

            if (s.type == "Relational" && (obj.op == "∧" || obj.op == "∨")) {
                return false;
            }


            return !prTh.considerPresentAsSingleUnitInOpCtx(s, rs, { wrapEvenShortHand: obj.wrapIfMulShorthand, excludeSign: idx == 0 });

        }
    }

    // private opPrecedentMap = new Map<P2Pr.BinaryOp["op"], [string, number]>([
    //     ["Lambda", ["↦", 380]],
    //     ["Rightarrow", ["→", 380]],
    //     ["Times", ["×", 520]],
    //     ["Implies",["⇒", 380]],
    //     ["And",["∧", 330]],
    //     ["Or", ["∨", 320]],
    //     ["Union", ["∪", 410]],
    //     ["Intersection", ["∩", 420]],
    //     ["SymmetricDifference", ["▵", 620]],

    //     // ["⧵", 580],
    // ]);

}

type Symbol = P2Pr.Symbol;