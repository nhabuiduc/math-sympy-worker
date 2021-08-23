import { generator } from "@lib-shared/id-generator";
import { _l } from "../../light-lodash";
import { prTransformHelper } from "./pr-transform/pr-transform-helper";
import { symbolIndexSerialize } from "../../symbol-index-serializer";
import type { P2Pr } from "./p2pr";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { blockBd } from "./block-bd";
import { Derivative } from "./pr2m/derivative";

export class Pr2M {
    private derivative = new Derivative(this);
    constructor(private constantTextFuncSet: Set<string>) {
    }

    convert(obj: P2Pr.Symbol): BlockModel[] {
        return this.innerConvert(obj, 0).blocks;
    }

    private innerConvert(obj: P2Pr.Symbol, level: number): CResult {

        switch (obj.type) {
            case "Add": {
                return this.joinAddOp(obj.symbols, level);
            }
            case "Integer": {
                return {
                    blocks: [blockBd.textBlock(obj.value.toString())],
                }
            }
            case "Float": {
                return {
                    blocks: [blockBd.textBlock(obj.value.toString())],
                }
            }
            case "NaN": {
                return {
                    blocks: [blockBd.normalText("NaN")],
                }
            }
            case "ConstantSymbol": {
                if (obj.name == "∞̃") {
                    /**this look better */
                    return { blocks: [blockBd.compositeBlock("\\small-tilde", ["value"], [[blockBd.textBlock("∞")]])] }
                }
                if (obj.showType == "text") {
                    return { blocks: [blockBd.normalText(obj.name)] };
                }
                return { blocks: [blockBd.textBlock(obj.name)] }
            }
            case "Var": {
                return this.convertVarSymbol(obj);
            }
            case "Mul": {
                return this.joinMulOp(obj.symbols, level);
            }
            case "Pow": {
                return this.buildPow(obj, obj.symbols, level);
            }
            case "Frac": {
                return this.buildFrac(obj.symbols);
            }
            case "One": {
                return { blocks: [blockBd.textBlock("1")] };
            }
            case "Zero": {
                return { blocks: [blockBd.textBlock("0")] };
            }
            case "Half": {
                return this.frac(
                    [blockBd.textBlock("1")],
                    [blockBd.textBlock("2")])
            }
            case "NegativeOne": {
                return this.crs([blockBd.textBlock("-1")]);
            }
            case "Sqrt": {
                if (obj.symbols.length <= 1) {
                    return this.crs([blockBd.compositeBlock("\\sqrt", ["value"], [this.innerConvert(obj.symbols[0], 0).blocks])])
                }

                return this.crs([blockBd.compositeBlock("\\sqrt", ["value", "sub1"], [this.innerConvert(obj.symbols[0], 0).blocks, this.innerConvert(obj.symbols[1], 0).blocks])])
            }
            case "GenericFunc": {
                const { name, args, index } = this.buildToGenericFunc(obj);
                return { blocks: name.concat(index).concat(args) }
            }
            case "Matrix": {
                const matrixBlock = blockBd.compositeBlock("\\matrix", [], []) as MatrixLikeBlockModel;
                matrixBlock.bracket = "[";
                matrixBlock.row = obj.row;
                matrixBlock.column = obj.col;

                let cellIdx = 0;
                for (let rIdx = 0; rIdx < obj.row; rIdx++) {
                    for (let cIdx = 0; cIdx < obj.col; cIdx++) {
                        const editorModel = blockBd.editorFrom(this.innerConvert(obj.symbols[cellIdx], 0).blocks);
                        const cellKey = tabularKeyInfoHelper.getKeyFromRowCol(rIdx, cIdx);
                        (matrixBlock.elements[cellKey] as EditorModel) = editorModel;
                        cellIdx++;
                    }
                }
                return { blocks: [matrixBlock] };
            }
            case "Str": {
                return { blocks: [blockBd.normalText(obj.text)] }
            }

            case "CoordSys3D": {
                return this.convertFullNameFunc(obj.type, obj.symbols);
            }
            case "BaseVector": {
                const systemNameBlocks = obj.systemName ? [blockBd.indexBlock(obj.systemName, { mathType: "\\mathbf" })] : [];
                return {
                    blocks: [
                        blockBd.hat(obj.name, { mathType: "\\mathbf" }),
                        ...systemNameBlocks,
                    ]
                }
            }
            case "BaseScalar": {
                const systemNameBlocks = obj.systemName ? [blockBd.indexBlock(obj.systemName, { mathType: "\\mathbf" })] : [];
                return {
                    blocks: [
                        blockBd.textBlock(obj.name, { mathType: "\\mathbf" }),
                        ...systemNameBlocks,
                    ]
                }
            }
            case "VectorZero": {
                return {
                    blocks: [
                        blockBd.hat("0", { mathType: "\\mathbf" }),
                    ]
                }
            }
            case "Point": {
                return this.convertFullNameFunc(obj.type, obj.symbols);
                // return { blocks: [blockBd.textBlock(obj.name)] }
            }
            case "Tuple": {
                const join = this.joinBy(obj.symbols, ", ").blocks;
                return { blocks: blockBd.wrapBetweenBrackets(join) }
            }
            case "List": {
                const join = this.joinBy(obj.symbols, obj.separator).blocks;
                return { blocks: blockBd.wrapBetweenBrackets(join, "[") }
            }
            case "BaseDyadic": {
                const first = this.innerConvert(obj.symbols[0], 0).blocks;
                const second = this.innerConvert(obj.symbols[1], 0).blocks;
                return {
                    blocks: blockBd.wrapBetweenBrackets(
                        first.concat([blockBd.compositeBlock("\\middle|", [], []) as BlockModel].concat(second))
                    )
                }
            }
            case "Derivative": {
                return { blocks: this.derivative.convert(obj) };
            }
            case "Exp": {
                return {
                    blocks: [
                        blockBd.textBlock("𝑒"),
                        blockBd.powerBlock(this.innerConvert(obj.symbols[0], 0).blocks)
                    ]
                }
            }
            case "Relational": {
                return {
                    blocks: [
                        ...this.innerConvert(obj.symbols[0], level).blocks,
                        blockBd.textBlock(this.relationalOpMap(obj.relOp)),
                        ...this.innerConvert(obj.symbols[1], level).blocks,
                    ]
                }
            }
            case "Poly": {
                const args = obj.symbols.map(c => this.innerConvert(c, 0).blocks);
                const domain = [blockBd.normalText("Domain="), ...this.innerConvert(obj.domain, 0).blocks];
                return {
                    blocks: blockBd.argumentBlocks(args.concat([domain]), ",")
                }
            }
            case "PolynomialRing": {
                return {
                    blocks: [
                        ...this.innerConvert(obj.domain, 0).blocks,
                        ...blockBd.argumentBlocks(obj.symbols.map(s => this.innerConvert(s, 0).blocks), ",", "["),
                    ]
                }
            }
            case "DisplayedDomain": {
                return {
                    blocks: [
                        blockBd.textBlock(obj.name, { mathType: "\\mathbb" })
                    ]
                }
            }

            case "UnknownFunc": {
                return this.convertFullNameFunc(obj.name, obj.symbols);
            }
        }

        return { blocks: [] };
    }

