import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class Pr2MCommon {
    constructor(
        private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult },
        private constantTextFuncSet: Set<string>,
        private symbolLatexNames: { [key: string]: string }
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

    buildGenericFunc(obj: P2Pr.GenericFunc): GenericFuncResult {

        const args = this.buildGenericFuncArgs(obj.symbols, obj.noBracketIfArgEmpty);

        let nameBlock: BlockModel;
        if (obj.specialFuncClass) {
            // let nameText = obj.func;
            switch (obj.func) {
                case "KroneckerDelta": {
                    nameBlock = blockBd.textBlock("𝛿");
                    break;
                }
                case "gamma": {
                    nameBlock = blockBd.textBlock("𝛤");
                    break;
                }
                case "lowergamma": {
                    nameBlock = blockBd.textBlock("𝛾");
                    break;
                }
                case "beta": {
                    nameBlock = blockBd.operatorNameBlock("B");
                    break;
                }
                case "DiracDelta": {
                    nameBlock = blockBd.textBlock("𝛿");
                    break;
                }
                case "Chi": {
                    nameBlock = blockBd.operatorNameBlock("Chi");
                    break;
                }
            }
        } else {
            nameBlock = blockBd.operatorFuncBlock(obj.func, this.constantTextFuncSet, this.symbolLatexNames);
        }
        return {
            name: [nameBlock],
            args: args.args,
        }
    }

    private buildGenericFuncArgs(symbols: Symbol[], noBracketIfArgEmpty?: boolean): GenericFuncArgsResult {
        let argSymbols = symbols;
        if (argSymbols.length <= 0 && noBracketIfArgEmpty) {
            return { args: [] }
        }

        return {
            args: blockBd.wrapBetweenBrackets(
                blockBd.joinBlocks(argSymbols.map(s => this.main.convert(s).blocks), ", ")
            ).blocks
        };
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

interface GenericFuncArgsResult {
    args: BlockModel[];
}

interface GenericFuncResult {
    name: BlockModel[];
    args: BlockModel[];
}

type Symbol = P2Pr.Symbol;