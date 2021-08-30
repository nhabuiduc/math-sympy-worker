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

export class P2Pr {

    private transforms: P2Pr.IPrTransform[] = [new PrPowerTransform(), new PrFracTransform(), new PrMulTransform(), new PrSqrtTransform(), new PrAddTransform()];
    private symbol: SymbolP2Pr;
    private nameParser: NameParser;
    private genericFunc: GenericFunc;
    constructor(symbolLatexNames: { [key: string]: string }) {
        this.nameParser = new NameParser(symbolLatexNames);
        this.symbol = new SymbolP2Pr(this.nameParser);
        this.genericFunc = new GenericFunc(this, this.nameParser);
    }

    convert(obj: P.Basic, ops?: P2Pr.TransformOptions): Symbol {
        ops = Object.assign({}, { orderAdd: true, orderMul: true } as P2Pr.TransformOptions, ops)
        const rs = this.c(obj);
        return this.transforms.reduce((prev, cur) => cur.transform(prev, ops), rs);
    }

    c(obj: P.Basic): Symbol {
        switch (obj.func) {

            case "Integer": {
                return { type: "Integer", kind: "Leaf", value: obj.value };
            }
            case "Float": {
                return float.parse(obj.value);
            }
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

            case "NegativeOne": {
                return { type: "NegativeOne", kind: "Leaf" }
            }
            case "One": {
                return { type: "One", kind: "Leaf" }
            }
            case "NaN": {
                return { type: "NaN", kind: "Leaf" }
            }
            case "Infinity": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "∞" }
            }
            case "NegativeInfinity": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "-∞" }
            }
            case "ComplexInfinity": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "∞̃" }
            }
            case "Exp1": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "e" }
            }
            case "ImaginaryUnit": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "i" }
            }
            case "Pi": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "𝜋" }
            }
            case "EulerGamma": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "𝛾" }
            }
            case "Catalan": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "Catalan" }
            }
            case "GoldenRatio": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "𝜙" }
            }
            case "Zero": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "0" }
            }
            case "HBar": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "ℏ" }
            }

            case "TribonacciConstant": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "TribonacciConstant" }
            }

            case "NumberSymbol": {

                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: obj.name }
            }
            case "Zero": {
                return { type: "Zero", kind: "Leaf" }
            }

            case "Half": {
                return prTh.frac(prTh.integer(1), prTh.integer(2));
            }
            case "Rational": {
                return prTh.frac(prTh.integerOrSpecial(obj.p), prTh.integerOrSpecial(obj.q));
            }
            case "Matrix": {
                return { type: "Matrix", kind: "Container", bracket: "[", row: obj.row, col: obj.col, symbols: this.m(obj.args) }
            }

            case "GenericFunc": {
                return this.genericFunc.convert(obj);
            }

            case "LambertW": {
                return this.secondIndexOfGenericFunc({ name: "W", args: obj.args, func: "GenericFunc" });
            }
            case "Ynm": {
                return this.indexPowerGenericFunc({ name: "Y", args: obj.args, func: "GenericFunc" });
            }
            case "Znm": {
                return this.indexPowerGenericFunc({ name: "Z", args: obj.args, func: "GenericFunc" });
            }
            case "Abs": {
                return prTh.brackets(this.m(obj.args), "|");
            }
            case "Str": {
                return { type: "Str", kind: "Leaf", text: obj.text };
            }


            case "IndexedBase": {
                return this.c(obj.args[0]);
            }
            case "Indexed": {
                return prTh.index(this.c(obj.args[0]), this.c(obj.args[1]))
            }

            case "BaseVector": {
                const vIdx = P2Pr.parseIntegerConstant(obj.args[0]);
                const system = obj.args[1] as P.CoordSys3D;
                const vName = system.vectorNames[vIdx];
                const sName = (system.args[0] as P.Str).text;
                return {
                    type: "Index",
                    kind: "Container",
                    symbols: [
                        { type: "BaseVector", kind: "Leaf", name: vName },
                        { type: "Var", kind: "Leaf", name: sName, bold: true }
                    ]
                }
            }

            case "BaseScalar": {
                const vIdx = P2Pr.parseIntegerConstant(obj.args[0]);
                const system = obj.args[1] as P.CoordSys3D;
                const vName = system.variableNames[vIdx];
                const sName = (system.args[0] as P.Str).text;
                return {
                    type: "Index",
                    kind: "Container",
                    symbols: [
                        { type: "BaseScalar", kind: "Leaf", name: vName },
                        { type: "Var", kind: "Leaf", name: sName, bold: true }
                    ]
                }
            }

            case "Sum":
            case "Subs":
            case "Add":
            case "Mod":
            case "Order":
            case "CoordSys3D":
            case "BaseDyadic": {
                return { type: obj.func, kind: "Container", symbols: this.m(obj.args) }
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
                return { type: "VectorZero", kind: "Leaf" }
            }
            case "Point": {
                return { type: "GenericFunc", kind: "Container", func: (obj.args[0] as P.Str).text, symbols: this.m(obj.args) }
                // return { type: "Point", kind: "Container", name: (obj.args[0] as P.Str).text, symbols: obj.args.map(c => this.innerConvert(c)) }
            }

            case "PolynomialRing": {
                return { type: "PolynomialRing", kind: "Container", symbols: this.m(obj.args), domain: this.c(obj.domain) }
            }

            case "Derivative": {
                return { type: "Derivative", kind: "Container", partial: obj.partial, symbols: this.m(obj.args) }
            }

            case "BooleanTrue": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "True" }
            }
            case "BooleanFalse": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "False" }
            }

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
            case "Dummy": {
                return { type: "Var", kind: "Leaf", name: obj.name }
            }
            case "Poly": {
                return { type: "Poly", kind: "Container", symbols: this.m(obj.args), domain: this.c(obj.domain) }
            }

            case "DisplayedDomain": {
                return { type: "DisplayedDomain", kind: "Leaf", name: obj.name }
            }

            case "Integral": {
                return { type: "Integral", kind: "Container", symbols: this.m(obj.args) }
            }

            case "UndefinedFunction": {
                return this.nameParser.parse(obj.name, (cn) => ({ type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), isUndefinedFunction: true }))
            }
            case "Implies":
            case "Not":
            case "And":
            case "Or": {
                return {
                    type: "Discrete",
                    kind: "Container",
                    op: obj.func, symbols: this.m(obj.args),
                }
            }
            case "SingularityFunction": {
                return { type: "SingularityFunction", kind: "Container", symbols: this.m(obj.args) }
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

            case "Divergence":
            case "Dot":
            case "Gradient":
            case "Laplacian":
            case "Curl":
            case "Cross": {
                return { type: "VecExpr", op: obj.func, kind: "Container", symbols: this.m(obj.args) }
            }
            case "SpecialFuncClass": {
                return { type: "GenericFunc", func: obj.name, specialFuncClass: true, kind: "Container", symbols: this.m(obj.args) }
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

        }


        if (obj.args) {
            return this.nameParser.parse(obj.func, (cn) => ({ type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), noBracketIfArgEmpty: true }))
        }
        return { type: "Var", kind: "Leaf", name: "?" }
    }


    private secondIndexOfGenericFunc(obj: P.GenericFunc, options?: Partial<P2Pr.GenericFunc>): P2Pr.Symbol {
        if (obj.args[1]) {
            return {
                type: "Index",
                kind: "Container",
                symbols: [
                    { type: "GenericFunc", kind: "Container", func: obj.name, symbols: [this.c(obj.args[0])], ...options },
                    this.c(obj.args[1])
                ]
            }
        }

        return { type: "GenericFunc", kind: "Container", func: obj.name, symbols: [this.c(obj.args[0])], ...options }
    }

    private indexPowerGenericFunc(obj: P.GenericFunc, options?: Partial<P2Pr.GenericFunc>): P2Pr.Pow {
        if (obj.args.length < 2) {
            throw new Error("not enough params");
        }

        return {
            type: "Pow",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(2).map(c => this.c(c)), ...options },
                this.c(obj.args[1]),
                this.c(obj.args[0]),
            ]
        }
    }


    m(args: P.Basic[]): Symbol[] {
        return args.map(c => this.c(c));
    }

    private detectUnevaluatedMul(symbols: Symbol[]): boolean {
        return symbols[0].type == "One" || symbols.some((c, idx) => idx > 0 && prTh.isConstant(c));
    }

    static parseIntegerConstant(s: P.Basic): number {
        switch (s.func) {
            case "One": return 1;
            case "Zero": return 0;
            case "Integer": return s.value;
        }

        throw new Error("Unsupported symbol for parsing integer");
    }
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

    export type Symbol = Mul | C<"Add"> | L<"One"> | L<"NegativeOne"> | Integer | Var | C<"Pow"> | Matrix | C<"Frac"> | Float | L<"Half"> | C<"Sqrt"> | GenericFunc |
        L<"NaN"> | ConstantSymbol | C<"CoordSys3D"> | Str | BaseVector | BaseScalar | L<"VectorZero"> | C<"BaseDyadic"> |
        Derivative | L<"Zero"> | C<"Exp"> | Relational | Poly | PolynomialRing | DisplayedDomain | C<"Binomial"> | C<"Mod"> |
        VarList | C<"Integral"> | Discrete | SingularityFunction | VecExpr | C<"Index"> | JsonData | C<"Factorial"> | C<"SubFactorial"> |
        C<"Factorial2"> | C<"Conjugate"> | C<"Order"> | C<"Prescript"> | C<"PrescriptIdx"> | Subs | Raw | C<"Sum">;



    export type Frac = C<"Frac">;
    // export type Tuple = C<"Tuple">;
    export type Integral = C<"Integral">;
    export type Add = C<"Add">;
    export type Sqrt = C<"Sqrt">;
    export type NegativeOne = L<"NegativeOne">;
    export type Index = C<"Index">;
    export type Pow = C<"Pow">;
    export type Prescript = C<"Prescript">;
    export type PrescriptIdx = C<"PrescriptIdx">;
    export type Subs = C<"Subs">;

    export interface VarList extends Container {
        type: "VarList";
        bracket?: SupportBracket;
        separator?: "," | ";" | "|";
        rightBracket?: SupportBracket;
    }

    export interface VecExpr extends Container {
        type: "VecExpr";
        op: "Cross" | "Curl" | "Divergence" | "Dot" | "Gradient" | "Laplacian";
    }

    export interface Discrete extends Container {
        type: "Discrete";
        op: "Not" | "And" | "Or" | "Implies";
    }


    export interface Mul extends Container {
        type: "Mul";
        unevaluatedDetected: boolean;
    }

    export interface ConstantSymbol extends Leaf {
        type: "ConstantSymbol";
        showType: "symbol" | "text";
        name: string;
    }

    export interface Integer extends Leaf {
        type: "Integer";
        value: number;
    }

    export interface Float extends Leaf {
        type: "Float";
        value: string;
    }

    export interface Var extends Leaf {
        type: "Var";
        name: string;
        bold?: boolean;
    }
    export interface Raw extends Leaf {
        type: "Raw";
        name: string;
        bold?: boolean;
    }

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
        specialFuncClass?: boolean;
        powerIndexPos?: "all-after" | "power-after" | "wrap-all";
        argSeparator?: "," | "|" | ";|";
        forceUsingOperatorName?: boolean;
        allowAncesstorPowerAtEnd?: boolean;
        isUndefinedFunction?: boolean;
    }

    export interface Str extends Leaf {
        type: "Str";
        text: string;
    }


    export interface BaseVector extends Leaf {
        type: "BaseVector",
        name: string;
    }
    export interface BaseScalar extends Leaf {
        type: "BaseScalar",
        name: string;
    }

    export interface Derivative extends Container {
        type: "Derivative";
        partial: boolean;
    }

    export interface DisplayedDomain extends Leaf {
        type: "DisplayedDomain";
        name: string;
    }



    export interface Relational extends Container {
        type: "Relational";
        relOp: "==" | ">" | "<" | "<=" | ">=" | "!=";
    }

    export interface Poly extends Container {
        type: "Poly";
        domain: Symbol;
    }

    export interface PolynomialRing extends Container {
        type: "PolynomialRing";
        domain: Symbol;
    }

    export interface SingularityFunction extends Container {
        type: "SingularityFunction";
    }


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
}

