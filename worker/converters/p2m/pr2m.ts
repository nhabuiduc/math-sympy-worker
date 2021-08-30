import { _l } from "../../light-lodash";
import { prTh } from "./pr-transform/pr-transform-helper";
import type { P2Pr } from "./p2pr";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { blockBd } from "./block-bd";
import { Derivative } from "./pr2m/derivative";
import { Integral } from "./pr2m/integral";
import { Float } from "./pr2m/float";
import { Mul } from "./pr2m/mul";
import { Discrete } from "./pr2m/discrete";
import { Add } from "./pr2m/add";
import { Pow } from "./pr2m/pow";
import { Order } from "./pr2m/order";
import { VarList } from "./pr2m/var-list";
import { Subs } from "./pr2m/subs";
import { Sum } from "./pr2m/sum";

import { Pr2MCommon } from "./pr2m/pr2m-common";
import { symbolIndexSerialize } from "@sympy-worker/symbol-index-serializer";
import { GenericFunc } from "./pr2m/generic-func";


export class Pr2M {
    private derivative = new Derivative(this);
    private integral = new Integral(this);
    private float = new Float(this);
    private mul = new Mul(this);
    private discrete = new Discrete(this);
    private add = new Add(this);
    private pow = new Pow(this);
    private order = new Order(this);
    private varList = new VarList(this);
    private subs = new Subs(this);
    private sum = new Sum(this);

    public prCommon = new Pr2MCommon(this);
    public genericFunc: GenericFunc;

    constructor(constantTextFuncSet: Set<string>, private symbolLatexNames: { [key: string]: string }) {
        this.genericFunc = new GenericFunc(this, constantTextFuncSet, symbolLatexNames)
    }

    convert(obj: P2Pr.Symbol, level = 0): CResult {
        return this.innerConvert(obj, level);
    }

