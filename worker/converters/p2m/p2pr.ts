import { PrPowerTransform } from "./pr-transform/pr-power-transform";
import { PrFracTransform } from "./pr-transform/pr-frac-transform";
import { PrMulTransform } from "./pr-transform/pr-mul-transform";
import { PrSqrtTransform } from "./pr-transform/pr-sqrt-transform";
import { PrAddTransform } from "./pr-transform/pr-add-transform";
import { prTh } from "./pr-transform/pr-transform-helper";
import { float } from "./p2pr/float";
import { Symbol as SymbolP2Pr } from "./p2pr/symbol";
import { NameParser } from "./p2pr/name-parser";
import { GenericFunc } from "./p2pr/generic-func";
import { funcToConstant } from "./p2pr/func-to-constant";
import { bloackBoardBold } from "./p2pr/blackboard-bold";
import { _l } from "@sympy-worker/light-lodash";
import { Set as SetP2Pr } from "./p2pr/set";

export class P2Pr {

    private transforms: P2Pr.IPrTransform[] = [new PrPowerTransform(), new PrFracTransform(), new PrMulTransform(), new PrSqrtTransform(), new PrAddTransform()];
    private symbol: SymbolP2Pr;
    public nameParser: NameParser;
    private genericFunc: GenericFunc;
    private set: SetP2Pr;
    constructor(symbolLatexNames: { [key: string]: string }) {
        this.nameParser = new NameParser(symbolLatexNames);
        this.symbol = new SymbolP2Pr(this.nameParser);
        this.genericFunc = new GenericFunc(this);
        this.set = new SetP2Pr(this);
    }

    convert(obj: P.Basic, ops?: P2Pr.TransformOptions): Symbol {
        ops = Object.assign({}, { orderAdd: true, orderMul: true } as P2Pr.TransformOptions, ops)
        const rs = this.c(obj);
        return this.transforms.reduce((prev, cur) => cur.transform(prev, ops), rs);
    }

