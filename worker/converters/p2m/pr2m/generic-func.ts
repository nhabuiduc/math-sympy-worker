import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2MItemBase } from "./pr2m-item-base";

export class GenericFunc extends Pr2MItemBase {

    buildGenericFunc(obj: P2Pr.GenericFunc): GenericFuncResult {
        if (this.main.ctx.ops.reim?.gothic) {
            if (obj.func == "im") {
                obj.func = "ℑ";
            }
            if (obj.func == "re") {
                obj.func = "ℜ";
            }
        }
        const args = this.buildGenericFuncArgs(obj.symbols, obj.argSeparator || ",", obj.bracket);

        const nameBlock = (typeof obj.func == "string")
            ? [blockBd.operatorFuncBlock(obj.func, this.main.ctx.constantTextFuncSet, this.main.ctx.symbolLatexNames, obj.forceUsingOperatorName)]
            : blockBd.wrapBracketIfNotUnitInOpCtx(obj.func, this.main.c(obj.func)).blocks

        return {
            name: nameBlock,
            args: args.args,
        }
    }

    private buildGenericFuncArgs(symbols: Symbol[], argSeparator: P2Pr.GenericFunc["argSeparator"], bracket: P2Pr.GenericFunc["bracket"] = "("): GenericFuncArgsResult {
        let argSymbols = symbols;
        if (argSymbols.length <= 0) {
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
            const separator = argSeparator == "," ? "," : () => blockBd.compositeBlock("\\middle|")
            join = blockBd.joinBlocks(argSymbols.map(s => this.main.convert(s).blocks), separator);
        }

        return {
            args: blockBd.wrapBetweenBrackets(join, bracket).blocks
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