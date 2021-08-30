import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Order extends Pr2MItemBase {
    convert(obj: P2Pr.C<"Order">): Pr2M.CResult {
        const exp = this.main.convert(obj.symbols[0]);
        const runs = obj.symbols.slice(1) as P2Pr.VarList[];
        if (runs.length <= 1 && (!runs[0] || prTh.isZero(runs[0].symbols[1]))) {
            return { blocks: [blockBd.textBlock("O"), ...blockBd.wrapBetweenBrackets(exp.blocks).blocks] }
        }
        let runsRs: BlockModel[]
        if (runs.length == 1) {
            runsRs = blockBd.joinBlocks(this.main.convertMaps(runs[0].symbols), () => blockBd.compositeBlock("\\rightarrow"))
        } else {
            const forms = prTh.list(runs.map(r => r.symbols[0]));
            const tos = prTh.list(runs.map(r => r.symbols[1]));
            runsRs = blockBd.joinBlocks(this.main.convertMaps([forms, tos]), () => blockBd.compositeBlock("\\rightarrow"))
        }


        return {
            blocks: [
                blockBd.textBlock("O"),
                ...blockBd.wrapBetweenBrackets(
                    blockBd.joinBlocks([
                        exp.blocks,
                        [blockBd.textBlock(";")],
                        runsRs
                    ])
                ).blocks
            ]
        }
    }
}
