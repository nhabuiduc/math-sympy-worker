import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class Sum extends Pr2MItemBase {
    convert(obj: P2Pr.C<"Sum"> | P2Pr.C<"Product"> | P2Pr.C<"Limit">): Pr2M.CResult {
        if (obj.type == "Limit") {
            return this.convertLimit(obj);
        }
        const name = obj.type == "Sum" ? "\\sum" : "\\prod";
        const limits = obj.symbols.slice(1) as P2Pr.VarList[];

        let funcBlocks = blockBd.wrapBracketIfNotUnitInOpCtx(obj.symbols[0], this.main.c(obj.symbols[0]), { excludeSign: true }).blocks;
        let sumBlocks: BlockModel[];
        if (limits.length <= 0) {
            sumBlocks = [blockBd.compositeBlock(name)];
        }
        else if (limits.length == 1) {
            sumBlocks = [
                blockBd.compositeBlock(name, ["to", "from"], [
                    this.main.prCommon.equals(limits[0].symbols[0], limits[0].symbols[1]).blocks,
                    this.main.c(limits[0].symbols[2]).blocks
                ])
            ];
        } else {
            const eqExprs: BlockModel[][] = [];
            for (const s of limits) {
                eqExprs.push(this.main.prCommon.leqleq(s.symbols[1], s.symbols[0], s.symbols[2]).blocks)
            }
            const sumBlock = blockBd.compositeBlock(name);
            (sumBlock.elements["to"] as EditorModel) = blockBd.editorFromLines(eqExprs);
            sumBlocks = [sumBlock]
        }

        return { blocks: blockBd.combine2Blockss(sumBlocks, funcBlocks) }
    }

    private convertLimit(obj: P2Pr.C<"Limit">): Pr2M.CResult {
        const [e, z, z0, dir] = obj.symbols;
        const to = (dir.type == "Var" && dir.name == "+-") || prTh.isInfinity(z0) || prTh.isNegativeInfinity(z0)
            ? z0 : prTh.pow(z0, dir);

        const expr = blockBd.wrapBracketIfNotUnitInOpCtx(e, this.main.c(e), { excludeSign: true });
        const toBlocks: BlockModel[] = [
            ...this.c(z).blocks,
            blockBd.compositeBlock("\\rightarrow"),
            ...this.c(to).blocks,
        ];

        return {
            blocks: [
                blockBd.compositeBlock("\\lim", ["to"], [toBlocks]),
                ...expr.blocks,
            ]
        }
    }


}