    private relationalOpMap(opIn: P2Pr.Relational["relOp"]): string {
        switch (opIn) {
            case "==": return "=";
            case "<": return "<";
            case ">": return ">";
            case ">=": return "≥";
            case "<=": return "≤";
            case "!=": return "≠";
        }

        return "="
    }


    private convertFullNameFunc(name: string, symbbol: Symbol[]): CResult {
        return {
            blocks: [
                blockBd.normalText(name),
                ...blockBd.wrapBetweenBrackets(this.joinBy(symbbol, ", ").blocks),
            ]
        }
    }

    private buildToGenericFunc(obj: P2Pr.GenericFunc): GenericFuncResult {
        const args = this.buildGenericFuncArgs(obj, obj.symbols);

        return {
            name: [blockBd.operationFuncBlock(obj.func, this.constantTextFuncSet)],
            index: args.index,
            args: args.args,
        }
    }

    private convertVarSymbol(obj: P2Pr.Var): CResult {
        if (obj.indexJson) {
            const { lines } = symbolIndexSerialize.parseJson(obj.indexJson);

            return this.crs([
                blockBd.textBlock(obj.name),
                blockBd.indexBlock(lines),
            ]);
        }
        return this.crs([blockBd.textBlock(obj.name, obj.bold ? { mathType: "\\mathbf" } : undefined)]);
    }

