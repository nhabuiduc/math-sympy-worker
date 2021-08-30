import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Sum extends Pr2MItemBase {
    convert(obj: P2Pr.C<"Sum">): Pr2M.CResult {
        const func = obj.symbols[0];
        const limits = obj.symbols.slice(1) as P2Pr.VarList[];
        let funcBlocks = this.main.convert(func).blocks;
        if (func.type == "Add") {
            funcBlocks = blockBd.wrapBetweenBrackets(funcBlocks).blocks;
        }
        let sumBlocks: BlockModel[];
        if (limits.length <= 0) {
            sumBlocks = [blockBd.compositeBlock("\\sum")];
        }
        else if (limits.length == 1) {
            sumBlocks = [
                blockBd.compositeBlock("\\sum", ["to", "from"], [
                    this.main.prCommon.equals(limits[0].symbols[0], limits[0].symbols[1]).blocks,
                    this.main.convert(limits[0].symbols[2]).blocks
                ])
            ];
        } else {
            const eqExprs: BlockModel[][] = [];
            for (const s of limits) {
                eqExprs.push(this.main.prCommon.leqleq(s.symbols[0], s.symbols[1], s.symbols[2]).blocks)
            }
            const sumBlock = blockBd.compositeBlock("\\sum");
            (sumBlock.elements["to"] as EditorModel) = blockBd.editorFromLines(eqExprs);
        }

        return { blocks: blockBd.combine2Blockss(sumBlocks, funcBlocks) }
    }
}