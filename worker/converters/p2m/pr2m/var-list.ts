import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { prTh } from "../pr-transform/pr-transform-helper";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class VarList extends Pr2MItemBase {
    convert(obj: P2Pr.VarList): Pr2M.CResult {
        if (!obj.bracket && !obj.separator) {
            return { blocks: blockBd.flattenBlocks(this.mapBlocksAndWrapIfRequire(obj.symbols, obj.wrapItemOnJoinIfRequire)) }
        }

        let blocks: BlockModel[];

        if (obj.separator) {

            const separator = this.buildSeparatorBlock(obj.separator, obj.separatorSpacing);
            blocks = blockBd.joinBlocks(this.mapBlocksAndWrapIfRequire(obj.symbols, obj.wrapItemOnJoinIfRequire), separator)
        } else {
            blocks = blockBd.flattenBlocks(this.mapBlocksAndWrapIfRequire(obj.symbols, obj.wrapItemOnJoinIfRequire))
        }


        if (obj.bracket) {
            return blockBd.wrapBetweenBrackets(blocks, obj.bracket, obj.rightBracket);
        }
        return { blocks }
    }

    private mapBlocksAndWrapIfRequire(ss: Symbol[], wrapOnJoinIfRequire: boolean): BlockModel[][] {
        if (!wrapOnJoinIfRequire) {
            return this.main.m(ss);
        }
        return ss.map(s => {
            const rs = this.c(s);
            if (!prTh.considerPresentAsSingleUnitInOpCtx(s, rs)) {
                return blockBd.wrapBetweenBrackets(rs.blocks).blocks;
            }
            return rs.blocks;
        })
    }

    private buildSeparatorBlock(separator: P2Pr.VarList["separator"], sSpacing: P2Pr.VarList["separatorSpacing"]): string | (() => BlockModel | BlockModel[]) {
        switch (separator) {
            case "|": {
                return () => this.spaceAroundBlock(blockBd.compositeBlock("\\middle|"), sSpacing)
            }
        }
        return this.spaceAroundText(separator, sSpacing);
    }

    private spaceAroundText(text: string, sSpacing: P2Pr.VarList["separatorSpacing"]): string {
        if (!sSpacing) {
            return text;
        }
        if (sSpacing == "around") {
            return ` ${text} `
        }
        if (sSpacing == "before") {
            return ` ${text}`;
        }

        return `${text} `;
    }

    private spaceAroundBlock(block: BlockModel, sSpacing: P2Pr.VarList["separatorSpacing"]): BlockModel | BlockModel[] {
        if (!sSpacing) {
            return block;
        }

        if (sSpacing == "around") {
            return blockBd.combineMultipleBlocks([blockBd.textBlock(" "), block, blockBd.textBlock(" ")]);
        }
        if (sSpacing == "before") {
            return blockBd.combineMultipleBlocks([blockBd.textBlock(" "), block]);
        }

        return blockBd.combineMultipleBlocks([block, blockBd.textBlock(" ")]);
    }
}

type Symbol = P2Pr.Symbol;