    c(obj: P.Basic): Symbol {
        switch (obj.func) {

            case "Piecewise":
            case "Limit":
            case "Product":
            case "Sum":
            case "Subs":
            case "Add":
            case "Order": {
                return { type: obj.func, kind: "Container", symbols: this.m(obj.args) }
            }

            case "Mod": {
                return prTh.bin(this.m(obj.args), { cp: "\\bmod" });
            }

            case "BaseDyadic": {
                return prTh.varList(this.m(obj.args), "|", "(");
            }

            case "NegativeOne": {
                return prTh.var("-1", { nativeType: obj.func });
            }
            case "BooleanTrue": {
                return prTh.var("True", { nativeType: obj.func });
            }
            case "BooleanFalse": {
                return prTh.var("False", { nativeType: obj.func });
            }
            case "NaN": {
                return prTh.var("NaN", { nativeType: obj.func });
            }
            case "One": {
                return prTh.var("1", { nativeType: obj.func });
            }
            case "CoordSys3D": {
                return prTh.genFunc(obj.func, this.m(obj.args));
            }
            case "Factorial": {
                return prTh.unary(this.c(obj.args[0]), "!");
            }
            case "Factorial2": {
                return prTh.unary(this.c(obj.args[0]), "!!");
            }
            case "SubFactorial": {
                return prTh.unary(this.c(obj.args[0]), "!", "before");
            }

            case "Cross": {
                return prTh.bin(this.m(obj.args), "×");
            }
            case "Curl": {
                return prTh.bin([prTh.var("∇") as Symbol].concat(this.m(obj.args)), "×");
            }
            case "Divergence": {
                return prTh.bin([prTh.var("∇") as Symbol].concat(this.m(obj.args)), "⋅");
            }
            case "Dot": {
                return prTh.bin(this.m(obj.args), "⋅");
            }
            case "Gradient": {
                return prTh.unary(this.c(obj.args[0]), "∇", "before")
            }
            case "Laplacian": {
                return prTh.unary(this.c(obj.args[0]), "▵", "before")
            }

            case "Union": {
                return prTh.bin(this.m(obj.args), "∪");
            }
            case "Intersection": {
                return prTh.bin(this.m(obj.args), "∩");
            }
            case "SymmetricDifference": {
                return prTh.bin(this.m(obj.args), "▵");
            }
            case "Complement": {
                return prTh.bin(this.m(obj.args), "⧵");
            }


            case "Integer": {
                return prTh.var(obj.value, { nativeType: obj.func })
                // return { type: "Integer", kind: "Leaf", value: obj.value };
            }
            case "Float": {
                return float.parse(obj.value);
            }
            case "Dummy":
            case "Symbol": {
                return this.symbol.parse(obj.name);
            }
            case "Mul": {
                const symbols = this.m(obj.args);
                return {
                    type: "Mul",
                    kind: "Container",
                    unevaluatedDetected: this.detectUnevaluatedMul(symbols),
                    symbols: symbols
                }
            }
            case "Pow": {
                return { type: "Pow", kind: "Container", symbols: this.m(obj.args) }
            }


            case "NegativeInfinity": {
                return prTh.mul(prTh.negativeOne(), prTh.numberSymbol("∞"))
            }

            case "Infinity":
            case "ComplexInfinity":
            case "Exp1":
            case "ImaginaryUnit":
            case "Pi":
            case "EulerGamma":
            case "Catalan":
            case "GoldenRatio":
            case "Zero":
            case "HBar":
            case "TribonacciConstant": {
                return funcToConstant.map(obj.func);
            }

            case "NumberSymbol": {
                return prTh.numberSymbol(obj.name);
                // return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: obj.name }
            }
            case "Zero": {
                return prTh.var("0", { nativeType: obj.func });
                // return { type: "Zero", kind: "Leaf" }
            }

            case "Half": {
                return prTh.frac(prTh.int(1), prTh.int(2));
            }
            case "Rational": {
                return prTh.frac(prTh.integerOrSpecial(obj.p), prTh.integerOrSpecial(obj.q));
            }
            case "Matrix": {
                return { type: "Matrix", kind: "Container", bracket: "[", row: obj.row, col: obj.col, symbols: this.m(obj.args) }
            }

            case "SpecialFuncClass":
            case "GenericFunc": {
                return this.genericFunc.convert(obj);
            }

            case "LambertW":
            case "Ynm":
            case "Znm": {
                return this.genericFunc.convertOf(obj);
            }

            case "Abs": {
                return prTh.brackets(this.m(obj.args), "|");
            }
            case "Str": {
                return prTh.str(obj.text)
            }

            case "IndexedBase": {
                return this.c(obj.args[0]);
            }
            case "Indexed": {
                return prTh.index(this.c(obj.args[0]), this.c(obj.args[1]))
            }

            case "BaseVector": {
                const vIdx = prTh.extractIntegerValue(this.c(obj.args[0]));
                const system = obj.args[1] as P.CoordSys3D;
                const vName = system.vectorNames[vIdx];
                const sName = (system.args[0] as P.Str).text;
                return {
                    type: "Index",
                    kind: "Container",
                    symbols: [
                        prTh.over("hat", vName, { bold: true }),
                        { type: "Var", kind: "Leaf", name: sName, bold: true }
                    ]
                }
            }

            case "BaseScalar": {
                const vIdx = prTh.extractIntegerValue(this.c(obj.args[0]));
                const system = obj.args[1] as P.CoordSys3D;
                const vName = system.variableNames[vIdx];
                const sName = (system.args[0] as P.Str).text;
                return {
                    type: "Index",
                    kind: "Container",
                    symbols: [
                        prTh.var(vName, { bold: true }),
                        { type: "Var", kind: "Leaf", name: sName, bold: true }
                    ]
                }
            }



            case "Tuple": {
                return prTh.varList(this.m(obj.args), ",", "(")
            }

            case "VectorAdd": {
                return { type: "Add", kind: "Container", symbols: this.m(obj.args) }
            }
            case "VectorMul": {
                return { type: "Mul", kind: "Container", unevaluatedDetected: true, symbols: this.m(obj.args) }
            }
            case "VectorZero": {
                return prTh.over("hat", "0", { bold: true });
            }
            case "Point": {
                return { type: "GenericFunc", kind: "Container", func: (obj.args[0] as P.Str).text, symbols: this.m(obj.args) }
                // return { type: "Point", kind: "Container", name: (obj.args[0] as P.Str).text, symbols: obj.args.map(c => this.innerConvert(c)) }
            }

            case "Poly": {
                const [d, ...ss] = this.m(obj.args);
                return prTh.varList([
                    ...ss,
                    prTh.varList([prTh.str("Domain="), d]),
                ], ",", "(")

                // return { type: "PolynomialRing", kind: "Container", symbols: this.m(obj.args), domain: this.c(obj.domain) }
            }
            case "PolynomialRing": {
                const [d, ...ss] = this.m(obj.args);
                return prTh.varList([
                    d,
                    prTh.varList(ss, ",", "[")
                ])
            }

            case "Derivative": {
                return { type: "Derivative", kind: "Container", partial: obj.partial, symbols: this.m(obj.args) }
            }

            // case "BooleanTrue": {
            //     return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "True" }
            // }
            // case "BooleanFalse": {
            //     return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "False" }
            // }

            case "Relational": {
                return { type: "Relational", kind: "Container", relOp: obj.relOp, symbols: this.m(obj.args) }
            }
            case "List": {
                return {
                    type: "VarList",
                    kind: "Container",
                    separator: obj.separator,
                    symbols: this.m(obj.args),
                    bracket: "[",
                }
            }

            // case "Poly": {
            //     return { type: "Poly", kind: "Container", symbols: this.m(obj.args), domain: this.c(obj.domain) }
            // }

            case "DisplayedDomain": {
                return prTh.var(obj.name, { bold: "blackboard" })
                // return { type: "DisplayedDomain", kind: "Leaf", name: obj.name }
            }

            case "Integral": {
                return { type: "Integral", kind: "Container", symbols: this.m(obj.args) }
            }

            case "UndefinedFunction": {
                return this.nameParser.parse(obj.name, (cn) => ({ type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), isUndefinedFunction: true }))
            }
            case "Not": {
                return prTh.unary(this.c(obj.args[0]), "¬", "before")
            }
            case "And": {
                return prTh.bin(this.m(obj.args), "∧")
            }
            case "Implies": {
                return prTh.bin(this.m(obj.args), "⇒")
            }
            case "Or": {
                return prTh.bin(this.m(obj.args), "∨")

            }
            case "SingularityFunction": {
                const ss = this.m(obj.args);
                return prTh.pow(prTh.varList([ss[0]], undefined, "<"), ss[1]);
            }
            case "Cycle": {
                if (obj.perm.length == 0) {
                    return { type: "VarList", kind: "Container", bracket: "(", separator: ";", symbols: [] }
                }

                const listss: P2Pr.VarList[] = obj.perm.map(c => {
                    const list: P2Pr.VarList = { type: "VarList", kind: "Container", bracket: "(", separator: ";", symbols: c.map(i => prTh.int(i)) };
                    return list;
                });

                if (listss.length == 1) {
                    return listss[0]
                }

                const vl: P2Pr.VarList = { type: "VarList", kind: "Container", symbols: listss };
                return vl;
            }



            case "FallingFactorial": {
                return prTh.index(prTh.brackets(this.c(obj.args[0])), this.c(obj.args[1]))
            }
            case "RisingFactorial": {
                return prTh.pow(this.c(obj.args[0]), prTh.brackets(this.c(obj.args[1])))
            }
            case "Set": {
                return prTh.varList(this.m(obj.args), ",", "{")
            }
            case "FiniteSet": {
                return prTh.varList(this.m(obj.args), ",", "{")
            }
            case "Interval": {
                if (prTh.basicEquals(obj.args[0], obj.args[1])) {
                    return prTh.varList([this.c(obj.args[0])], ",", "{")
                }

                return prTh.varList([
                    this.c(obj.args[0]),
                    this.c(obj.args[1]),
                ], ",", obj.args[2].func == "BooleanTrue" ? "(" : "[", obj.args[3].func == "BooleanTrue" ? "(" : "[")
            }
            case "Range": {
                return prTh.varList(
                    obj.args.map(c => {
                        if (c.func == "Symbol" && c.name == "dots") {
                            return prTh.raw("…");
                        }
                        return this.c(c)
                    }), ",", "{"
                )
            }
            case "SeqFormula": {
                if (obj.freeSymbol) {
                    return prTh.pow(
                        prTh.varList([this.c(obj.args[0])], ",", "{"),
                        this.c(obj.args[3]),
                        prTh.varList([this.c(obj.args[1]), prTh.raw("="), this.c(obj.args[2])])
                    )
                }

                return prTh.varList(
                    obj.args.map(c => {
                        if (c.func == "Symbol" && c.name == "dots") {
                            return prTh.raw("…");
                        }
                        return this.c(c)
                    }), ",", "["
                )
            }
            case "FourierSeries": {
                return prTh.varList([
                    this.c(obj.args[0]),
                    prTh.raw("+…")
                ])
            }
            case "AccumulationBounds": {
                return prTh.varList([
                    this.c(obj.args[0]),
                    this.c(obj.args[1]),
                ], ",", "<")
            }
            case "EmptySet": {
                return prTh.var("∅");
            }

            case "Operator": {
                return prTh.singleOrBrackets(this.m(obj.args));
            }
            case "Complexes":
            case "Rationals":
            case "Integers":
            case "Reals":
            case "UniversalSet":
            case "Naturals": {
                return bloackBoardBold.map(obj.func);
            }
            case "Naturals0": {
                return prTh.index(bloackBoardBold.map("Naturals"), prTh.var("0"))
            }
            case "ProductSet": {
                const ss = this.m(obj.args);
                if (!obj.hasVariety && ss.length >= 1) {
                    return prTh.pow(ss[0], prTh.int(ss.length));
                }
                return prTh.bin(ss, "×");
                // return this.prCommon.opJoin(obj.symbols, "×");
                // return { type: "ProductSet", kind: "Container", hasVariety: obj.hasVariety, symbols: this.m(obj.args) }
            }
            case "ComplexRegion":
            case "ConditionSet":
            case "ImageSet": {
                return this.set.convert(obj);
            }
            case "Contains": {
                const ss = this.m(obj.args);
                return prTh.varList([ss[0], prTh.var("∈"), ss[1]])
            }
            case "DiracDelta": {
                const ss = this.m(obj.args);
                if (ss.length == 1 || prTh.isZero(ss[1])) {
                    return prTh.genFunc("𝛿", [ss[0]], { powerIndexPos: "power-after" });
                } else {
                    return prTh.pow(
                        prTh.genFunc("𝛿", [ss[0]]),
                        prTh.brackets(ss[1]),
                    )
                }
            }
            case "Heaviside": {
                return prTh.genFunc("𝜃", this.m(obj.args), { powerIndexPos: "wrap-all" })
            }
            case "KroneckerDelta": {
                return prTh.index(prTh.var("𝛿"), prTh.varList(this.m(obj.args), obj.isArgsAtom ? undefined : ","), { noPowMerge: true })
            }
            case "LeviCivita": {
                return prTh.index(prTh.var("𝜀"), prTh.varList(this.m(obj.args), obj.isArgsAtom ? undefined : ","), { noPowMerge: true })
            }
            case "Exp": {
                return prTh.pow(prTh.var("e"), this.c(obj.args[0]))
            }

        }


