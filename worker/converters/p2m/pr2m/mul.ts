import { _l } from "@sympy-worker/light-lodash";
import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";

export class Mul {
    constructor(private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult }) {

    }

    convert(obj: P2Pr.Mul): Pr2M.CResult {
        const { symbols } = obj;
        const items = symbols.map(a => this.main.convert(a));
        let blocks: BlockModel[] = [];
        let isNegative = false;

        let prevAdjacentArg: Symbol;
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const curArg = symbols[idx];
            if (idx == 0 && curArg.type == "NegativeOne") {
                isNegative = true;
                continue;
            }

            const blocksToAdd = this.shouldWrapBrackets(idx, curArg, item) ? blockBd.wrapBetweenBrackets(item.blocks).blocks : item.blocks;

            if (this.shouldSeparateByMulSymbol(prevAdjacentArg, symbols[idx])) {
                blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock("×")], blocksToAdd);
            } else {
                blocks = blockBd.combine2Blockss(blocks, blocksToAdd);
            }

            prevAdjacentArg = symbols[idx];
        }

        if (isNegative) {
            return {
                blocks: blockBd.combine2Blockss([blockBd.textBlock("-")], blocks),
                prUnit: "op",
                prOp: "mul"
            };
        }

        return { blocks, prUnit: "op", prOp: "mul" };
    }

    private shouldSeparateByMulSymbol(prev: Symbol, cur: Symbol) {
        if (!prev || !cur) {
            return false;
        }

        if (prev.type == "Frac" && cur.type == "Frac") {
            return false;
        }
        return this.firstShouldPosfixMul(prev) && this.secondShouldPrefixMul(cur);
    }

    private shouldWrapBrackets(idx: number, symbol: P2Pr.Symbol, cResult: Pr2M.CResult): boolean {
        if (idx <= 0) {
            return false;
        }

        if (cResult.prUnit == "op") {
            return true;
        }

        return prTh.startWithMinus(symbol);
    }

    private secondShouldPrefixMul(s: Symbol): boolean {
        if (prTh.isConstant(s)) {
            return true;
        }

        if (s.type == "Frac") {
            return true;
        }

        if (s.type == "Mul" || s.type == "Pow") {
            return this.secondShouldPrefixMul(_l.first(s.symbols));
        }
    }

    private firstShouldPosfixMul(s: Symbol): boolean {
        if (prTh.isConstant(s)) {
            return true;
        }

        if (s.type == "Frac") {
            return true;
        }

        if (s.type == "Mul") {
            return this.firstShouldPosfixMul(_l.last(s.symbols));
        }
    }
}

type Symbol = P2Pr.Symbol;