import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prSymbolVisuallyInfo } from "../pr-transform/pr-symbol-visually-info";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Add extends Pr2MItemBase {

    convert(obj: P2Pr.Add): Pr2M.CResult {
        const { symbols: args } = obj;
        let items = args.map(a => this.main.convert(a));

        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const checkRs = prSymbolVisuallyInfo.check(args[idx], item);
            const blocksToAdd = (idx > 0 && checkRs.prOp == "parts" && (!checkRs.prSign || checkRs.prExcludeSign != "unit")) ? blockBd.wrapBetweenBrackets(item.blocks).blocks : item.blocks;
            if (idx == 0) {
                blocks = blockBd.combine2Blockss(blocks, blocksToAdd);
                continue;
            }

            if (checkRs.prSign) {
                blocks = blockBd.combine2Blockss(blocks, blocksToAdd);
                continue;
            }

            blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock("+")], blocksToAdd);
        }

        return { blocks };
    }

    // private shouldWrapBracketItem(cr: Pr2M.CResult): boolean {
    //     if (cr.prUnit == "op") {
    //         return cr.prOp != "add" && cr.prOp != "mul"
    //     }

    //     return false;
    // }
}