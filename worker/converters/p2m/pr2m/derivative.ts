import { blockBd } from "../block-bd";
import type { P2Pr } from "../p2pr";
import { prTransformHelper as prTh } from "../pr-transform/pr-transform-helper";

export class Derivative {
    constructor(private main: { convert(obj: P2Pr.Symbol): BlockModel[] }) {

    }

    convert(derivative: P2Pr.Derivative, level: number): BlockModel[] {
        const exprBlocks = this.main.convert(derivative.symbols[0]);
        let denomVarList: P2Pr.VarList = { type: "VarList", kind: "Container", symbols: [] };
        const dLetter = derivative.partial ? "∂" : "d";
        let allVar = 0;
        for (let idx = 1; idx < derivative.symbols.length; idx++) {
            const tuple = (derivative.symbols[idx] as P2Pr.Tuple);
            const symbolCount = Derivative.parseIntegerConstant(tuple.symbols[1]);
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
            blockBd.fracBlock(this.main.convert(numVarList), this.main.convert(denomVarList)),
            ...exprBlocks
        ];
        if (level == 0) {
            return rs;
        }

        return blockBd.wrapBetweenBrackets(rs)

    }

    static parseIntegerConstant(s: P2Pr.Symbol): number {
        switch (s.type) {
            case "One": return 1;
            case "Zero": return 0;
            case "Integer": return s.value;
        }

        throw new Error("Unsupported symbol for parsing integer");
    }
}



// export const derivative = new Derivative();