import { PrPowerTransform } from "./pr-transform/pr-power-transform";
import { PrFracTransform } from "./pr-transform/pr-frac-transform";
import { PrMulTransform } from "./pr-transform/pr-mul-transform";
import { PrSqrtTransform } from "./pr-transform/pr-sqrt-transform";
import { PrAddTransform } from "./pr-transform/pr-add-transform";
import { prCreator } from "./pr/pr-creator";
import { prTh } from "./pr-transform/pr-transform-helper";
import { float } from "./p2pr/float";

export class P2Pr {

    private transforms: P2Pr.IPrTransform[] = [new PrPowerTransform(), new PrFracTransform(), new PrMulTransform(), new PrSqrtTransform(), new PrAddTransform()];

    convert(obj: P.Basic, _transformOps: {}): Symbol {
        const rs = this.innerConvert(obj);
        return this.transforms.reduce((prev, cur) => cur.transform(prev), rs);
    }

    private innerConvert(obj: P.Basic): Symbol {
        switch (obj.func) {
            case "Add": {
                return { type: "Add", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "Integer": {
                return { type: "Integer", kind: "Leaf", value: obj.value };
            }
            case "Float": {
                return float.parse(obj.value);
                // return { type: "Float", kind: "Leaf", value: obj.value };
            }
            case "Symbol": {
                return this.parseSymbol(obj);
            }
            case "Mul": {
                const symbols = obj.args.map(c => this.innerConvert(c));
                return {
                    type: "Mul",
                    kind: "Container",
                    unevaluatedDetected: this.detectUnevaluatedMul(symbols),
                    symbols: symbols
                }
            }
            case "Pow": {
                return { type: "Pow", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)), indexJson: undefined }
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
                return { type: "ConstantSymbol", kind: "Leaf", showType: "symbol", name: "𝑒" }
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
                return prCreator.frac(prCreator.integer(1), prCreator.integer(2));
            }
            case "Rational": {
                // return prCreator.frac(prCreator.integer(obj.p), prCreator.integer(obj.q));
                return prCreator.frac(prCreator.integerOrSpecial(obj.p), prCreator.integerOrSpecial(obj.q));
            }
            case "Matrix": {
                return { type: "Matrix", kind: "Container", row: obj.row, col: obj.col, symbols: obj.args.map(c => this.innerConvert(c)) }
            }

            case "GenericFunc": {
                if (obj.name == "exp") {
                    return { type: "Exp", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
                }
                if (obj.name == "binomial") {
                    return { type: "Binomial", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
                }
                if (obj.name == "NoneType") {
                    return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "None" }
                }
                return { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "Str": {
                return { type: "Str", kind: "Leaf", text: obj.text };
            }
            case "CoordSys3D": {
                return { type: "CoordSys3D", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) };
            }
            case "BaseVector": {
                const vIdx = P2Pr.parseIntegerConstant(obj.args[0]);
                const system = obj.args[1] as P.CoordSys3D;
                const vName = system.vectorNames[vIdx];
                const sName = (system.args[0] as P.Str).text;
                return { type: "BaseVector", kind: "Leaf", name: vName, systemName: sName }
            }

            case "BaseScalar": {
                const vIdx = P2Pr.parseIntegerConstant(obj.args[0]);
                const system = obj.args[1] as P.CoordSys3D;
                const vName = system.variableNames[vIdx];
                const sName = (system.args[0] as P.Str).text;
                return { type: "BaseScalar", kind: "Leaf", name: vName, systemName: sName }
            }
            case "VectorAdd": {
                return { type: "Add", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "VectorMul": {
                return { type: "Mul", kind: "Container", unevaluatedDetected: true, symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "VectorZero": {
                return { type: "VectorZero", kind: "Leaf" }
            }
            case "Point": {
                // return 
                return { type: "Point", kind: "Container", name: (obj.args[0] as P.Str).text, symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "Tuple": {
                return { type: "Tuple", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "BaseDyadic": {
                return { type: "BaseDyadic", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "Derivative": {
                return { type: "Derivative", kind: "Container", partial: obj.partial, symbols: obj.args.map(c => this.innerConvert(c)) }
            }

            case "BooleanTrue": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "True" }
            }
            case "BooleanFalse": {
                return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "False" }
            }

            case "Relational": {
                return { type: "Relational", kind: "Container", relOp: obj.relOp, symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "List": {
                return { type: "List", kind: "Container", separator: obj.separator, symbols: obj.args.map(c => this.innerConvert(c)) }
            }
            case "Dummy": {
                return { type: "Var", kind: "Leaf", name: obj.name }
            }
            case "Poly": {
                return { type: "Poly", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)), domain: this.innerConvert(obj.domain) }
            }
            case "PolynomialRing": {
                return { type: "PolynomialRing", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)), domain: this.innerConvert(obj.domain) }
            }
            case "DisplayedDomain": {
                return { type: "DisplayedDomain", kind: "Leaf", name: obj.name }
            }

            case "Integral": {
                return { type: "Integral", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
            }

            case "UndefinedFunction": {
                return { type: "UndefinedFunction", kind: "Leaf", name: obj.name };
            }
            case "Implies":
            case "Not":
            case "And":
            case "Or": {
                return {
                    type: "Discrete",
                    kind: "Container",
                    op: obj.func, symbols: obj.args.map(c => this.innerConvert(c)),
                }
            }
            case "SingularityFunction": {
                return { type: "SingularityFunction", kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) }
            }
        }

        if (obj.args) {
            return { type: "UnknownFunc", name: obj.func, kind: "Container", symbols: obj.args.map(c => this.innerConvert(c)) };
        }
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

    private parseSymbol(s: P.Symbol): P2Pr.Var {
        const splitIdx = s.name.indexOf("|");
        if (splitIdx < 0) {
            return { type: "Var", kind: "Leaf", name: s.name, indexJson: undefined };
        }

        return { type: "Var", kind: "Leaf", name: s.name.substr(0, splitIdx), indexJson: s.name.substr(splitIdx + 1) };
    }

    // transform(symbol: Symbol): Symbol {
    //     return this.transforms.reduce((prev, cur) => cur.transform(prev), symbol);
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

    export type Symbol = Mul | Add | One | NegativeOne | Integer | Var | Pow | Matrix | Frac | Float | Half | Sqrt | GenericFunc |
        NaN | ConstantSymbol | CoordSys3D | Str | BaseVector | BaseScalar | VectorZero | Point | Tuple | BaseDyadic |
        Derivative | Zero | Exp | Relational | List | Poly | PolynomialRing | DisplayedDomain | Binomial | UndefinedFunction |
        VarList | Integral | Discrete | SingularityFunction |
        UnknownFunc;

    export interface VarList extends Container {
        type: "VarList";
    }

    export interface Discrete extends Container {
        type: "Discrete";
        op: "Not" | "And" | "Or" | "Implies";
    }


    export interface Integral extends Container {
        type: "Integral";
    }

    export interface Mul extends Container {
        type: "Mul";
        unevaluatedDetected: boolean;
    }

    export interface Add extends Container {
        type: "Add";
    }

    export interface NegativeOne extends Leaf {
        type: "NegativeOne";
    }

    export interface One extends Leaf {
        type: "One";
    }
    export interface Zero extends Leaf {
        type: "Zero";
    }

    export interface Half extends Leaf {
        type: "Half";
    }
    export interface NaN extends Leaf {
        type: "NaN";
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
        value: string | Mul;
    }

    export interface Var extends Leaf {
        type: "Var";
        name: string;
        indexJson?: string;
        bold?: boolean;
    }

    export interface Pow extends Container {
        type: "Pow";
        indexJson: string;
    }

    export interface Frac extends Container {
        type: "Frac";
    }

    export interface Sqrt extends Container {
        type: "Sqrt";
    }

    export interface Matrix extends Container {
        type: "Matrix"
        row: number;
        col: number;
    }

    export interface GenericFunc extends Container {
        type: "GenericFunc"
        func: string; /** real function will be handled in sympy-models.ts */
        indexExist?: boolean;
    }

    export interface Str extends Leaf {
        type: "Str";
        text: string;
    }

    export interface CoordSys3D extends Container {
        type: "CoordSys3D",
    }

    export interface BaseVector extends Leaf {
        type: "BaseVector",
        name: string;
        systemName: string;
    }
    export interface BaseScalar extends Leaf {
        type: "BaseScalar",
        name: string;
        systemName: string;
    }

    export interface VectorZero extends Leaf {
        type: "VectorZero",
    }

    export interface Point extends Container {
        type: "Point";
        name: string;
    }

    export interface Tuple extends Container {
        type: "Tuple";
    }

    export interface Derivative extends Container {
        type: "Derivative";
        partial: boolean;
    }

    export interface DisplayedDomain extends Leaf {
        type: "DisplayedDomain";
        name: string;
    }

    export interface BaseDyadic extends Container {
        type: "BaseDyadic";
    }

    export interface Exp extends Container {
        type: "Exp";
    }

    export interface Binomial extends Container {
        type: "Binomial";
    }

    export interface Relational extends Container {
        type: "Relational";
        relOp: "==" | ">" | "<" | "<=" | ">=" | "!=";
    }

    export interface List extends Container {
        type: "List";
        separator: "," | ";",
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

    export interface UndefinedFunction extends Leaf {
        type: "UndefinedFunction";
        name: string;
    }




    export interface UnknownFunc extends Container {
        type: "UnknownFunc";
        name: string;
    }

    export interface IPrTransform {
        transform(symbol: Symbol): Symbol;
    }

    export type SupportBracket = P.SupportBracket;
}

namespace P {

    export type Basic = Add | Mul | Pow | Symbol | Integer | Float | NegativeOne |
        One | Rational | Matrix | Half | GenericFunc | NaN | Infinity | NegativeInfinity | ComplexInfinity |
        Exp1 | ImaginaryUnit | Pi | EulerGamma | Catalan | GoldenRatio | TribonacciConstant |
        NumberSymbol | HBar | Zero | CoordSys3D | Str | BaseVector | BaseScalar | VectorAdd | VectorZero | VectorMul |
        Point | Tuple | BaseDyadic | Derivative | BooleanFalse | BooleanTrue | Relational | List | Dummy | Poly |
        PolynomialRing | DisplayedDomain | UndefinedFunction | Integral | Not | And | Or | Implies | SingularityFunction |
        UnknownFunc;
    interface FuncArgs {
        args: Basic[];
    }

    export interface Add extends FuncArgs {
        func: "Add";
    }

    export interface Integral extends FuncArgs {
        func: "Integral";
    }

    export interface Mul extends FuncArgs {
        func: "Mul";
    }

    export interface Pow extends FuncArgs {
        func: "Pow";
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

    export interface NegativeOne {
        func: "NegativeOne";
    }
    export interface One {
        func: "One";
    }

    export interface Half {
        func: "Half";
    }

    export interface Rational {
        func: "Rational";
        p: number;
        q: number;
    }

    export interface NaN {
        func: "NaN";
    }
    export interface Infinity {
        func: "Infinity";
    }
    export interface NegativeInfinity {
        func: "NegativeInfinity";
    }
    export interface ComplexInfinity {
        func: "ComplexInfinity";
    }

    export interface Exp1 {
        func: "Exp1";
    }
    export interface ImaginaryUnit {
        func: "ImaginaryUnit";
    }
    export interface Pi {
        func: "Pi";
    }
    export interface EulerGamma {
        func: "EulerGamma";
    }
    export interface Catalan {
        func: "Catalan";
    }
    export interface GoldenRatio {
        func: "GoldenRatio";
    }
    export interface TribonacciConstant {
        func: "TribonacciConstant";
    }
    export interface Zero {
        func: "Zero";
    }
    export interface HBar {
        func: "HBar";
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

    export interface BaseVector extends FuncArgs {
        func: "BaseVector";
    }

    export interface BaseScalar extends FuncArgs {
        func: "BaseScalar";
    }

    export interface VectorAdd extends FuncArgs {
        func: "VectorAdd";
    }
    export interface VectorMul extends FuncArgs {
        func: "VectorMul";
    }
    export interface VectorZero {
        func: "VectorZero";
    }
    export interface BooleanTrue {
        func: "BooleanTrue";
    }
    export interface BooleanFalse {
        func: "BooleanFalse";
    }
    export interface Dummy {
        func: "Dummy";
        name: string;
    }

    export interface Point extends FuncArgs {
        func: "Point";
    }
    export interface Tuple extends FuncArgs {
        func: "Tuple";
    }
    export interface BaseDyadic extends FuncArgs {
        func: "BaseDyadic";
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
    export interface UndefinedFunction {
        func: "UndefinedFunction";
        name: string;
    }

    export interface Not extends FuncArgs {
        func: "Not";
    }
    export interface And extends FuncArgs {
        func: "And";
    }
    export interface Or extends FuncArgs {
        func: "Or";
    }
    export interface Implies extends FuncArgs {
        func: "Implies";
    }

    export interface SingularityFunction extends FuncArgs {
        func: "SingularityFunction";
    }

    export interface UnknownFunc extends FuncArgs {
        func: "";
    }

    export type SupportBracket = "(" | "[" | "<";

}