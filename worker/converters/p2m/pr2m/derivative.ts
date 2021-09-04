import { blockBd } from "../block-bd";
import type { P2Pr } from "../p2pr";
import { prTh as prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Derivative extends Pr2MItemBase {


    private shouldWrapBrackets(s: Symbol, cr: Pr2M.CResult) {
        if (s.type == "Mul" && s.symbols.length == 2 && prTh.isNegativeOne(s.symbols[0]) && s.symbols[1].type == "Derivative") {
            return false;
        }

        return !(prTh.considerPresentAsSingleUnitInOpCtx(s, cr));
    }

    private combineCounting(s1: Symbol, s2: Symbol): Symbol {
        if (!s1 || !s2) {
            return s1 || s2;
        }

        if (prTh.isInt(s1) && prTh.isInt(s2)) {
            return prTh.int(prTh.extractIntegerValue(s1) + prTh.extractIntegerValue(s2));
        }

        const ss1 = prTh.extractIfVarList(s1);
        const ss2 = prTh.extractIfVarList(s2);
        return prTh.varList(ss1.concat(ss2));
    }

    convert(derivative: P2Pr.Derivative): Pr2M.CResult {
        let crs = this.main.convert(derivative.symbols[0]);
        const exprBlocks = this.shouldWrapBrackets(derivative.symbols[0], crs) ? blockBd.wrapBetweenBrackets(crs.blocks).blocks : crs.blocks;
        let denomVarList: P2Pr.VarList = { type: "VarList", kind: "Container", symbols: [] };
        const dLetter = derivative.partial ? "∂" : "d";
        let allVar: Symbol;
        for (let idx = derivative.symbols.length - 1; idx >= 1; idx--) {
            const tuple = (derivative.symbols[idx] as P2Pr.VarList);
            denomVarList.symbols.push(prTh.var(dLetter));


            if (prTh.isZero(tuple.symbols[1]) || prTh.isOne(tuple.symbols[1])) {
                denomVarList.symbols.push(tuple.symbols[0]);
            } else {
                denomVarList.symbols.push(prTh.pow(tuple.symbols[0], tuple.symbols[1]))
            }

            allVar = this.combineCounting(allVar, tuple.symbols[1]);
        }

        const numVarList: P2Pr.VarList = { type: "VarList", kind: "Container", symbols: [] };
        if (prTh.isZero(allVar) || prTh.isOne(allVar)) {
            numVarList.symbols.push(prTh.var(dLetter))
        } else {
            numVarList.symbols.push(prTh.pow(prTh.var(dLetter), allVar));
        }

        const rs = [
            blockBd.fracBlock(this.main.convert(numVarList).blocks, this.main.convert(denomVarList).blocks),
            ...exprBlocks
        ];
        return { blocks: rs };
    }
}

type Symbol = P2Pr.Symbol;