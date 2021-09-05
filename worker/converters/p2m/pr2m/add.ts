import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prSymbolVisuallyInfo } from "../pr-transform/pr-symbol-visually-info";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Add extends Pr2MItemBase {

    convert(obj: P2Pr.Add): Pr2M.CResult {
        const { symbols: args } = obj;
        let items = args.map(a => this.main.c(a));

        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const checkRs = prSymbolVisuallyInfo.check(args[idx], item);
            const blocksToAdd = this.shouldWrapBrackets(checkRs) ? blockBd.wrapBetweenBrackets(item.blocks).blocks : item.blocks;
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

    private shouldWrapBrackets(checked: ReturnType<typeof prSymbolVisuallyInfo["check"]>) {
        if (checked.prOp == "parts" && checked.prSign && checked.prExcludeSign == "unit") {
            return false;
        }
        return checked.prOp != "unit"
    }
}