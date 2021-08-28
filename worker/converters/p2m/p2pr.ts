import { PrPowerTransform } from "./pr-transform/pr-power-transform";
import { PrFracTransform } from "./pr-transform/pr-frac-transform";
import { PrMulTransform } from "./pr-transform/pr-mul-transform";
import { PrSqrtTransform } from "./pr-transform/pr-sqrt-transform";
import { PrAddTransform } from "./pr-transform/pr-add-transform";
import { prTh } from "./pr-transform/pr-transform-helper";
import { float } from "./p2pr/float";
import { Symbol as SymbolP2Pr } from "./p2pr/symbol";
import { NameParser } from "./p2pr/name-parser";

export class P2Pr {

    private transforms: P2Pr.IPrTransform[] = [new PrPowerTransform(), new PrFracTransform(), new PrMulTransform(), new PrSqrtTransform(), new PrAddTransform()];
    private symbol: SymbolP2Pr;
    private nameParser: NameParser;
    constructor(symbolLatexNames: { [key: string]: string }) {
        this.nameParser = new NameParser(symbolLatexNames);
        this.symbol = new SymbolP2Pr(this.nameParser);
    }

    convert(obj: P.Basic, ops?: P2Pr.TransformOptions): Symbol {
        ops = Object.assign({}, { orderAdd: true, orderMul: true } as P2Pr.TransformOptions, ops)
        const rs = this.c(obj);
        return this.transforms.reduce((prev, cur) => cur.transform(prev, ops), rs);
    }