    private buildGenericFuncArgs(container: { indexExist?: boolean }, symbols: Symbol[]): GenericFuncArgsResult {
        let argSymbols = symbols;
        let idx: [BlockModel?] = [];
        if (container.indexExist) {
            idx = [blockBd.compositeBlock("\\power-index", ["indexValue"], [this.innerConvert(symbols[0], 0).blocks])];
            argSymbols = symbols.slice(1);
        }

        return {
            index: idx,
            args: blockBd.wrapBetweenBrackets(
                blockBd.joinBlocks(argSymbols.map(s => this.innerConvert(s, 0).blocks), ", ")
            )
        };
    }

    // private wrapBracketsIfNotSingleVar(argSymbols: Symbol[], blocks: BlockModel[]) {
    //     if (argSymbols.length == 1) {
    //         switch (argSymbols[0].kind) {
    //             case "Leaf": {
    //                 return blocks;
    //             }

    //         }
    //     }

    //     return blockBd.wrapBetweenBrackets(blocks);
    // }

    private frac(numerator: BlockModel[], denominator: BlockModel[]) {
        return this.crs([
            blockBd.compositeBlock("\\frac", ["value", "sub1"], [
                numerator,
                denominator,
            ])])
    }

    private buildFrac(args: P2Pr.Symbol[]): CResult {
        if (args.length != 2) {
            throw new Error("Unsupported frac with different than 2 arguments");
        }

        const enumerator = this.innerConvert(args[0], 0).blocks;
        const denominator = this.innerConvert(args[1], 0).blocks;

        const fracBlock = blockBd.compositeBlock("\\frac", ["value", "sub1"], [enumerator, denominator]);
        return this.crs([fracBlock]);
    }

    private buildPow(pow: { indexJson: string }, args: P2Pr.Symbol[], level: number): CResult {
        if (args.length > 3) {
            throw new Error("Unsupported power with different than 2,3 arguments");
        }

        if (args[0].type == "GenericFunc") {
            return this.handlePowToGenericFunc(args, level);
        }

        let base = this.innerConvert(args[0], level + 1).blocks;
        if (args[0].type == "Pow" || args[0].type == "Frac" || args[0].type == "Sqrt") {
            base = blockBd.wrapBetweenBrackets(base);
        }

        const power = this.innerConvert(args[1], 0).blocks;
        if (pow.indexJson) {
            const cBlock = blockBd.compositeBlock("\\power-index", ["powerValue"], [power]);
            (cBlock.elements["indexValue"] as EditorModel) = {
                id: generator.nextId(),
                lines: symbolIndexSerialize.parseJson(pow.indexJson).lines,
            }

            return this.crs(base.concat([cBlock]));
        } else if (args[2]) {
            const index = this.innerConvert(args[2], 0).blocks;
            const cBlock = blockBd.compositeBlock("\\power-index", ["powerValue", "indexValue"], [power, index]);
            return { blocks: base.concat([cBlock]) };

        }
        return this.crs(base.concat([blockBd.compositeBlock("\\power-index", ["powerValue"], [power])]));
    }