        if (obj.args) {
            return this.nameParser.parse(obj.func, (cn) => ({ type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), noBracketIfArgEmpty: true }))
        }
        return { type: "Var", kind: "Leaf", name: "?" }
    }

    m(args: P.Basic[]): Symbol[] {
        return args.map(c => this.c(c));
    }

    private detectUnevaluatedMul(symbols: Symbol[]): boolean {
        return (symbols[0].type == "Var" && symbols[0].nativeType == "One") || symbols.some((c, idx) => idx > 0 && prTh.isConstant(c));
    }

    // static parseIntegerConstant(s: P.Basic): number {
    //     switch (s.func) {
    //         case "One": return 1;
    //         case "Zero": return 0;
    //         case "Integer": return s.value;
    //     }

    //     throw new Error("Unsupported symbol for parsing integer");
    // }
}

type Symbol = P2Pr.Symbol;

export namespace P2Pr {
    export interface Container {
        kind: "Container";
        symbols: Symbol[];
    }

    export interface Leaf {
        kind: "Leaf"
    }

    export type Symbol = Mul | C<"Add"> | Var | C<"Pow"> | Matrix | C<"Frac"> | C<"Sqrt"> | GenericFunc |

        Derivative | Relational | C<"Binomial"> |
        VarList | C<"Integral"> | Index | JsonData
        | C<"Order"> | C<"Prescript"> | C<"PrescriptIdx"> | Subs | C<"Sum"> |
        C<"Product"> | C<"Limit"> |
        C<"Piecewise"> | BinaryOp | UnaryOp | OverSymbol;