namespace P {

    export type Basic = F<"Add"> | F<"Mul"> | F<"Pow"> | Symbol | Integer | Float | U<"NegativeOne"> |
        U<"One"> | Rational | Matrix | U<"Half"> | GenericFunc | U<"NaN"> | U<"Infinity"> | U<"NegativeInfinity"> | U<"ComplexInfinity"> |
        U<"Exp1"> | U<"ImaginaryUnit"> | U<"Pi"> | U<"EulerGamma"> | U<"Catalan"> | U<"GoldenRatio"> | U<"TribonacciConstant"> |
        NumberSymbol | U<"HBar"> | U<"Zero"> | CoordSys3D | Str | F<"BaseVector"> | F<"BaseScalar"> | F<"VectorAdd"> | U<"VectorZero"> | F<"VectorMul"> |
        F<"Point"> | F<"Tuple"> | F<"BaseDyadic"> | Derivative | U<"BooleanFalse"> | U<"BooleanTrue"> |
        Relational | List | Dummy | Poly | F<"Abs"> | F<"Order"> | F<"Ynm"> | F<"Znm"> | F<"Indexed"> | F<"IndexedBase"> |
        PolynomialRing | DisplayedDomain | UndefinedFunction | F<"Integral"> | F<"Not"> | F<"And"> | F<"Or"> | F<"Implies"> |
        F<"SingularityFunction"> | F<"FallingFactorial"> | F<"RisingFactorial"> | F<"LambertW"> | F<"Mod"> |
        Cycle | F<"Cross"> | F<"Curl"> | F<"Divergence"> | F<"Dot"> | F<"Gradient"> | F<"Laplacian"> | SpecialFuncClass |
        F<"Subs"> | F<"Set"> | F<"FiniteSet"> | F<"Interval"> | F<"Range"> | SeqFormula | F<"FourierSeries"> |
        F<"Sum"> |
        UnknownFunc;

    export interface FuncArgs {
        args: Basic[];
    }

    export interface Symbol {
        func: "Symbol";
        name: string;
    }


    export interface Integer {
        func: "Integer";
        value: number;
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

    export interface Poly extends FuncArgs {
        func: "Poly";
        domain: Basic,
    }
    export interface PolynomialRing extends FuncArgs {
        func: "PolynomialRing";
        domain: Basic,
    }
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