import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class Pr2MCommon {
    constructor(
        private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult }
    ) {

    }

    private ifOpPowDeprecate = (item: Pr2M.CResult): boolean => {
        return item.prUnit == "op";
    }
    private ifOpExcludeMulShortcutDeprecate = (item: Pr2M.CResult): boolean => {
        if (item.prUnit != "op") {
            return false;
        }

        if (item.prOp == "mul" && item.prMul?.allInShortcutForm) {
            return false;
        }

        return true;
    }

    private alwaysFalse = () => {
        return false;
    }

    private getDeprecate(type: Pr2MCommon.JoinOptions["wrapBracket"]): (item: Pr2M.CResult) => boolean {
        if (!type) {
            return this.alwaysFalse;
        }
        if (type == "if-op-exclude-mul-shortcut") {
            return this.ifOpExcludeMulShortcutDeprecate;
        }
        return this.ifOpPowDeprecate;
    }

    

    join(args: P2Pr.Symbol[], text?: string, options?: Pr2MCommon.JoinOptions): Pr2M.CResult {
        options = options || { wrapBracket: "if-op" }
        let items = args.map(a => this.main.convert(a));

        let blocks: BlockModel[] = [];
        const deprecate = this.getDeprecate(options.wrapBracket);
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            let curBlocks = (deprecate && deprecate(item)) ? blockBd.wrapBracketIfOp(item) : item.blocks;

            if (idx == 0 || !text) {
                blocks = blockBd.combine2Blockss(blocks, curBlocks);
                continue;
            }

            blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock(text)], curBlocks);
        }

        return { blocks, prUnit: "op" };
    }
}


export namespace Pr2MCommon {
    export interface JoinOptions {
        wrapBracket: "if-op" | "if-op-exclude-mul-shortcut";
    }
}

