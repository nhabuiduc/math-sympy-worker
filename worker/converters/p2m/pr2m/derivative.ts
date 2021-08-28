import { blockBd } from "../block-bd";
import type { P2Pr } from "../p2pr";
import { prTh as prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";

export class Derivative {
    constructor(private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult }) {

    }

    private considerPresentAsSingleUnit(s: Symbol, cr: Pr2M.CResult) {
        return prTh.considerPresentAsSingleUnit(s, cr) || s.type == "Pow";
    }

    convert(derivative: P2Pr.Derivative, level: number): Pr2M.CResult {
        let crs = this.main.convert(derivative.symbols[0]);
        const exprBlocks = this.considerPresentAsSingleUnit(derivative.symbols[0], crs) ? crs.blocks : blockBd.wrapBetweenBrackets(crs.blocks).blocks;
        let denomVarList: P2Pr.VarList = { type: "VarList", kind: "Container", symbols: [] };
        const dLetter = derivative.partial ? "∂" : "d";
        let allVar = 0;
        for (let idx = derivative.symbols.length - 1; idx >= 1; idx--) {
            const tuple = (derivative.symbols[idx] as P2Pr.VarList);
            const symbolCount = prTh.extractIntegerValue(tuple.symbols[1]);
            denomVarList.symbols.push(prTh.var(dLetter));

            if (symbolCount > 1) {
                denomVarList.symbols.push(prTh.pow(tuple.symbols[0], prTh.int(symbolCount)))
            } else {
                denomVarList.symbols.push(tuple.symbols[0]);
            }
            allVar += symbolCount;
        }

        const numVarList: P2Pr.VarList = { type: "VarList", kind: "Container", symbols: [] };
        if (allVar > 1) {
            numVarList.symbols.push(prTh.pow(prTh.var(dLetter), prTh.int(allVar)));
        } else {
            numVarList.symbols.push(prTh.var(dLetter))
        }

        const rs = [
            blockBd.fracBlock(this.main.convert(numVarList).blocks, this.main.convert(denomVarList).blocks),
            ...exprBlocks
        ];
        if (level == 0) {
            return { blocks: rs };
        }

        return blockBd.wrapBetweenBrackets(rs)

    }
}

type Symbol = P2Pr.Symbol;