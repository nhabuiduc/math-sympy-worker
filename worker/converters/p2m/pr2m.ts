import { _l } from "../../light-lodash";
import { prTh } from "./pr-transform/pr-transform-helper";
import type { P2Pr } from "./p2pr";
import { tabularKeyInfoHelper } from "@lib-shared/tabular-key-info-helper";
import { blockBd } from "./block-bd";
import { Derivative } from "./pr2m/derivative";
import { Integral } from "./pr2m/integral";
import { Mul } from "./pr2m/mul";
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
    private mul = new Mul(this);
    private add = new Add(this);
    private pow = new Pow(this);
    private order = new Order(this);
    private varList = new VarList(this);
    private subs = new Subs(this);
    private sum = new Sum(this);

    public prCommon: Pr2MCommon = new Pr2MCommon(this);
    public genericFunc: GenericFunc;

    constructor(constantTextFuncSet: Set<string>, private symbolLatexNames: { [key: string]: string }) {
        this.genericFunc = new GenericFunc(this, constantTextFuncSet, symbolLatexNames)
    }

    convert(obj: P2Pr.Symbol, level = 0): CResult {
        return this.innerConvert(obj, level);
    }

    private innerConvert(obj: P2Pr.Symbol, level: number): CResult {

        switch (obj.type) {
            case "BinaryOp": {
                const { op } = obj;
                if (op == "↦") {
                    return this.prCommon.opJoin(obj.symbols, op, (s) => {
                        return s.type == "BinaryOp" && s.op == "↦";
                    });
                }

                if (typeof op == "string") {
                    return this.prCommon.opJoin(obj.symbols, op, obj.wrapIfMulShorthand ? "wrapEvenShortHand" : undefined);
                }
                return this.prCommon.opJoin(obj.symbols, () => blockBd.compositeBlock(op.cp), obj.wrapIfMulShorthand ? "wrapEvenShortHand" : undefined);
            }
            case "UnaryOp": {
                const rsArg0 = this.innerConvert(obj.symbols[0], level);
                const expBlocks = prTh.considerPresentAsSingleUnitInOpCtx(obj.symbols[0], rsArg0, { wrapEvenShortHand: true }) ? rsArg0.blocks : blockBd.wrapBetweenBrackets(rsArg0.blocks).blocks
                if (obj.pos == "before") {
                    return { blocks: blockBd.joinBlocks([[blockBd.textBlock(obj.op)], expBlocks,]) }
                }
                return { blocks: blockBd.joinBlocks([expBlocks, [blockBd.textBlock(obj.op)]]) }
            }
            case "Add": {
                return this.add.convert(obj);
            }

            case "Var": {
                if (obj.nativeType == "NumberSymbol") {
                    if (obj.name == "∞̃") {
                        /**this look better */
                        return { blocks: [blockBd.compositeBlock("\\small-tilde", ["value"], [[blockBd.textBlock("∞")]])] }
                    }

                    const foundName = this.symbolLatexNames[obj.name]
                    if (foundName) {
                        obj.name = foundName;
                    }
                }
                if (obj.normalText) {
                    return { blocks: [blockBd.normalText(obj.name)] }
                }

                return { blocks: [blockBd.textBlock(obj.name, blockBd.style(obj))] }
            }
            case "VarList": {
                return this.varList.convert(obj);
            }
            case "Mul": {
                return this.mul.convert(obj);
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

            case "Sqrt": {
                if (obj.symbols.length <= 1) {
                    return { blocks: [blockBd.compositeBlock("\\sqrt", ["value"], [this.innerConvert(obj.symbols[0], 0).blocks])] }
                }

                return { blocks: [blockBd.compositeBlock("\\sqrt", ["value", "sub1"], [this.innerConvert(obj.symbols[0], 0).blocks, this.innerConvert(obj.symbols[1], 0).blocks])] }
            }
            case "GenericFunc": {

                const { name, args } = this.genericFunc.buildGenericFunc(obj);
                return { blocks: name.concat(args) }
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

                return { blocks: [matrixBlock], prBracket: obj.bracket };
            }

            case "OverSymbol": {
                return { blocks: [blockBd.over(this.convert(obj.symbols[0]).blocks, obj.op, blockBd.style(obj)),] }
            }

            case "Derivative": {
                return this.derivative.convert(obj, level);
            }
            case "Integral": {
                return { blocks: this.integral.convert(obj) };
            }

            case "Binomial": {
                return {
                    blocks: [
                        blockBd.binomBlock(this.innerConvert(obj.symbols[0], 0).blocks, this.innerConvert(obj.symbols[1], 0).blocks)
                    ],
                    prBracket: "("
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

            case "Order": {
                return this.order.convert(obj);
            }

            case "Subs": {
                return this.subs.convert(obj);
            }
            case "Limit":
            case "Product":
            case "Sum": {
                return this.sum.convert(obj);
            }

            case "Piecewise": {
                const pairs: [BlockModel[], BlockModel[]][] = obj.symbols.map(({ symbols: ss }: P2Pr.VarList) => {
                    // const isCondTrue = ss[1].type == "BooleanTrue";
                    const isCondTrue = prTh.isBooleanTrue(ss[1]);
                    return [
                        this.convert(ss[0]).blocks,
                        blockBd.combineBlocks([
                            isCondTrue ? blockBd.normalText("otherwise") : blockBd.normalText("for"),
                            blockBd.textBlock(" "),
                            ...(isCondTrue ? [] : this.convert(ss[1]).blocks)
                        ])
                    ] as [BlockModel[], BlockModel[]]
                });

                return { blocks: [blockBd.matrixFromTexts(pairs, undefined, "\\cases")] }
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

    private buildFrac(args: P2Pr.Symbol[]): CResult {
        if (args.length != 2) {
            throw new Error("Unsupported frac with different than 2 arguments");
        }

        const enumerator = this.innerConvert(args[0], 0).blocks;
        const denominator = this.innerConvert(args[1], 0).blocks;

        const fracBlock = blockBd.compositeBlock("\\frac", ["value", "sub1"], [enumerator, denominator]);
        return { blocks: [fracBlock], }
    }
}



type Symbol = P2Pr.Symbol;
type CResult = Pr2M.CResult;
export namespace Pr2M {
    export interface CResult {
        blocks: BlockModel[];
        prBracket?: P2Pr.SupportBracket;
        prMul?: {
            allInShortcutForm?: boolean;
        }
        prPow?: {
            powMergedInFunc?: boolean;
        }
    }
}