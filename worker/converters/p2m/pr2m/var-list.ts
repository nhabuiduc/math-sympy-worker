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
            let separator: string | (() => BlockModel);
            switch (obj.separator) {
                case ",":
                case ";": {
                    separator = obj.separator
                    break;
                }
                case "|": {
                    separator = () => blockBd.compositeBlock("\\middle|")
                }
            }

            blocks = blockBd.joinBlocks(this.main.convertMaps(obj.symbols), separator)
        } else {
            blocks = blockBd.flattenBlocks(this.main.convertMaps(obj.symbols))
        }

        if (obj.bracket) {
            return blockBd.wrapBetweenBrackets(blocks, obj.bracket, obj.rightBracket);
        }
        return { blocks }
    }
}