    export type Frac = C<"Frac">;
    // export type Tuple = C<"Tuple">;
    export type Integral = C<"Integral">;
    export type Add = C<"Add">;
    export type Sqrt = C<"Sqrt">;
    export type Pow = C<"Pow">;
    export type Prescript = C<"Prescript">;
    export type PrescriptIdx = C<"PrescriptIdx">;
    export type Subs = C<"Subs">;

    export interface OverSymbol extends Container {
        type: "OverSymbol";
        op: "hat" | "overline";
        bold?: boolean;
    }

    export interface Index extends C<"Index"> {
        noPowMerge?: boolean;
    }

    export interface BinaryOp extends Container {
        type: "BinaryOp";
        op: string | { cp: "\\bmod" };

    }
    export interface UnaryOp extends Container {
        type: "UnaryOp";
        op: string;
        pos: "before" | "after";
    }

    export interface VarList extends Container {
        type: "VarList";
        bracket?: SupportBracket;
        separator?: "," | ";" | "|" | ":";
        separatorSpacing?: "before" | "after" | "around";
        rightBracket?: SupportBracket;
    }

    // export interface VecExpr extends Container {
    //     type: "VecExpr";
    //     op: "Cross" | "Curl" | "Divergence" | "Dot" | "Gradient" | "Laplacian";
    // }

