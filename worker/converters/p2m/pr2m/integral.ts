import { blockBd } from "../block-bd";
import type { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Integral extends Pr2MItemBase {
    convert(integral: P2Pr.Integral): BlockModel[] {
        const limits = integral.symbols.slice(1);
        let intBlocks: CompositeBlockModel[];
        let symbolBlocks: BlockModel[];
        if (limits.length <= 3 && limits.every(c => (c as P2Pr.VarList).symbols.length == 1)) {
            intBlocks = [this.intBlockByCount(limits.length)];
            symbolBlocks = blockBd.joinBlocks(limits.map(c => {
                const rs = this.main.convert((c as P2Pr.VarList).symbols[0]);
                return [blockBd.textBlock("d")].concat(rs.blocks);
            }), "\u2009");
        } else {
            intBlocks = [];
            const sBlockss: BlockModel[][] = [];
            for (let idx = limits.length - 1; idx >= 0; idx--) {
                const lim = limits[idx] as P2Pr.VarList;
                let intBlock: CompositeBlockModel;
                if (lim.symbols.length >= 3) {
                    intBlock = blockBd.compositeBlock("\\int", ["to", "from"],
                        [this.main.convert(lim.symbols[1]).blocks, this.main.convert(lim.symbols[2]).blocks]);
                } else if (lim.symbols.length >= 2) {
                    intBlock = blockBd.compositeBlock("\\int", ["from"],
                        [this.main.convert(lim.symbols[1]).blocks]);
                } else {
                    intBlock = blockBd.compositeBlock("\\int");
                }

                intBlocks.push(intBlock);
                sBlockss.unshift(blockBd.combine2Blockss([blockBd.textBlock("d")], this.main.convert(lim.symbols[0]).blocks));
            }
            symbolBlocks = blockBd.joinBlocks(sBlockss, "\u2009");
        }

        const expCr = this.main.convert(integral.symbols[0]);
        const expBlocks = this.shouldWrapBrackets(integral.symbols[0], expCr) ? blockBd.wrapBetweenBrackets(expCr.blocks).blocks : expCr.blocks;
        // console.log(integral);
        return blockBd.combineMultipleBlocks(
            intBlocks,
            expBlocks,
            [blockBd.textBlock("\u2009")],
            symbolBlocks,
        )
    }

    private shouldWrapBrackets(s: Symbol, cr: Pr2M.CResult) {
        if (s.type == "Mul" && s.symbols.length == 2 && prTh.isNegativeOne(s.symbols[0]) && s.symbols[1].type == "Integral") {
            return false;
        }

        return !(prTh.considerPresentAsSingleUnit(s, cr));
    }

    private intBlockByCount(count: number): CompositeBlockModel {
        switch (count) {
            case 0:
            case 1:
                return blockBd.compositeBlock("\\int");
            case 2:
                return blockBd.compositeBlock("\\iint");
            case 3:
                return blockBd.compositeBlock("\\iiint");
        }

        return blockBd.compositeBlock("\\int");
    }
}

type Symbol = P2Pr.Symbol;