    private handlePowToGenericFunc(powArgs: P2Pr.Symbol[], level: number): CResult {
        const power = this.innerConvert(powArgs[1], level + 1).blocks;
        const genericFunc = powArgs[0] as P2Pr.GenericFunc;
        const { name, index, args } = this.buildToGenericFunc(genericFunc);

        let powerBlock: CompositeBlockModel;
        if (index.length > 0) {
            const innerIdx = (index[0] as CompositeBlockModel).elements["indexValue"].lines[0].blocks;
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue", "indexValue"], [power, innerIdx]);
        } else {
            powerBlock = blockBd.compositeBlock("\\power-index", ["powerValue"], [power]);
        }

        return this.crs([
            ...name,
            powerBlock,
            ...args,
        ])
    }



    private crs(blocks: BlockModel[]): CResult {
        return { blocks };
    }

    private joinAddOp(args: P2Pr.Symbol[], level: number): CResult {
        let items = args.map(a => this.innerConvert(a, level + 1));

        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            if (idx == 0) {
                blocks = blockBd.combine2Blocks(blocks, item.blocks);
                continue;
            }
            if (prTransformHelper.symbolStartWithMinus(args[idx])) {
                blocks = blockBd.combine2Blocks(blocks, item.blocks);
                continue;
            }

            blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock("+")], item.blocks);
        }

        if (level == 0) {
            return this.crs(blocks);
        }

        return this.crs(blockBd.wrapBetweenBrackets(blocks));
    }

    private joinBy(args: P2Pr.Symbol[], text: string): CResult {
        const items = args.map(a => this.innerConvert(a, 0));
        let blocks: BlockModel[] = [];
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            if (idx > 0) {
                blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock(text)], item.blocks);
            } else {
                blocks = blockBd.combineMultipleBlocks(blocks, item.blocks);
            }
        }
        return { blocks };
    }

    private joinMulOp(args: P2Pr.Symbol[], level: number): CResult {
        const items = args.map(a => this.innerConvert(a, level + 1));
        let blocks: BlockModel[] = [];
        let isNegative = false;

        let prevAdjacentArg: Symbol;
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            const curArg = args[idx];

            if (curArg.type == "NegativeOne" || (curArg.type == "Integer" && curArg.value == -1)) {
                isNegative = !isNegative;
                continue;
            }
            if (curArg.type == "One" || (curArg.type == "Integer" && curArg.value == 1)) {
                continue;
            }

            if (this.shouldSeparateByMulSymbol(prevAdjacentArg, args[idx])) {
                blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock("×")], item.blocks);
            } else {
                blocks = blockBd.combine2Blocks(blocks, item.blocks);
            }

            prevAdjacentArg = args[idx];
        }

        if (isNegative) {
            return { blocks: blockBd.combine2Blocks([blockBd.textBlock("-")], blocks) };
        }

        return { blocks };
    }

    private shouldSeparateByMulSymbol(prev: Symbol, cur: Symbol) {
        if (!prev || !cur) {
            return false;
        }
        return this.firstShouldPosfixMul(prev) && this.secondShouldPrefixMul(cur);
    }

    private secondShouldPrefixMul(s: Symbol): boolean {
        if (prTransformHelper.isConstant(s)) {
            return true;
        }

        if (s.type == "Frac") {
            return true;
        }

        if (s.type == "Mul" || s.type == "Pow") {
            return this.secondShouldPrefixMul(_l.first(s.symbols));
        }
    }

    private firstShouldPosfixMul(s: Symbol): boolean {
        if (prTransformHelper.isConstant(s)) {
            return true;
        }

        if (s.type == "Frac") {
            return true;
        }


        if (s.type == "Mul") {
            return this.firstShouldPosfixMul(_l.last(s.symbols));
        }
    }




}

interface GenericFuncArgsResult {
    index: [BlockModel?];
    args: BlockModel[];
}

interface GenericFuncResult {
    name: BlockModel[];
    index: [BlockModel?];
    args: BlockModel[];
}

type Symbol = P2Pr.Symbol;
interface CResult {
    blocks: BlockModel[];
}