    // export interface Discrete extends Container {
    //     type: "Discrete";
    //     op: "Not" | "And" | "Or" | "Implies";
    // }


    export interface Mul extends Container {
        type: "Mul";
        unevaluatedDetected: boolean;
    }

    // export interface ConstantSymbol extends Leaf {
    //     type: "ConstantSymbol";
    //     showType: "symbol" | "text";
    //     name: string;
    // }

    // export interface Integer extends Leaf {
    //     type: "Integer";
    //     value: number;
    // }

    // export interface Float extends Leaf {
    //     type: "Float";
    //     value: string;
    // }

    export interface Var extends Leaf {
        type: "Var";
        name: string;
        bold?: boolean | "blackboard";
        normalText?: boolean;
        nativeType?: "One" | "NegativeOne" | "Zero" | "Integer" | "Float" | "NaN" | "BooleanTrue" | "BooleanFalse" | "NumberSymbol"
    }

    // export interface Raw extends Leaf {
    //     type: "Raw";
    //     name: string;
    //     bold?: boolean | "blackboard"
    // }

    export interface JsonData extends Leaf {
        type: "JsonData";
        data: string;
    }

    export interface Matrix extends Container {
        type: "Matrix"
        row: number;
        col: number;
        bracket?: "(" | "["

    }

    export interface GenericFunc extends Container {
        type: "GenericFunc"
        func: string;
        powerIndexPos?: "all-after" | "power-after" | "wrap-all";
        argSeparator?: "," | "|" | ";|";
        forceUsingOperatorName?: boolean;
        allowAncesstorPowerAtEnd?: boolean;
        isUndefinedFunction?: boolean;
    }

    // export interface Str extends Leaf {
    //     type: "Str";
    //     text: string;
    // }

    export interface Derivative extends Container {
        type: "Derivative";
        partial: boolean;
    }


    export interface Relational extends Container {
        type: "Relational";
        relOp: "==" | ">" | "<" | "<=" | ">=" | "!=";
    }

    // export interface Poly extends Container {
    //     type: "Poly";
    //     domain: Symbol;
    // }


    export interface IPrTransform {
        transform(symbol: Symbol, ops: P2Pr.TransformOptions): Symbol;
    }

    export type SupportBracket = P.SupportBracket;

    export interface C<T extends string> extends Container {
        type: T;
    }
    export interface L<T extends string> extends Leaf {
        type: T;
    }

    export interface TransformOptions {
        orderMul?: boolean;
        orderAdd?: boolean;
    }

    export type PGenericFunc = P.GenericFunc;
    export type PBasic = P.Basic;
    export type PF<T extends string> = P.F<T>;
    export type PU<T extends string> = P.U<T>;
}

namespace P {

