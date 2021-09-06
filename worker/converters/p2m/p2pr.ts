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
import { NDimArray } from "./p2pr/dim-array";
import { PolyElement } from "./p2pr/poly-element";
import { Quantity } from "./p2pr/quantity";
import { Tensor } from "./p2pr/tensor";
import { PrSymbolVisuallyInfo } from "./pr-transform/pr-symbol-visually-info";

export class P2Pr {
    constructor(private symbolLatexNames: { [key: string]: string },) { }
    convert(obj: P.Basic, ops?: P2Pr.TransformOptions): Symbol {
        return new Main(this.symbolLatexNames, ops).convert(obj);
    }
}

class Main {

    private transforms: P2Pr.IPrTransform[] = [new PrPowerTransform(), new PrFracTransform(), new PrMulTransform(), new PrSqrtTransform(), new PrAddTransform()];
    private symbol: SymbolP2Pr;
    public nameParser: NameParser;
    private genericFunc: GenericFunc;
    private set: SetP2Pr;
    private nDimArray = new NDimArray(this);
    private polyElement = new PolyElement(this);
    private quantity = new Quantity(this);
    private tensor = new Tensor(this);

    constructor(private symbolLatexNames: { [key: string]: string }, private ops: P2Pr.TransformOptions) {
        this.nameParser = new NameParser(symbolLatexNames);
        this.symbol = new SymbolP2Pr(this.nameParser);
        this.genericFunc = new GenericFunc(this);
        this.set = new SetP2Pr(this);
    }

    convert(obj: P.Basic): Symbol {
        const rs = this.c(obj);
        return this.transforms.reduce((prev, cur) => cur.transform(prev, this.ops), rs);
    }

