import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { P2PrItemBase } from "./p2pr-item-base";

export class Tensor extends P2PrItemBase {
    tensorIndex(obj: P2Pr.PTensorIndex): Symbol {
        return this.convertIndex(obj, prTh.empty(), "None");
    }

    tensor(obj: P2Pr.PF<"Tensor"> | P2Pr.PF<"TensorElement">): Symbol {
        const name = this.c(obj.args[0]);
        const rawIndices = (obj.args[1] as P2Pr.PF<"List">).args as P2Pr.PTensorIndex[];
        if (rawIndices.length <= 0) {
            return name
        }

        const vlArrSymbols: Symbol[] = obj.args[2] ? (this.c(obj.args[2]) as P2Pr.VarList).symbols : [];
        const vlArr = vlArrSymbols.length <= 0 ? "None" : vlArrSymbols.map(s => prTh.isNone(s) ? "None" : prTh.extractIntegerValue(s));



        console.log(vlArr);
        const hasAnyVl = vlArr != "None" && vlArr.some(c => c != "None");
        const indices = rawIndices.reduce((prev, cur, idx) => this.mergeIdx(prev, cur, vlArr != "None" ? vlArr[idx] : "None", hasAnyVl), [] as Symbol[]);

        (indices[0] as P2Pr.Container).symbols[0] = name;
        return prTh.varList(indices, {
            visualInfo: { prOp: "unit", prPowerIndex: "parts", prShorthandMul: "unit", prSign: false },
        });

    }


    private mergeIdx(prev: Symbol[], rawSecond: P2Pr.PTensorIndex, vl: number | "None", hasAnyVl: boolean): Symbol[] {
        const second = this.convertIndex(rawSecond, prTh.empty(), vl);
        if (prev.length <= 0) {
            return [second];
        }
        const last = prev[prev.length - 1];
        if ((last.type != "Pow" && last.type != "Index") || (second.type != "Pow" && second.type != "Index")) {
            return prev.concat([second]);
        }

        if (last.type == second.type) {
            last.symbols[1] = this.mergeToVarList(last.symbols[1], second.symbols[1], hasAnyVl);
            return prev;
        }
        return prev.concat([second])
    }

    private mergeToVarList(cur: Symbol, second: Symbol, hasAnyVl: boolean): P2Pr.VarList {
        if (cur.type == "VarList") {
            cur.symbols.push(second);
            return cur;
        }

        return prTh.varList([cur, second], { separator: hasAnyVl ? "," : undefined });
    }

    private convertIndex(obj: P2Pr.PTensorIndex, base: Symbol, vl: number | "None") {
        let idx = this.c(obj.args[0]);
        if (vl != "None") {
            idx = prTh.rel("==", [idx, prTh.int(vl)])
        }

        if (obj.isUp) {
            return prTh.pow(base, idx)
        }

        return prTh.index(base, idx)
    }
}

type Symbol = P2Pr.Symbol;