    private innerConvert(obj: P2Pr.Symbol, level: number): CResult {

        switch (obj.type) {
            case "Add": {
                return this.add.convert(obj);
            }
            case "Integer": {
                return {
                    blocks: [blockBd.textBlock(obj.value.toString())],
                    prMinusSign: obj.value < 0,
                }
            }
            case "Float": {
                return this.float.convert(obj);
            }
            case "Discrete": {
                return this.discrete.convert(obj);

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

                const foundName = this.symbolLatexNames[obj.name]
                if (foundName) {
                    return { blocks: [blockBd.textBlock(foundName)] }
                }

                if (obj.showType == "text") {
                    return { blocks: [blockBd.normalText(obj.name)] };
                }
                return { blocks: [blockBd.textBlock(obj.name)] }
            }
            case "Raw":
            case "Var": {
                return this.convertVarRawSymbol(obj);
            }
            case "VarList": {
                return this.varList.convert(obj);
            }
            case "Mul": {
                return this.mul.convert(obj);
            }
            case "VecExpr": {
                switch (obj.op) {
                    case "Cross": return this.prCommon.opJoin(obj.symbols, "×");
                    case "Curl": return this.prCommon.opJoin([prTh.var("∇") as Symbol].concat(obj.symbols), "×");
                    case "Divergence": return this.prCommon.opJoin([prTh.var("∇") as Symbol].concat(obj.symbols), "⋅");
                    case "Dot": return this.prCommon.opJoin(obj.symbols, "⋅");
                    case "Gradient": return this.prCommon.opJoin([prTh.var("∇") as Symbol].concat(obj.symbols));
                    case "Laplacian": return this.prCommon.opJoin([prTh.var("▵") as Symbol].concat(obj.symbols));
                }

                // return this.common.join(obj.symbols, "×");
            }
            case "Pow": {
                return this.pow.convert(obj);
            }
            case "Index": {
                if (obj.symbols[0].type == "GenericFunc") {
                    const genericFunc = obj.symbols[0] as P2Pr.GenericFunc;
                    const { name, args } = this.genericFunc.buildGenericFunc(genericFunc);
                    const indexBlock = blockBd.indexBlock(this.innerConvert(obj.symbols[1], level).blocks);
                    const rsBlocks = obj.symbols[0].powerIndexPos == "all-after" ? [...name, ...args, indexBlock] : [...name, indexBlock, ...args];
                    return { blocks: rsBlocks }
                }
                return {
                    blocks: [
                        ...this.innerConvert(obj.symbols[0], level).blocks,
                        blockBd.indexBlock(this.innerConvert(obj.symbols[1], level).blocks)
                    ]
                }
            }
            case "PrescriptIdx": {
                return { blocks: [blockBd.compositeBlock("\\prescript", ["indexValue"], [this.convert(obj.symbols[0]).blocks])] }
            }
            case "JsonData": {
                return { blocks: symbolIndexSerialize.parseJson(obj.data).lines[0].blocks }
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
                return { blocks: [blockBd.textBlock("-1")], prMinusSign: true }
            }
            case "Sqrt": {
                if (obj.symbols.length <= 1) {
                    return { blocks: [blockBd.compositeBlock("\\sqrt", ["value"], [this.innerConvert(obj.symbols[0], 0).blocks])] }
                }

                return { blocks: [blockBd.compositeBlock("\\sqrt", ["value", "sub1"], [this.innerConvert(obj.symbols[0], 0).blocks, this.innerConvert(obj.symbols[1], 0).blocks])] }
            }
            case "GenericFunc": {

                const { name, args } = this.genericFunc.buildGenericFunc(obj);
                return { blocks: name.concat(args), prUnit: "func" }
            }
            case "Factorial": {
                const rsArg0 = this.innerConvert(obj.symbols[0], level);
                return {
                    blocks: blockBd.joinBlocks([
                        prTh.considerPresentAsSingleUnitForPow(obj.symbols[0], rsArg0) ? rsArg0.blocks : blockBd.wrapBetweenBrackets(rsArg0.blocks).blocks,
                        [blockBd.textBlock("!")],
                    ]),
                    prUnit: "factorial"
                }
            }
            case "Factorial2": {
                const rsArg0 = this.innerConvert(obj.symbols[0], level);
                return {
                    blocks: blockBd.joinBlocks([
                        prTh.considerPresentAsSingleUnitForPow(obj.symbols[0], rsArg0) ? rsArg0.blocks : blockBd.wrapBetweenBrackets(rsArg0.blocks).blocks,
                        [blockBd.textBlock("!!")],
                    ]),
                    prUnit: "factorial"
                }
            }
            case "SubFactorial": {
                const rsArg0 = this.innerConvert(obj.symbols[0], level);
                return {
                    blocks: blockBd.joinBlocks([
                        [blockBd.textBlock("!")],
                        prTh.considerPresentAsSingleUnitForPow(obj.symbols[0], rsArg0) ? rsArg0.blocks : blockBd.wrapBetweenBrackets(rsArg0.blocks).blocks,
                    ]),
                }
            }

            case "Matrix": {
                const matrixBlock = blockBd.compositeBlock("\\matrix", [], []) as MatrixLikeBlockModel;
                matrixBlock.bracket = obj.bracket;
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

                return { blocks: [matrixBlock], prUnit: obj.bracket ? "bracket" : undefined };
            }
            case "Str": {
                return { blocks: [blockBd.normalText(obj.text)] }
            }

            case "CoordSys3D": {
                const { name, args } = this.genericFunc.buildGenericFunc({
                    type: "GenericFunc", func: "CoordSys3D", kind: "Container", symbols: obj.symbols
                })
                return { blocks: name.concat(args) }
            }
            case "BaseVector": {
                return {
                    blocks: [
                        blockBd.hat(obj.name, { mathType: "\\mathbf" }),
                    ]
                }
            }
            case "BaseScalar": {
                return {
                    blocks: [
                        blockBd.textBlock(obj.name, { mathType: "\\mathbf" }),
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

            case "BaseDyadic": {
                const first = this.innerConvert(obj.symbols[0], 0).blocks;
                const second = this.innerConvert(obj.symbols[1], 0).blocks;
                return blockBd.wrapBetweenBrackets(
                    first.concat([blockBd.compositeBlock("\\middle|", [], []) as BlockModel].concat(second))
                );
            }
            case "Derivative": {
                return this.derivative.convert(obj, level);
            }
            case "Integral": {
                return { blocks: this.integral.convert(obj) };
            }
            case "Exp": {
                return {
                    blocks: [
                        blockBd.textBlock("e"),
                        blockBd.powerBlock(this.innerConvert(obj.symbols[0], 0).blocks)
                    ]
                }
            }
            case "Binomial": {
                return {
                    blocks: [
                        blockBd.binomBlock(this.innerConvert(obj.symbols[0], 0).blocks, this.innerConvert(obj.symbols[1], 0).blocks)
                    ],
                    prUnit: "bracket"
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
                return blockBd.argumentBlocks(args.concat([domain]), ",")
            }
            case "PolynomialRing": {
                return {
                    blocks: [
                        ...this.innerConvert(obj.domain, 0).blocks,
                        ...blockBd.argumentBlocks(obj.symbols.map(s => this.innerConvert(s, 0).blocks), ",", "[").blocks,
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

            case "SingularityFunction": {
                return {
                    blocks: [
                        ...blockBd.wrapBetweenBrackets(this.innerConvert(obj.symbols[0], level).blocks, "<").blocks,
                        blockBd.powerBlock(this.innerConvert(obj.symbols[1], level).blocks)
                    ]
                }
            }
            case "Conjugate": {
                return {
                    blocks: [blockBd.compositeBlock("\\overline", ["value"], [this.innerConvert(obj.symbols[0], level).blocks])],
                    prUnit: "conjugate"
                }
            }
            case "Order": {
                return this.order.convert(obj);
            }
            case "Mod": {
                return this.prCommon.opJoin(obj.symbols, () => blockBd.compositeBlock("\\bmod"), { wrapBracket: "if-op-exclude-mul-shortcut" })
            }
            case "Subs": {
                return this.subs.convert(obj);
            }
            case "Sum": {
                return this.sum.convert(obj);
            }
        }

        return { blocks: [] };
    }

    convertMaps(ss: Symbol[], level = 0): BlockModel[][] {
        return ss.map(s => this.innerConvert(s, level).blocks);
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

    private convertVarRawSymbol(obj: { name: string, bold?: boolean }): CResult {
        return { blocks: [blockBd.textBlock(obj.name, obj.bold ? { mathType: "\\mathbf" } : undefined)], }
    }


    private frac(numerator: BlockModel[], denominator: BlockModel[]): CResult {
        return {
            blocks: [
                blockBd.compositeBlock("\\frac", ["value", "sub1"], [
                    numerator,
                    denominator,
                ])],

        }
    }

    private buildFrac(args: P2Pr.Symbol[]): CResult {
        if (args.length != 2) {
            throw new Error("Unsupported frac with different than 2 arguments");
        }

        const enumerator = this.innerConvert(args[0], 0).blocks;
        const denominator = this.innerConvert(args[1], 0).blocks;

        const fracBlock = blockBd.compositeBlock("\\frac", ["value", "sub1"], [enumerator, denominator]);
        return { blocks: [fracBlock], }
    }

    // private joinBy(args: P2Pr.Symbol[], text: string): BlockModel[] {
    //     const items = args.map(a => this.innerConvert(a, 0));
    //     let blocks: BlockModel[] = [];
    //     for (let idx = 0; idx < items.length; idx++) {
    //         const item = items[idx];
    //         if (idx > 0) {
    //             blocks = blockBd.combineMultipleBlocks(blocks, [blockBd.textBlock(text)], item.blocks);
    //         } else {
    //             blocks = blockBd.combineMultipleBlocks(blocks, item.blocks);
    //         }
    //     }

    //     return blocks;
    // }

}



type Symbol = P2Pr.Symbol;
type CResult = Pr2M.CResult;
export namespace Pr2M {
    export interface CResult {
        blocks: BlockModel[];
        prUnit?: "bracket" | "op" | "not" | undefined | "pow" | "factorial" | "conjugate" | "func";
        prOp?: "mul" | "add";
        prBracket?: P2Pr.SupportBracket;
        prMinusSign?: boolean;
        prMul?: {
            allInShortcutForm?: boolean;
        }

        // wrapBrackets?: "[" | "(";
    }
}