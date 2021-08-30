import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Subs extends Pr2MItemBase {
    convert(obj: P2Pr.Subs): Pr2M.CResult {
        const expr = this.main.convert(obj.symbols[0]);
        const set1 = obj.symbols[1] as P2Pr.VarList;
        const set2 = obj.symbols[2] as P2Pr.VarList;
        const eqExprs: BlockModel[][] = [];
        for (let idx = 0; idx < set1.symbols.length; idx++) {
            const s1 = set1.symbols[idx] || prTh.var(" ");
            const s2 = set2.symbols[idx] || prTh.var(" ");

            eqExprs.push(this.main.prCommon.equals(s1, s2).blocks);
        }

        const indexBlock = blockBd.compositeBlock("\\power-index");
        (indexBlock.elements["indexValue"] as EditorModel) = blockBd.editorFromLines(eqExprs);

        return {
            blocks: [
                blockBd.bracketBlock("\\left."),
                ...expr.blocks,
                blockBd.bracketBlock("\\right|"),
                indexBlock
            ]
        }
    }
}