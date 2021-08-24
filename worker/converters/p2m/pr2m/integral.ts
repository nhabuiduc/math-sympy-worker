import { blockBd } from "../block-bd";
import type { P2Pr } from "../p2pr";

export class Integral {
    constructor(private main: { convert(obj: P2Pr.Symbol): BlockModel[] }) {

    }

    convert(derivative: P2Pr.Integral, level: number): BlockModel[] {
        const limits = derivative.symbols.slice(1);
        let intBlocks: CompositeBlockModel[];
        let symbolBlocks: BlockModel[];
        if (limits.length <= 3 && limits.every(c => (c as P2Pr.Tuple).symbols.length == 1)) {
            intBlocks = [this.intBlockByCount(limits.length)];
            symbolBlocks = blockBd.joinBlocks(limits.map(c => {
                const rs = this.main.convert((c as P2Pr.Tuple).symbols[0]);
                return [blockBd.textBlock("d")].concat(rs);
            }), " ");
        } else {
            intBlocks = [];
            const sBlockss: BlockModel[][] = [];
            for (let idx = limits.length - 1; idx >= 0; idx--) {
                const lim = limits[idx] as P2Pr.Tuple;
                let intBlock: CompositeBlockModel;
                if (lim.symbols.length >= 3) {
                    intBlock = blockBd.compositeBlock("\\int", ["indexValue", "powerValue"],
                        [this.main.convert(lim.symbols[1]), this.main.convert(lim.symbols[2])]);
                } else if (lim.symbols.length >= 2) {
                    intBlock = blockBd.compositeBlock("\\int", ["powerValue"],
                        [this.main.convert(lim.symbols[1])]);
                } else {
                    intBlock = blockBd.compositeBlock("\\int");
                }

                intBlocks.push(intBlock);
                sBlockss.unshift(this.main.convert(lim.symbols[0]));
            }
            symbolBlocks = blockBd.joinBlocks(sBlockss, " ");
        }

        return blockBd.combineMultipleBlocks(
            intBlocks,
            this.main.convert(derivative.symbols[0]),
            [blockBd.textBlock(" ")],
            symbolBlocks,
        )
        return [];
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