    export type Basic = F<"Add"> | F<"Mul"> | F<"Pow"> | Symbol | Integer | Float | U<"NegativeOne"> |
        U<"One"> | Rational | Matrix | U<"Half"> | GenericFunc | U<"NaN"> | U<"Infinity"> | U<"NegativeInfinity"> | U<"ComplexInfinity"> |
        U<"Exp1"> | U<"ImaginaryUnit"> | U<"Pi"> | U<"EulerGamma"> | U<"Catalan"> | U<"GoldenRatio"> | U<"TribonacciConstant"> |
        NumberSymbol | U<"HBar"> | U<"Zero"> | CoordSys3D | Str | F<"BaseVector"> | F<"BaseScalar"> | F<"VectorAdd"> | U<"VectorZero"> | F<"VectorMul"> |
        F<"Point"> | F<"Tuple"> | F<"BaseDyadic"> | Derivative | U<"BooleanFalse"> | U<"BooleanTrue"> |
        Relational | List | Dummy | F<"Poly"> | F<"Abs"> | F<"Order"> | F<"Ynm"> | F<"Znm"> | F<"Indexed"> | F<"IndexedBase"> |
        F<"PolynomialRing"> | DisplayedDomain | UndefinedFunction | F<"Integral"> | F<"Not"> | F<"And"> | F<"Or"> | F<"Implies"> |
        F<"SingularityFunction"> | F<"FallingFactorial"> | F<"RisingFactorial"> | F<"LambertW"> | F<"Mod"> |
        Cycle | F<"Cross"> | F<"Curl"> | F<"Divergence"> | F<"Dot"> | F<"Gradient"> | F<"Laplacian"> | SpecialFuncClass |
        F<"Subs"> | F<"Set"> | F<"FiniteSet"> | F<"Interval"> | F<"Range"> | SeqFormula | F<"FourierSeries"> |
        F<"Sum"> | F<"AccumulationBounds"> | U<"EmptySet"> | U<"UniversalSet"> | F<"Operator"> | F<"Union"> |
        F<"Intersection"> | F<"SymmetricDifference"> | F<"Complement"> | U<"Reals"> | U<"Naturals"> | U<"Complexes"> |
        U<"Rationals"> | U<"Integers"> | U<"Naturals0"> | ProductSet | F<"ImageSet"> | F<"Lambda"> | F<"ConditionSet"> |
        F<"ComplexRegion"> | F<"Contains"> | F<"Product"> | F<"Limit"> | F<"DiracDelta"> | F<"Heaviside"> | KroneckerDelta |
        LeviCivita | F<"Piecewise"> | F<"Factorial"> | F<"Factorial2"> | F<"SubFactorial"> | F<"Exp"> |
        UnknownFunc;

    export interface KroneckerDelta extends F<"KroneckerDelta"> {
        isArgsAtom: boolean;
    }
    export interface LeviCivita extends F<"LeviCivita"> {
        isArgsAtom: boolean;
    }

    export interface ProductSet extends FuncArgs {
        func: "ProductSet";
        hasVariety: boolean;
    }

    export interface FuncArgs {
        args: Basic[];
    }

    export interface Symbol {
        func: "Symbol";
        name: string;
    }


    export interface Integer {
        func: "Integer";
        value: string;
    }

    export interface Float {
        func: "Float";
        value: string;
    }


    export interface Rational {
        func: "Rational";
        p: number;
        q: number;
    }

    export interface NumberSymbol {
        func: "NumberSymbol";
        name: string;
    }

    export interface Matrix extends FuncArgs {
        func: "Matrix"
        row: number;
        col: number;
    }

    export interface GenericFunc extends FuncArgs {
        func: "GenericFunc";
        name: string;
    }

    export interface Str {
        func: "Str";
        text: string;
    }

    export interface CoordSys3D extends FuncArgs {
        func: "CoordSys3D";
        variableNames: string[];
        vectorNames: string[];
    }


    export interface Dummy {
        func: "Dummy";
        name: string;
    }


    export interface Derivative extends FuncArgs {
        func: "Derivative";
        partial: boolean;
    }

    export interface DisplayedDomain extends FuncArgs {
        func: "DisplayedDomain";
        name: string;
    }

    export interface Relational extends FuncArgs {
        func: "Relational";
        relOp: "==" | ">" | "<" | "<=" | ">=" | "!="
    }
    export interface List extends FuncArgs {
        func: "List";
        separator: "," | ";",
    }

    // export interface Poly extends FuncArgs {
    //     func: "Poly";
    //     domain: Basic,
    // }

    export interface UndefinedFunction extends FuncArgs {
        func: "UndefinedFunction";
        name: string;
    }


    export interface Cycle {
        func: "Cycle";
        perm: number[][];
    }
    export interface SpecialFuncClass extends FuncArgs {
        func: "SpecialFuncClass";
        name: string;
    }
    export interface SeqFormula extends FuncArgs {
        func: "SeqFormula";
        freeSymbol: boolean;
    }

    export interface UnknownFunc extends FuncArgs {
        func: "";
    }

    export type SupportBracket = "(" | "[" | "<" | "floor" | "ceil" | "|" | "{";

    export interface F<T extends string> extends FuncArgs {
        func: T;
    }
    export interface U<T extends string> {
        func: T;
    }
}