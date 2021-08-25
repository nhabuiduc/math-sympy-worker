import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class Add {
    constructor(private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult }) {

    }

    convert(obj: P2Pr.Add): Pr2M.CResult {
        const { symbols: args } = obj;
        let items = args.map(a => this.main.convert(a));

        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const blocksToAdd = (item.prUnit == "op" && item.prOp != "add" && item.prOp != "mul") ? blockBd.wrapBetweenBrackets(item.blocks).blocks : item.blocks;
            if (idx == 0) {
                blocks = blockBd.combine2Blockss(blocks, blocksToAdd);
                continue;
            }

            if (item.prMinusSign) {
                blocks = blockBd.combine2Blockss(blocks, blocksToAdd);
                continue;
            }

            blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock("+")], blocksToAdd);
        }

        return { blocks, prUnit: "op", prOp: "add" };
    }
}