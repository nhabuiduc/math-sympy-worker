import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { Pr2MItemBase } from "./pr2m-item-base";

export class VarList extends Pr2MItemBase {
    convert(obj: P2Pr.VarList): Pr2M.CResult {
        if (!obj.bracket && !obj.separator) {
            return { blocks: blockBd.flattenBlocks(this.main.convertMaps(obj.symbols)) }
        }

        let blocks: BlockModel[];

        if (obj.separator) {

            const separator = this.buildSeparatorBlock(obj.separator, obj.separatorSpacing);
            blocks = blockBd.joinBlocks(this.main.convertMaps(obj.symbols), separator)
        } else {
            blocks = blockBd.flattenBlocks(this.main.convertMaps(obj.symbols))
        }

        if (obj.bracket) {
            return blockBd.wrapBetweenBrackets(blocks, obj.bracket, obj.rightBracket);
        }
        return { blocks }
    }

    private buildSeparatorBlock(separator: P2Pr.VarList["separator"], sSpacing: P2Pr.VarList["separatorSpacing"]): string | (() => BlockModel | BlockModel[]) {
        switch (separator) {
            case ",":
            case ";": {
                return this.spaceAroundText(separator, sSpacing);
                break;
            }
            case "|": {
                return () => this.spaceAroundBlock(blockBd.compositeBlock("\\middle|"), sSpacing)
            }
        }
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