    c(obj: P.Basic): Symbol {
        switch (obj.func) {

            case "Frac":
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
                return prTh.bin(this.m(obj.args), "mod");
            }

            case "BaseDyadic": {
                return prTh.varList(this.m(obj.args), "|", "(");
            }

            case "NegativeOne": {
                return prTh.var("-1", { nativeType: obj.func });
            }
            case "BooleanTrue": {
                return prTh.var("True", { nativeType: obj.func, normalText: true });
            }
            case "BooleanFalse": {
                return prTh.var("False", { nativeType: obj.func, normalText: true });
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
                return prTh.unary(this.c(obj.args[0]), "!", "after");
            }
            case "Factorial2": {
                return prTh.unary(this.c(obj.args[0]), "!!", "after");
            }
            case "SubFactorial": {
                return prTh.unary(this.c(obj.args[0]), "!", "before");
            }

            case "Cross": {
                return prTh.bin(this.m(obj.args), "×", { wrapIfMulShorthand: true });
            }
            case "Curl": {
                return prTh.bin([prTh.var("∇") as Symbol].concat(this.m(obj.args)), "×", { wrapIfMulShorthand: true });
            }
            case "Divergence": {
                return prTh.bin([prTh.var("∇") as Symbol].concat(this.m(obj.args)), "⋅", { wrapIfMulShorthand: true });
            }
            case "Dot": {
                return prTh.bin(this.m(obj.args), "⋅", { wrapIfMulShorthand: true });
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
            }
            case "Float": {
                return float.parse(obj.value);
            }
            case "Dummy":
            case "Symbol": {
                return this.symbol.parse(obj.name, obj.bold);
            }
            case "Mul": {
                const symbols = this.m(obj.args);
                return {
                    type: "Mul",
                    kind: "Container",
                    symbols: symbols
                }
            }
            case "Pow": {
                return { type: "Pow", kind: "Container", symbols: this.m(obj.args) }
            }


            case "NegativeInfinity": {
                return prTh.mulOf(prTh.negativeOne(), prTh.numberSymbol("∞"))
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
                return funcToConstant.map(obj.func, this.ops);
            }

            case "NumberSymbol": {
                return prTh.numberSymbol(obj.name);
            }
            case "Zero": {
                return prTh.var("0", { nativeType: obj.func });
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
                return prTh.var(obj.text)
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
                        prTh.over("small-hat", vName, { bold: true }),
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
                return prTh.varList(this.m(obj.args), this.getListSeparator(), "(")
            }

            case "VectorAdd": {
                return { type: "Add", kind: "Container", symbols: this.m(obj.args) }
            }
            case "VectorMul": {
                return { type: "Mul", kind: "Container", symbols: this.m(obj.args) }
            }
            case "VectorZero": {
                return prTh.over("small-hat", "0", { bold: true });
            }
            case "Point": {
                return { type: "GenericFunc", kind: "Container", func: (obj.args[0] as P.Str).text, symbols: this.m(obj.args) }
            }

            case "Poly": {
                const [d, ...ss] = this.m(obj.args);
                return prTh.genFunc("Poly", [...ss, prTh.varList([prTh.var("domain=", { normalText: true }), d])], { forceUsingOperatorName: true })
            }


            case "Derivative": {
                return { type: "Derivative", kind: "Container", partial: obj.partial, symbols: this.m(obj.args) }
            }

            case "Relational": {
                return prTh.rel(obj.relOp, this.m(obj.args));
            }
            case "List": {
                return prTh.varList(this.m(obj.args), this.getListSeparator(), "[");

            }

            case "DisplayedDomain": {
                return prTh.var(obj.name, { bold: "blackboard" })
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
                return prTh.pow(prTh.varList([ss[0]], { bracket: "<" }), ss[1]);
            }
            case "Cycle": {
                if (obj.perm.length == 0) {
                    return { type: "VarList", kind: "Container", bracket: "(", separator: " ", symbols: [] }
                }

                const listss: P2Pr.VarList[] = obj.perm.map(c => {
                    const list: P2Pr.VarList = { type: "VarList", kind: "Container", bracket: "(", separator: " ", symbols: c.map(i => prTh.int(i)) };
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
                return prTh.varList(this.m(obj.args), this.getListSeparator(), "{")
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
            case "NDimArray": {
                return this.nDimArray.convert(obj);
            }
            case "Lambda": {
                const [first, second] = this.m(obj.args);
                return prTh.bin([
                    prTh.singleOrBrackets((first as P2Pr.VarList).symbols),
                    second], "↦"
                )
            }
            case "IdentityFunction": {
                return prTh.bin([
                    prTh.var("x"),
                    prTh.var("x")], "↦"
                )
            }

            case "PolyRing":
            case "PolynomialRing": {
                const [d, ss] = this.m(obj.args);
                return prTh.varList([
                    d,
                    prTh.varList((ss as P2Pr.VarList).symbols, ",", "[")
                ])
            }
            case "FractionField": {
                const [d, ss] = this.m(obj.args);
                return prTh.varList([
                    d,
                    prTh.varList((ss as P2Pr.VarList).symbols, ",", "(")
                ])
            }

            case "PythonRational":
            case "FracElement":
            case "PolyElement": {
                return this.polyElement.convert(obj);
            }
            case "ComplexRootOf": {
                return prTh.genFunc("CRootOf", this.m(obj.args));
            }
            case "NoneType": {
                return prTh.none();
            }
            case "MatrixSlice": {
                const [sname, from, to] = this.m(obj.args);
                return prTh.genFunc(sname, [
                    prTh.varList((from as P2Pr.VarList).symbols.map(s => prTh.isNone(s) ? prTh.empty() : s), ":"),
                    prTh.varList((to as P2Pr.VarList).symbols.map(s => prTh.isNone(s) ? prTh.empty() : s), ":")], { bracket: "[" })
            }
            case "RandomDomain": {
                const ss = this.m(obj.args);
                if (!obj.subType) {
                    return prTh.var("RandomDomain");
                }
                switch (obj.subType) {
                    case "boolean": {
                        return prTh.varList([prTh.var("Domain: ", { normalText: true }), ss[0]])
                    }
                    case "set": {
                        return prTh.varList([
                            prTh.var("Domain: ", { normalText: true }),
                            ss[0],
                            prTh.var(" in ", { normalText: true }),
                            ss[1],
                        ])
                    }
                    default: {
                        return prTh.varList([
                            prTh.var("Domain on ", { normalText: true }),
                            ss[0],
                        ])
                    }
                }
            }
            case "UnifiedTransform": {
                const ss = this.m(obj.args);
                if (obj.inversed) {
                    return prTh.varList([
                        prTh.pow(
                            prTh.var(obj.name, { bold: "calligraphic", forceConsiderAsUnit: true }),
                            prTh.negativeOne(),
                            ss[1],
                            { preventTransform: true }
                        ),
                        prTh.brackets(ss[0], "["),
                        prTh.brackets(ss[2], "("),
                    ])
                }

                return prTh.varList([
                    prTh.index(
                        prTh.var(obj.name, { bold: "calligraphic", forceConsiderAsUnit: true }),
                        ss[1]
                    ),
                    prTh.brackets(ss[0], "["),
                    prTh.brackets(ss[2], "("),
                ])
            }
            case "PolynomialRingBase": {
                const ss = this.m(obj.args);
                const base = prTh.varList([ss[0], prTh.brackets(prTh.extractIfVarList(ss[1]), "[")]);
                if (obj.inversed) {
                    base.symbols.unshift(prTh.pow(prTh.var("S"), prTh.negativeOne(), prTh.var("<"), { preventTransform: true }))
                }
                return base;
            }
            case "Morphism": {
                const ss = this.m(obj.args);
                return prTh.bin(ss, "rightarrow");
            }
            case "NamedMorphism": {
                const ss = this.m(obj.args);
                return prTh.varList([ss[0], prTh.var(":"), prTh.bin(ss.slice(1), "rightarrow")])
            }
            case "CompositeMorphism": {
                const ss = this.m(obj.args);
                const names = prTh.extractIfVarList(ss[0]).reverse();
                return prTh.varList([prTh.varList(names, "∘"), prTh.var(":"), prTh.bin(ss.slice(1), "rightarrow")])
            }
            case "Category": {
                const s = obj.args[0] as P.Symbol;
                return this.c({ ...s, bold: true });
            }
            case "Diagram": {
                const ss = this.m(obj.args);
                if (ss[1]) {
                    return prTh.varList([ss[0], prTh.var("⟹"), ss[1]]);
                }
                return ss[0]
            }
            case "DiagramGrid": {
                const ss = this.m(obj.args).map(c => prTh.isNone(c) ? prTh.empty() : c);
                return prTh.matrix({ ss, row: obj.row, col: obj.col }, undefined, { prType: "array" })
            }
            case "FreeModule": {
                const ss = this.m(obj.args);
                return prTh.pow(ss[0], ss[1], undefined, { preventBracketWrap: true });
            }
            case "SubModule": {
                const ss = this.m(obj.args);
                return prTh.varList(prTh.extractIfVarList(ss[0]), ",", "<")
            }
            case "FreeModuleElement": {
                const ss = this.m(obj.args);
                return prTh.varList(ss, ",", "[")
            }
            case "DMP": {
                const ss = this.m(obj.args);
                return ss[0]
            }
            case "MatrixHomomorphism": {
                const ss = this.m(obj.args);
                return prTh.varList([
                    ss[0],
                    prTh.var(":"),
                    ss[1],
                    prTh.var("→", { latexName: "\\rightarrow" }),
                    ss[2],
                ])
            }
            case "Tr": {
                return prTh.genFunc("tr", [this.c(obj.args[0])])
            }
            case "Adjoint": {
                return prTh.pow(this.c(obj.args[0]), prTh.var("†"))
            }
            case "Transpose": {
                return prTh.pow(this.c(obj.args[0]), prTh.var("T"))
            }
            case "ArrayElement": {
                const ss = this.m(obj.args);
                return prTh.index(ss[0], prTh.varList(prTh.extractIfVarList(ss[1]), ","))
            }
            case "Quantity": {
                return this.quantity.convert(obj, this.symbolLatexNames);
            }
            case "Manifold": {
                const name = (obj.args[0] as P.Symbol).name;
                return this.nameParser.parse(name, (n) => prTh.var(n, { normalText: true }));
            }
            case "Patch": {
                const name = (obj.args[0] as P.Symbol).name;
                const s0 = this.nameParser.parse(name, (n) => prTh.var(n, { normalText: true }));
                return prTh.index(s0, this.c(obj.args[1]));
            }
            case "CoordSystem": {
                const name0 = (obj.args[0] as P.Symbol).name;
                const name1 = (obj.args[1] as P.Symbol).name;
                const s0 = this.nameParser.parse(name0, (n) => prTh.var(n, { normalText: true }));
                const s1 = this.nameParser.parse(name1, (n) => prTh.var(n, { normalText: true }));
                return prTh.pow(s0, s1, this.c(obj.args[2]), { preventBracketWrap: true });
            }
            case "BaseScalarField": {
                const name0 = (obj.args[0] as P.Symbol).name;
                return prTh.var(name0, { bold: true })
            }
            case "BaseVectorField": {
                return prTh.index(prTh.var("∂"), this.c(obj.args[0]))
            }
            case "Differential": {
                const ss = this.m(obj.args);
                if (obj.coordSys) {
                    return prTh.varList([prTh.var("d", { normalText: "operator" }), ss[0]], { visualInfo: "asShorthandMul" })
                }
                return prTh.varList([prTh.var("d", { normalText: "operator" }), prTh.brackets([ss[0]])], { visualInfo: "asShorthandMul" })
            }
            case "PermutationMatrix": {
                return prTh.index(prTh.var("P"), this.c(obj.args[0]));
            }
            case "AppliedPermutation": {
                return prTh.varList([prTh.index(prTh.var("𝜎"), this.c(obj.args[0])), prTh.brackets(this.c(obj.args[1]))]);
            }
            case "MatrixSymbol": {
                const isBold = this.ops.matrixSymbol?.style == "bold";
                console.log('isboolld:::', isBold);
                return this.nameParser.parse(obj.name, n => prTh.var(n, { bold: isBold }), isBold)
            }
            case "Trace": {
                return prTh.genFunc("tr", this.m(obj.args));
            }
            case "TensorIndex": {
                return this.tensor.tensorIndex(obj);
            }
            case "TensorElement":
            case "Tensor": {
                return this.tensor.tensor(obj);
            }
            case "PartialDerivative": {
                const [expr, variablesSymbol] = this.m(obj.args);
                const variables = (variablesSymbol as P2Pr.VarList).symbols;
                const pairedVariables = variables.map(v => prTh.varList([v, prTh.one()]));
                return {
                    type: "Derivative",
                    kind: "Container",
                    partial: true,
                    symbols: [expr].concat(pairedVariables.reverse())
                }
            }
            case "WedgeProduct": {
                return prTh.bin(this.m(obj.args), "∧");
            }
            case "TensorProduct": {
                return prTh.bin(this.m(obj.args), "⊗");
            }
            case "Quaternion": {
                const ss = this.m(obj.args);
                return prTh.add([
                    ss[0],
                    prTh.mul([ss[1], prTh.var("i")]),
                    prTh.mul([ss[2], prTh.var("j")]),
                    prTh.mul([ss[3], prTh.var("k")]),
                ])
            }
            case "Series": {
                return prTh.varList(this.m(obj.args), { wrapItemOnCheck: "prPowerIndex", separator: " ", visualInfo: "asShorthandMul" });
            }
            case "KroneckerProduct": {
                return prTh.bin(this.m(obj.args), "⊗");
            }
            case "MatrixElement": {
                const ss = this.m(obj.args);
                return prTh.index(ss[0], prTh.varList(ss.slice(1), ","));
            }
            case "Equivalent": {
                return prTh.bin(this.m(obj.args), "⇔");
            }

        }


        if (obj.args) {
            return this.nameParser.parse(obj.func, (cn) => ({ type: "GenericFunc", kind: "Container", func: cn, symbols: this.m(obj.args), noBracketIfArgEmpty: true }))
        }
        return { type: "Var", kind: "Leaf", name: obj.func }
    }

    m(args: P.Basic[]): Symbol[] {
        return args.map(c => this.c(c));
    }



    private getListSeparator() {
        return this.ops.float?.decimalSeprator == "comma" ? ";" : ",";
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

    export type Symbol = Mul | C<"Add"> | Var | Pow | Matrix | C<"Frac"> | C<"Sqrt"> | GenericFunc |
        Derivative | Relational | C<"Binomial"> |
        VarList | C<"Integral"> | Index | JsonData
        | C<"Order"> | C<"PrescriptIdx"> | Subs | C<"Sum"> |
        C<"Product"> | C<"Limit"> | Quantity |
        C<"Piecewise"> | BinaryOp | UnaryOp | OverSymbol;



    export type Frac = C<"Frac">;
    export type Integral = C<"Integral">;
    export type Add = C<"Add">;
    export type Sqrt = C<"Sqrt">;

    export type Prescript = C<"Prescript">;
    export type PrescriptIdx = C<"PrescriptIdx">;
    export type Subs = C<"Subs">;

    export interface Quantity extends Leaf {
        type: "Quantity";
        pr: Symbol;
    }

    export interface BinaryOp extends Container {
        type: "BinaryOp";
        op: "↦" | "×" | "∧" | "⇒" | "∨" | "⧵" | "▵" | "∩" | "∪" | "⋅" | "mod" | "rightarrow" | "⊗" | "⇔";
        wrapIfMulShorthand?: boolean;
    }
    export interface UnaryOp extends Container {
        type: "UnaryOp";
        op: "!" | "!!" | "¬" | "∇" | "▵";
        pos: "before" | "after";
    }

    export interface Pow extends C<"Pow"> {
        preventTransform?: boolean;
        preventBracketWrap?: boolean;
    }

    export interface OverSymbol extends Container {
        type: "OverSymbol";
        op: "small-hat" | "overline" | "ring" | "check" | "breve" | "acute" | "grave" | "small-tilde" | "prime" | "ddddot" | "dddot" | "ddot"|"dot"|"overrightarrow";
        bold?: boolean;
    }

    export interface Index extends C<"Index"> {
        noPowMerge?: boolean;
    }

    export interface VarList extends Container {
        type: "VarList";
        bracket?: SupportBracket;
        separator?: "," | ";" | "|" | ":" | "∘" | " ";
        separatorSpacing?: "before" | "after" | "around";
        rightBracket?: SupportBracket;
        wrapItemOnCheck?: "prOp" | "prPowerIndex" | "prShorthandMul";
        visualInfo?: PrSymbolVisuallyInfo.CheckResult | "asShorthandMul";

    }

    export interface Mul extends Container {
        type: "Mul";
    }

    export interface Matrix extends Container {
        type: "Matrix"
        row: number;
        col: number;
        bracket?: "(" | "[";
        prType?: "matrix" | "array";
    }


    export interface GenericFunc extends Container {
        type: "GenericFunc"
        func: string | Symbol;
        powerIndexPos?: "all-after" | "power-after" | "wrap-all";
        argSeparator?: "," | "|" | ";|";
        forceUsingOperatorName?: boolean;
        allowAncesstorPowerAtEnd?: boolean;
        isUndefinedFunction?: boolean;
        bracket?: "[" | "(";
    }

    export interface Derivative extends Container {
        type: "Derivative";
        partial: boolean;
    }

    export interface Relational extends Container {
        type: "Relational";
        relOp: "==" | ">" | "<" | "<=" | ">=" | "!=";
    }

    export interface IPrTransform {
        transform(symbol: Symbol, ops: P2Pr.TransformOptions): Symbol;
    }


    export interface Var extends Leaf {
        type: "Var";
        name: string;
        bold?: P.BoldType;
        normalText?: boolean | "operator";
        nativeType?: "One" | "NegativeOne" | "Zero" | "Integer" | "Float" | "NaN" | "BooleanTrue" | "BooleanFalse" | "NumberSymbol" | "None" | "Empty";
        forceConsiderAsUnit?: boolean;
        latexName?: "\\rightarrow";

    }

    export interface JsonData extends Leaf {
        type: "JsonData";
        data: string;
    }

    export type SupportBracket = P.SupportBracket;

    export interface C<T extends string> extends Container {
        type: T;
    }
    export interface L<T extends string> extends Leaf {
        type: T;
    }

    export interface TransformOptions {
        mul?: {
            order?: boolean;
            flatten?: boolean;
        };
        add?: {
            order?: boolean;
            flatten?: boolean;
        };
        float?: {
            decimalSeprator?: "comma" | "period"
        };
        frac?: {
            combineMul?: boolean;
            combineAdd?: boolean;
            combineNumAndDenoSamePow?: boolean;
            combineLogFrac?: boolean;
            extractMinus?: boolean;
        };
        pow?: {
            negativeOneToFrac?: boolean;
            negativeIntegerToFrac?: boolean;
            halfToRootSquare?: boolean;
            oneOfIntegerToPowOfRootSquare?: boolean;
            negativeOneOfIntegerToPowOfRootSquare?: boolean;
        };
        sqrt?: {
            combineMul?: boolean;
        };
        reim?: {
            gothic?: boolean;
        };
        imaginaryUnit?: {
            textStyle?: boolean;
        };
        matrixSymbol?: {
            style?: "bold" | "plain";
        }
    }



    export type PGenericFunc = P.GenericFunc;
    export type PBasic = P.Basic;
    export type PQuantity = P.Quantity;
    export type PF<T extends string> = P.F<T>;
    export type PU<T extends string> = P.U<T>;
    export type PPFuncArgs = P.FuncArgs;
    export type BoldType = P.BoldType;
    export type PTensorIndex = P.TensorIndex;
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
        Cycle | F<"Cross"> | F<"Curl"> | F<"Divergence"> | F<"Dot"> | F<"Gradient"> | F<"Laplacian"> |
        F<"Subs"> | F<"Set"> | F<"FiniteSet"> | F<"Interval"> | F<"Range"> | SeqFormula | F<"FourierSeries"> |
        F<"Sum"> | F<"AccumulationBounds"> | U<"EmptySet"> | U<"UniversalSet"> | F<"Operator"> | F<"Union"> |
        F<"Intersection"> | F<"SymmetricDifference"> | F<"Complement"> | U<"Reals"> | U<"Naturals"> | U<"Complexes"> |
        U<"Rationals"> | U<"Integers"> | U<"Naturals0"> | ProductSet | F<"ImageSet"> | F<"Lambda"> | F<"ConditionSet"> |
        F<"ComplexRegion"> | F<"Contains"> | F<"Product"> | F<"Limit"> | F<"DiracDelta"> | F<"Heaviside"> | KroneckerDelta |
        LeviCivita | F<"Piecewise"> | F<"Factorial"> | F<"Factorial2"> | F<"SubFactorial"> | F<"Exp"> | F<"NDimArray"> |
        U<"IdentityFunction"> | F<"PolyElement"> | F<"PolyRing"> | F<"FracElement"> | F<"FractionField"> |
        F<"ComplexRootOf"> | F<"MatrixSlice"> | U<"NoneType"> | RandomDomain | F<"PythonRational"> | UnifiedTransform |
        PolynomialRingBase | F<"Morphism"> | F<"NamedMorphism"> | F<"CompositeMorphism"> | F<"Category"> | F<"Diagram"> | DiagramGrid |
        F<"FreeModule"> | F<"SubModule"> | F<"FreeModuleElement"> | F<"DMP"> | F<"Frac"> | F<"MatrixHomomorphism"> | F<"Tr"> |
        F<"Adjoint"> | F<"Transpose"> | F<"ArrayElement"> | Quantity | F<"Manifold"> | F<"Patch"> | F<"CoordSystem"> |
        F<"BaseScalarField"> | F<"BaseVectorField"> | Differential | F<"PermutationMatrix"> | F<"AppliedPermutation"> |
        UNamed<"MatrixSymbol"> | F<"Trace"> | TensorIndex | F<"Tensor"> | F<"TensorElement"> | F<"PartialDerivative"> |
        F<"WedgeProduct"> | F<"TensorProduct"> | F<"Quaternion"> | F<"Series"> | F<"KroneckerProduct"> | F<"MatrixElement"> |
        F<"Equivalent"> |
        UnknownFunc;


    export interface TensorIndex extends F<"TensorIndex"> {
        isUp: boolean;
    }

    export interface Differential extends F<"Differential"> {
        coordSys: boolean;
    }

    export interface Quantity extends F<"Quantity"> {
        latex: string;
    }
    export interface UnifiedTransform extends F<"UnifiedTransform"> {
        inversed: boolean;
        name: string;
    }
    export interface PolynomialRingBase extends F<"PolynomialRingBase"> {
        inversed: boolean;
    }
    export interface RandomDomain extends F<"RandomDomain"> {
        subType: "boolean" | "set" | "symbols";
    }
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
        bold?: boolean | "blackboard" | "calligraphic";
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
    export interface DiagramGrid extends FuncArgs {
        func: "DiagramGrid"
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

    export type BoldType = boolean | "blackboard" | "calligraphic" | "boldsymbol";

    export interface Dummy {
        func: "Dummy";
        name: string;
        bold?: BoldType;
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

    export interface UndefinedFunction extends FuncArgs {
        func: "UndefinedFunction";
        name: string;
    }


    export interface Cycle {
        func: "Cycle";
        perm: number[][];
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
    export interface UNamed<T extends string> {
        func: T;
        name: string;
    }
}