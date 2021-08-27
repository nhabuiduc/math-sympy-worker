import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class GenericFunc {
    constructor(
        private main: { convert(obj: P2Pr.Symbol): Pr2M.CResult },
        private constantTextFuncSet: Set<string>,
        private symbolLatexNames: { [key: string]: string }
    ) {

    }

    buildGenericFunc(obj: P2Pr.GenericFunc): GenericFuncResult {

        const args = this.buildGenericFuncArgs(obj.symbols, obj.noBracketIfArgEmpty, obj.argSeparator || ",");

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

    private buildGenericFuncArgs(symbols: Symbol[], noBracketIfArgEmpty: boolean, argSeparator: P2Pr.GenericFunc["argSeparator"]): GenericFuncArgsResult {
        let argSymbols = symbols;
        if (argSymbols.length <= 0 && noBracketIfArgEmpty) {
            return { args: [] }
        }

        let join: BlockModel[];
        if (argSeparator == ";|") {
            if (symbols.length <= 2) {
                join = blockBd.joinBlocks(argSymbols.map(s => this.main.convert(s).blocks), ";");
            } else {
                const first = this.main.convert(argSymbols[0]).blocks;
                const secondJoin = blockBd.joinBlocks(argSymbols.slice(1).map(s => this.main.convert(s).blocks), () => blockBd.compositeBlock("\\middle|"));
                join = blockBd.joinBlocks([first, secondJoin], ";");
            }
        } else {
            const separator = argSeparator == "," ? ", " : () => blockBd.compositeBlock("\\middle|")
            join = blockBd.joinBlocks(argSymbols.map(s => this.main.convert(s).blocks), separator);
        }

        return {
            args: blockBd.wrapBetweenBrackets(join).blocks
        };
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