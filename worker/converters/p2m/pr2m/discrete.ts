import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class Discrete {
    constructor(private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult }) {

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
                return this.discreteJoin(obj.symbols, "∧");
            }
            case "Or": {
                return this.discreteJoin(obj.symbols, "∨");
            }
            case "Implies": {
                return this.discreteJoin(obj.symbols, "⇒");
            }
        }
    }

    private discreteJoin(args: P2Pr.Symbol[], text: string): Pr2M.CResult {
        let items = args.map(a => this.main.convert(a));

        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            if (idx == 0) {
                blocks = blockBd.combine2Blockss(blocks, blockBd.wrapBracketIfOp(item));
                continue;
            }

            blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock(text)], blockBd.wrapBracketIfOp(item));
        }

        return { blocks, prUnit: "op" };
    }
}