    private c(obj: P.Basic): Symbol {
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
                if (obj.name == "meijerg") {
                    return prTh.varList([prTh.pow(
                        prTh.var("C"),
                        prTh.varList(this.m(obj.args.slice(2, 4)), ","),
                        prTh.varList(this.m(obj.args.slice(0, 2)), ","),
                    ), prTh.varList([
                        prTh.matrix([
                            this.m(obj.args.slice(4, 6)).map(c => prTh.removeVarListBracket(c)),
                            this.m(obj.args.slice(6, 8)).map(c => prTh.removeVarListBracket(c)),
                        ]),
                        this.c(obj.args[8]),
                    ], "|", "(")])
                }
                if (obj.name == "hyper") {
                    return prTh.varList([prTh.prescriptIdx(this.c(obj.args[0])),
                    prTh.index(prTh.var("F"), this.c(obj.args[1])), , prTh.varList([
                        prTh.matrix([
                            this.m(obj.args.slice(2, 3)).map(c => prTh.removeVarListBracket(c)),
                            this.m(obj.args.slice(3, 4)).map(c => prTh.removeVarListBracket(c)),
                        ]),
                        this.c(obj.args[4]),
                    ], "|", "(")])
                }

                if (obj.name == "exp") {
                    return { type: "Exp", kind: "Container", symbols: this.m(obj.args) }
                }
                if (obj.name == "binomial") {
                    return { type: "Binomial", kind: "Container", symbols: this.m(obj.args) }
                }
                if (obj.name == "NoneType") {
                    return { type: "ConstantSymbol", kind: "Leaf", showType: "text", name: "None" }
                }
                if (obj.name == "factorial") {
                    return { type: "Factorial", kind: "Container", symbols: this.m(obj.args) }
                }
                if (obj.name == "subfactorial") {
                    return { type: "SubFactorial", kind: "Container", symbols: this.m(obj.args) }
                }
                if (obj.name == "factorial2") {
                    return { type: "Factorial2", kind: "Container", symbols: this.m(obj.args) }
                }
                if (obj.name == "floor") {
                    return prTh.brackets(this.m(obj.args), "floor");
                }
                if (obj.name == "ceiling") {
                    return prTh.brackets(this.m(obj.args), "ceil");
                }

                if (obj.name == "min" || obj.name == "max") {
                    return { type: "GenericFunc", kind: "Container", func: obj.name, powerIndexPos: "all-after", symbols: this.m(obj.args) }
                }
                if (obj.name == "conjugate") {
                    return { type: "Conjugate", kind: "Container", symbols: this.m(obj.args) };
                }


                if (obj.name == "polylog") {
                    obj.name = "Li";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "besselj") {
                    obj.name = "J";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "bessely") {
                    obj.name = "Y";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "besseli") {
                    obj.name = "I";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "besselk") {
                    obj.name = "K";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "hankel1") {
                    obj.name = "H";
                    return this.firstIndexOfGenericFuncWithPow(obj, "(1)");
                }
                if (obj.name == "hankel2") {
                    obj.name = "H";
                    return this.firstIndexOfGenericFuncWithPow(obj, "(2)");
                }

                if (obj.name == "jn") {
                    obj.name = "j";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "yn") {
                    obj.name = "y";
                    return this.firstIndexOfGenericFunc(obj);
                }

                if (obj.name == "hn1") {
                    obj.name = "h";
                    return this.firstIndexOfGenericFuncWithPow(obj, "(1)");
                }
                if (obj.name == "hn2") {
                    obj.name = "h";
                    return this.firstIndexOfGenericFuncWithPow(obj, "(2)");
                }

                if (obj.name == "fresnels") {
                    obj.name = "S";
                }
                if (obj.name == "fresnelc") {
                    obj.name = "C";
                }


                if (obj.name == "stieltjes") {
                    obj.name = "𝛾";
                    return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "power-after" });
                }
                if (obj.name == "expint") {
                    obj.name = "E";
                    return this.firstIndexOfGenericFunc(obj);
                }
                if (obj.name == "chebyshevt") {
                    obj.name = "T";
                    return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
                }
                if (obj.name == "chebyshevu") {
                    obj.name = "U";
                    return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
                }
                if (obj.name == "legendre") {
                    obj.name = "P";
                    return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
                }
                if (obj.name == "laguerre") {
                    obj.name = "L";
                    return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
                }
                if (obj.name == "hermite") {
                    obj.name = "H";
                    return this.firstIndexOfGenericFunc(obj, { powerIndexPos: "wrap-all" });
                }

                const genOps: Partial<P2Pr.GenericFunc> = {};
                // let argSeparator: P2Pr.GenericFunc["argSeparator"] = ",";
                if (obj.name == "elliptic_k") {
                    obj.name = "K";
                }
                if (obj.name == "elliptic_f") {
                    obj.name = "F";
                    genOps.argSeparator = "|";
                }
                if (obj.name == "elliptic_e") {
                    obj.name = "E";
                    genOps.argSeparator = "|";
                }
                if (obj.name == "elliptic_pi") {
                    obj.name = "𝛱";
                    genOps.argSeparator = obj.args.length <= 2 ? "|" : ";|";
                }
                if (obj.name == "primenu") {
                    obj.name = "𝜈";
                    genOps.powerIndexPos = "wrap-all";
                }
                if (obj.name == "primeomega") {
                    obj.name = "𝛺";
                    genOps.powerIndexPos = "wrap-all";
                }

                if (obj.name == "uppergamma") {
                    obj.name = "𝛤";
                }
                if (obj.name == "dirichlet_eta") {
                    obj.name = "𝜂";
                }
                if (obj.name == "lerchphi") {
                    obj.name = "𝛷";
                }
                if (obj.name == "totient") {
                    obj.name = "𝜙";
                    genOps.powerIndexPos = "wrap-all";
                }
                if (obj.name == "reduced_totient") {
                    obj.name = "𝜆";
                    genOps.powerIndexPos = "wrap-all";
                }

                if (obj.name == "jacobi") {
                    obj.name = "P";
                    return this.indexPowerBracketGenericFunc(obj, 2, { allowAncesstorPowerAtEnd: true });
                }
                if (obj.name == "gegenbauer") {
                    obj.name = "C";
                    return this.indexPowerBracketGenericFunc(obj, 1, { allowAncesstorPowerAtEnd: true });
                }
                if (obj.name == "assoc_legendre") {
                    obj.name = "P";
                    return this.indexPowerBracketGenericFunc(obj, 1);
                }
                if (obj.name == "assoc_laguerre") {
                    obj.name = "L";
                    return this.indexPowerBracketGenericFunc(obj, 1);
                }

                if (obj.name == "divisor_sigma") {
                    obj.name = "𝜎";

                    if (obj.args.length == 2) {
                        return this.secondArgAsIndexOfGenericFunc(obj);
                    }
                }

                if (obj.name == "udivisor_sigma") {
                    obj.name = "𝜎";
                    if (obj.args.length == 1) {
                        return prTh.pow(prTh.genFunc(obj.name, this.m(obj.args), { allowAncesstorPowerAtEnd: false }), prTh.var("*"));
                    }

                    if (obj.args.length == 2) {
                        return prTh.pow(prTh.genFunc(obj.name, [this.c(obj.args[0])], { allowAncesstorPowerAtEnd: false }), prTh.var("*"), this.c(obj.args[1]));
                    }

                }

                let ignoreParseName = false;
                if (obj.name == "polar_lift") {
                    ignoreParseName = true;
                }



                if (ignoreParseName) {
                    return { type: "GenericFunc", kind: "Container", func: obj.name, symbols: this.m(obj.args), ...genOps }
                }

                return this.nameParser.parse(obj.name, (cn) => {
                    return { type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), ...genOps }
                })

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

        }


        if (obj.args) {
            return this.nameParser.parse(obj.func, (cn) => ({ type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), noBracketIfArgEmpty: true }))
        }
        return { type: "Var", kind: "Leaf", name: "?" }
    }

    private secondArgAsIndexOfGenericFunc(obj: P.GenericFunc, options?: Partial<P2Pr.GenericFunc>): P2Pr.Index {
        if (obj.args.length != 2) {
            throw new Error("args length must be 2")
        }
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: [this.c(obj.args[0])], ...options },
                this.c(obj.args[1])
            ]
        }
    }

    private firstIndexOfGenericFuncWithPow(obj: P.GenericFunc, powText: string, options?: Partial<P2Pr.GenericFunc>): P2Pr.Pow {
        return {
            type: "Pow",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(1).map(c => this.c(c)), ...options },
                prTh.var(powText),
                this.c(obj.args[0])
            ]
        }
    }

    private firstIndexOfGenericFunc(obj: P.GenericFunc, options?: Partial<P2Pr.GenericFunc>): P2Pr.Index {
        return {
            type: "Index",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(1).map(c => this.c(c)), ...options },
                this.c(obj.args[0])
            ]
        }
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

    private indexPowerBracketGenericFunc(obj: P.GenericFunc, powConsumeCount: number, options?: Partial<P2Pr.GenericFunc>): P2Pr.Pow {
        if (obj.args.length < powConsumeCount + 1) {
            throw new Error("not enough params");
        }

        return {
            type: "Pow",
            kind: "Container",
            symbols: [
                { type: "GenericFunc", kind: "Container", func: obj.name, symbols: obj.args.slice(powConsumeCount + 1).map(c => this.c(c)), ...options },
                prTh.brackets(this.m(obj.args.slice(1, powConsumeCount + 1))),
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
        C<"Factorial2"> | C<"Conjugate"> | C<"Order"> | C<"Prescript"> | C<"PrescriptIdx">;


    export type Frac = C<"Frac">;
    export type Tuple = C<"Tuple">;
    export type Integral = C<"Integral">;
    export type Add = C<"Add">;
    export type Sqrt = C<"Sqrt">;
    export type NegativeOne = L<"NegativeOne">;
    export type Index = C<"Index">;
    export type Pow = C<"Pow">;
    export type Prescript = C<"Prescript">;
    export type PrescriptIdx = C<"PrescriptIdx">;

    export interface VarList extends Container {
        type: "VarList";
        bracket?: SupportBracket;
        separator?: "," | ";" | "|";
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

    // export interface Point extends Container {
    //     type: "Point";
    //     name: string;
    // }

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

    // export interface List extends Container {
    //     type: "List";
    //     separator: "," | ";",
    //     bracket: SupportBracket;
    // }

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

    export interface UnknownFunc extends FuncArgs {
        func: "";
    }

    export type SupportBracket = "(" | "[" | "<" | "floor" | "ceil" | "|";

    export interface F<T extends string> extends FuncArgs {
        func: T;
    }
    export interface U<T extends string> {
        func: T;
    }
}