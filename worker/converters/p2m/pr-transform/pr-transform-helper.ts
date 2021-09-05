import stringHelper from "@lib-shared/string-helper";
import { _l } from "@sympy-worker/light-lodash";
import type { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import dequal from "fast-deep-equal";
import { prSymbolVisuallyInfo } from "./pr-symbol-visually-info";



const enum EnumPosWeight {
    ConstantInAddCtx = 30000,
    ConstantInMulCtx = 10000,
    MinusSign = 2000,
    Integer = 100,
    Float = 200,
    FracConstant = 300,
    Other = 10000,
    GenericFunc = 500,
    Frac = 600,
    Add = 700,
    Pow = 800,
    Sqrt = 900,
    Var = 1000,

    Sin = 50,
    Cos = 51,
    Tan = 52,
    GenericFuncUnknown = 60,

    Unknown = 15000,
}

class PrTransformHelper {



    /**
     * Constants:  +20000
     * -- Minus Sign:  +1000
     * -- -- Integer Constant: +100 
     * -- -- Float Constant: +200
     * -- -- Frac Constant: +300
     * Others: +10000
     * -- Minus Sign:  +1000 [Ignore]
     * -- -- Generic Func: +500
     * -- -- -- sin: +50, cos: +51, tan: +52 
     * -- -- Frac: +600
     * -- -- Power: +700
     * -- -- Symbol: +800
     */
    positionWeight(s: Symbol, type: "add" | "mul"): number {
        const constantBase = type == "add" ? EnumPosWeight.ConstantInAddCtx : EnumPosWeight.ConstantInMulCtx;
        switch (s.type) {
            case "Var": {
                switch (s.nativeType) {
                    case "One":

                    case "NegativeOne": {
                        return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.Integer;
                    }
                    case "Integer": {
                        if (s.name[0] != "-") {
                            return constantBase + EnumPosWeight.Integer;
                        }

                        return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.Integer;
                    }
                    case "Float": {
                        if (s.name[0] == "-") {
                            return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.Float;
                        }

                        return constantBase + EnumPosWeight.Float;
                    }
                }
            }

            case "Frac": {
                if (this.isConstant(s)) {
                    return constantBase + EnumPosWeight.FracConstant;
                }

                return EnumPosWeight.Other + EnumPosWeight.Frac;
            }
            case "Mul": {
                if (s.type == "Mul" && s.symbols.length == 2 && this.isNegativeOne(s.symbols[0]) && this.isConstant(s.symbols[1])) {
                    return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.FracConstant
                }

                if (this.isConstant(s.symbols[0])) {
                    return EnumPosWeight.Other + EnumPosWeight.Var;
                }

                if (s.symbols.every(s => this.isConstant(s) || s.type == "Var")) {
                    return EnumPosWeight.Other + EnumPosWeight.Var;
                }

                const foundNotConstant = s.symbols.find(s => !this.isConstant(s));
                if (foundNotConstant) {
                    return this.positionWeight(foundNotConstant, type);
                }

                return EnumPosWeight.Other + EnumPosWeight.Var;
            }
            case "Pow": {
                if (s.symbols[1].type == "Var" && s.symbols[1].nativeType == "Integer") {
                    /**higher power will be in front */
                    return EnumPosWeight.Other + EnumPosWeight.Pow + 50;
                }

                if (s.symbols[0].type == "GenericFunc") {
                    return this.positionWeight(s.symbols[0], type);
                }
                return EnumPosWeight.Other + EnumPosWeight.Pow;
            }
            case "Sqrt": {
                return EnumPosWeight.Other + EnumPosWeight.Sqrt;
            }
            case "Add": {
                return EnumPosWeight.Other + EnumPosWeight.Add;
            }
            case "Var": {
                return EnumPosWeight.Other + EnumPosWeight.Var;
            }
            case "GenericFunc": {
                const base = EnumPosWeight.Other + EnumPosWeight.GenericFunc;

                switch (s.func) {
                    case "sin": return base + EnumPosWeight.Sin;
                    case "cos": return base + EnumPosWeight.Cos;
                    case "tan": return base + EnumPosWeight.Tan;
                }

                return base + EnumPosWeight.GenericFuncUnknown;
            }
        }

        return EnumPosWeight.Unknown;
    }

    list(ss: Symbol[]): P2Pr.VarList {
        return { type: "VarList", bracket: "(", kind: "Container", separator: ",", symbols: ss };
    }
    add(ss: Symbol[]): P2Pr.Add {
        return { type: "Add", kind: "Container", symbols: ss };
    }

    mulOf(...ss: Symbol[]): P2Pr.Mul {
        return this.mul(ss);
    }
    mul(ss: Symbol[], more?: Partial<P2Pr.Mul>): P2Pr.Mul {
        return { type: "Mul", kind: "Container", symbols: ss, unevaluatedDetected: false, ...more }
        // return ss.reduce((prev, cur) => prev ? this.mulOf2(prev, cur) : cur, undefined as P2Pr.Mul) as P2Pr.Mul;
    }

    zeroOrSingleOr(ss: Symbol[], or: "mul" | "add") {
        if (ss.length <= 0) {
            return this.zero();
        }

        if (ss.length == 1) {
            return ss[0];
        }

        return or == "add" ? this.add(ss) : this.mul(ss);
    }

    // mulOf2(s1: Symbol, s2: Symbol): P2Pr.Mul {
    //     if (s1.type == "Mul" && s2.type == "Mul") {
    //         return { ...s1, symbols: s1.symbols.concat(s2.symbols), unevaluatedDetected: false }
    //     }
    //     if (s1.type == "Mul") {
    //         return { ...s1, symbols: s1.symbols.concat([s2]), unevaluatedDetected: false }
    //     }
    //     if (s2.type == "Mul") {
    //         return { ...s2, symbols: [s1 as Symbol].concat(s2.symbols), unevaluatedDetected: false }
    //     }

    //     return { type: "Mul", unevaluatedDetected: false, kind: "Container", symbols: [s1, s2] };
    // }


    isConstant(s: Symbol): "positive" | "negative" | false {
        switch (s.type) {
            case "Var": {
                switch (s.nativeType) {
                    case "Float":
                        return s.name[0] == "-" ? "negative" : "positive";

                    case "Integer":
                        return s.name[0] == "-" ? "negative" : "positive";
                    case "NegativeOne":
                        return "negative";
                    case "One": {
                        return "positive";
                    }
                }
            }

        }

        if (s.type == "Frac" && this.isConstant(s.symbols[0]) && this.isConstant(s.symbols[1])) {
            return "positive";
        }

        if (s.type == "Mul" && s.symbols.length == 2 && this.isNegativeOne(s.symbols[0])) {
            if (this.isConstant(s.symbols[1])) {
                return "negative";
            }
        }
    }

    startWithMinus(symbol: Symbol): boolean {
        if (symbol.type == "Var") {
            if (symbol.nativeType == "NegativeOne") {
                return true;
            }

            if (symbol.nativeType == "Float" && symbol.name[0] == "-") {
                return true;
            }
            if (symbol.nativeType == "Integer" && symbol.name[0] == "-") {
                return true;
            }
        }


        if (symbol.type == "Mul" || symbol.type == "Pow") {
            return this.startWithMinus(symbol.symbols[0]);
        }

        return false;
    }



    matchRationalFrac(s: Symbol, num: number, den?: number): s is P2Pr.Frac {
        if (!this.isRationalFrac(s)) {
            return false;
        }

        const [actualNum, actualDen] = this.extractRationalFrac(s);
        if (den !== undefined) {
            return actualNum == num && actualDen == den;
        }

        return actualNum == num;
    }

    isRationalFrac(s: Symbol): s is P2Pr.Frac {
        if (s.type != "Frac") {
            return false;
        }

        return !!this.isConstant(s.symbols[0]) && !!this.isConstant(s.symbols[1]);
    }


    basicEquals(b1: P2Pr.PBasic, b2: P2Pr.PBasic): boolean {
        return dequal(b1, b2);
    }
    symbolEquals(b1: P2Pr.Symbol, b2: P2Pr.Symbol): boolean {
        return dequal(b1, b2);
    }

    isBooleanTrue(s: Symbol) {
        return s.type == "Var" && s.nativeType == "BooleanTrue";
    }

    extractIntegerValue(s: Symbol): number {
        if (s.type == "Var") {
            if (s.nativeType == "Zero") {
                return 0;
            }
            if (s.nativeType == "One") {
                return 1;
            }
            if (s.nativeType == "NegativeOne") {
                return -1;
            }
            if (s.nativeType == "Integer") {
                return Number.parseInt(s.name);
            }
        }

        throw new Error("Unable to extract integer value");
    }

    extractIfVarList(s: Symbol): Symbol[] {
        if (s.type == "VarList") {
            return s.symbols;
        }
        return [s];
    }

    isInfinity(s: Symbol): boolean {
        return s.type == "Var" && s.nativeType == "NumberSymbol" && s.name == "∞";
    }

    isNegativeInfinity(s: Symbol): boolean {
        return this.isMulNegativeOf(s, st => this.isInfinity(st));
    }

    isMulNegativeOf(s: Symbol, predicate?: (sToTest: Symbol) => boolean): s is P2Pr.Mul {
        return s.type == "Mul" && s.symbols.length == 2 && this.isNegativeOne(s.symbols[0]) && (!predicate || predicate(s.symbols[1]));
    }


    extractRationalFrac(s: P2Pr.Frac): [number, number] {
        return [this.extractIntegerValue(s.symbols[0]), this.extractIntegerValue(s.symbols[1])]
    }

    isSingleVar(s: Symbol): boolean {
        return s.type == "Var" && stringHelper.length(s.name) == 1;
    }

    // isSingleConstantName(s: Symbol): boolean {
    //     return s.type == "ConstantSymbol" && stringHelper.length(s.name) == 1;
    // }

    considerPresentAsSingleUnitForPow(s: Symbol, cr: Pr2M.CResult) {
        const info = prSymbolVisuallyInfo.check(s, cr);
        return info.prPowerIndex == "unit";
        // if (cr.prUnit == "bracket") {
        //     return true;
        // }

        // if (s.type == "Frac") {
        //     return true;
        // }

        // if (this.isSingleVar(s)) {
        //     return true;
        // }

        // if (this.isPositiveOrZeroIntegerValue(s) || this.isPositiveOrZeroFloatValue(s)) {
        //     return true;
        // }
    }

    considerPresentAsSingleUnitInOpCtx(s: Symbol, cr: Pr2M.CResult, ops?: { wrapEvenShortHand?: boolean, excludeSign?: boolean }) {
        const info = prSymbolVisuallyInfo.check(s, cr);
        if (ops?.excludeSign && info.prSign && info.prExcludeSign == "unit") {
            return true;
        }

        if (ops?.wrapEvenShortHand && info.mulMoreInfo?.isAllShorthand && (!info.mulMoreInfo?.singleItem || info.mulMoreInfo?.singleItem == "when-exclude-negative-one")) {
            return false;
        }
        return info.prOp == "unit";
    }

    isPositiveOrZeroFloatValue(s: Symbol): boolean {
        if (s.type == "Var") {
            if (s.nativeType == "Float") {
                return s.name[0] != "-";
            }
        }
    }


    isPositiveOrZeroIntegerValue(s: Symbol): boolean {
        if (s.type == "Var") {
            if (s.nativeType == "Zero") {
                return true;
            }
            if (s.nativeType == "One") {
                return true;
            }

            if (s.nativeType == "Integer") {
                return s.name[0] != "-";
            }
        }

    }

    isInt(s: Symbol): boolean {
        if (s.type == "Var") {
            if (s.nativeType == "Zero") {
                return true;
            }
            if (s.nativeType == "One") {
                return true;
            }
            if (s.nativeType == "NegativeOne") {
                return true;
            }
            if (s.nativeType == "Integer") {
                return true;
            }
        }


        return false;
    }

    isNegativeOne(s: Symbol) {
        return (s.type == "Var" && s.nativeType == "NegativeOne") || this.isIntType(s, "-1");
    }
    isZero(s: Symbol) {
        return (s.type == "Var" && s.nativeType == "Zero") || this.isIntType(s, "0");;
    }
    isOne(s: Symbol) {
        return (s.type == "Var" && s.nativeType == "One") || this.isIntType(s, "1");;
    }

    isIntType(s: Symbol, vl?: string) {
        if (vl === undefined) {
            return s.type == "Var" && s.nativeType == "Integer";
        }
        return s.type == "Var" && s.nativeType == "Integer" && s.name == vl;
    }


    var(text: string, more?: Partial<P2Pr.Var>): P2Pr.Var {
        if (!text) {
            throw new Error("empty use ")
        }
        return { type: "Var", kind: "Leaf", name: text, ...more };
    }
    empty(more?: Partial<P2Pr.Var>): P2Pr.Var {
        return { type: "Var", kind: "Leaf", name: "?", nativeType: "Empty", ...more };
    }

    quantity(pr: Symbol): P2Pr.Quantity {
        return { type: "Quantity", kind: "Leaf", pr };
    }

    raw(text: string, more?: Partial<P2Pr.Var>): P2Pr.Var {
        return { type: "Var", kind: "Leaf", name: text, ...more };
    }

    numberSymbol(text: string, more?: Partial<P2Pr.Var>): P2Pr.Var {
        return { type: "Var", kind: "Leaf", name: text, nativeType: "NumberSymbol", ...more };
    }

    tryExtactVarName(s: Symbol): string | undefined {
        if (s.type == "Var") {
            return s.name;
        }
    }

    over(op: P2Pr.OverSymbol["op"], s: Symbol | string, more?: Partial<P2Pr.OverSymbol>): P2Pr.OverSymbol {
        if (typeof s == "string") {
            return { type: "OverSymbol", kind: "Container", op, symbols: [this.var(s)], ...more }
        }
        return { type: "OverSymbol", kind: "Container", op, symbols: [s], ...more }
    }

    singleOrBrackets(ss: Symbol[]): Symbol {
        if (ss.length == 1) {
            return ss[0];
        }
        return this.varList(ss, ",", "(");
    }

    varList(ss: Symbol[], separator?: P2Pr.VarList["separator"], br?: P2Pr.VarList["bracket"], rightBr?: P2Pr.VarList["bracket"], sSpacing?: P2Pr.VarList["separatorSpacing"]): P2Pr.VarList;
    varList(ss: Symbol[], op?: Partial<P2Pr.VarList>): P2Pr.VarList;

    varList(ss: Symbol[], separatorOrOp?: P2Pr.VarList["separator"] | Partial<P2Pr.VarList>, br?: P2Pr.VarList["bracket"], rightBr?: P2Pr.VarList["bracket"], sSpacing?: P2Pr.VarList["separatorSpacing"]): P2Pr.VarList {
        if (typeof separatorOrOp == "string" || !separatorOrOp) {
            return { type: "VarList", kind: "Container", symbols: ss, separator: separatorOrOp as P2Pr.VarList["separator"], bracket: br, rightBracket: rightBr, separatorSpacing: sSpacing };
        }
        return { type: "VarList", kind: "Container", symbols: ss, ...separatorOrOp };
    }

    rel(op: P2Pr.Relational["relOp"], ss: Symbol[]): P2Pr.Relational {
        return { type: "Relational", kind: "Container", relOp: op, symbols: ss }
    }
    removeVarListBracket(s: Symbol): Symbol {
        if (s.type == "VarList") {
            return { ...s, bracket: undefined }
        }
    }

    int(vl: number | string): P2Pr.Symbol {
        return this.var(vl.toString(), { nativeType: "Integer" })
    }


    index(base: Symbol, index: Symbol, more?: Partial<P2Pr.Index>): P2Pr.Index {
        return { type: "Index", kind: "Container", symbols: [base, index], ...more };
    }

    brackets(base: Symbol | Symbol[], br: P2Pr.SupportBracket = "("): P2Pr.Symbol {
        if (base instanceof Array) {
            return { type: "VarList", kind: "Container", symbols: base, bracket: br, separator: "," };
        }
        return { type: "VarList", kind: "Container", symbols: [base], bracket: br, separator: "," };
    }

    matrix(ss: Symbol[][] | { ss: Symbol[], row: number, col: number }, bracket: "(" | "[" | undefined, more?: Partial<P2Pr.Matrix>): P2Pr.Matrix {
        let flattenSs: Symbol[];
        let row = 1;
        let col = 1;
        if (ss instanceof Array) {
            flattenSs = _l.flatten(ss);
            row = ss.length;
            col = ss[0].length;
        } else {
            flattenSs = ss.ss;
            row = ss.row;
            col = ss.col;
        }

        return {
            type: "Matrix",
            bracket: bracket,
            row,
            col,
            kind: "Container",
            symbols: flattenSs,
            ...more,
        }
    }

    pow(base: Symbol, root: Symbol, index?: Symbol, more?: Partial<P2Pr.Pow>): P2Pr.Pow {
        const rs: P2Pr.Pow = {
            type: "Pow",
            kind: "Container",
            symbols: [base, root],
            ...more
        }
        if (index) {
            rs.symbols.push(index);
        }

        return rs;
    }

    prescriptIdx(index: Symbol): P2Pr.PrescriptIdx {
        const rs: P2Pr.PrescriptIdx = {
            type: "PrescriptIdx",
            kind: "Container",
            symbols: [index]
        }

        return rs;
    }

    genFunc(name: string | Symbol, ss: Symbol[], more?: Partial<P2Pr.GenericFunc>): P2Pr.GenericFunc {
        return { type: "GenericFunc", func: name, kind: "Container", symbols: ss, ...more }
    }


    zero() {
        return this.var("0", { nativeType: "Zero" });
    }
    one() {
        return this.var("1", { nativeType: "One" });
    }
    negativeOne() {
        return this.var("-1", { nativeType: "NegativeOne" });
    }
    none() {
        return prTh.var("None", { nativeType: "None", normalText: true })
    }
    isNone(s: Symbol) {
        return s.type == "Var" && s.nativeType == "None";
    }
    isPositiveInt(s: Symbol): s is P2Pr.Var {
        if (this.isOne(s)) {
            return true;
        }
        return s.type == "Var" && s.nativeType == "Integer" && s.name[0] != "-";
    }
    isNegativeInt(s: Symbol): s is P2Pr.Var {
        if (this.isNegativeOne(s)) {
            return true;
        }
        return s.type == "Var" && s.nativeType == "Integer" && s.name[0] == "-";
    }

    removeNegativeSign(s: Symbol) {
        if (this.isNegativeOne(s)) {
            return this.one();
        }

        if (this.isNegativeInt(s)) {
            return this.int(s.name.substr(1))
        }
        if (this.isMulNegativeOf(s)) {
            return s.symbols[1];
        }

        throw new Error("Unable to detect to remove");
    }

    integerOrSpecial(vl: number): P2Pr.Symbol {
        if (vl == 0) {
            return this.zero();
        }
        if (vl == 1) {
            return this.one()
        }
        if (vl == -1) {
            return this.negativeOne();
        }

        return this.int(vl)
    }

    bin(ss: Symbol[], op: P2Pr.BinaryOp["op"], more?: Partial<P2Pr.BinaryOp>): P2Pr.BinaryOp {
        return { type: "BinaryOp", kind: "Container", op, symbols: ss, ...more };
    }

    unary(s: Symbol, op: P2Pr.UnaryOp["op"], pos: P2Pr.UnaryOp["pos"]): P2Pr.UnaryOp {
        return { type: "UnaryOp", kind: "Container", op, symbols: [s], pos };
    }

    frac(num: Symbol, den: Symbol): P2Pr.Frac {
        return {
            type: "Frac",
            kind: "Container",
            symbols: [num, den]
        }
    }
    float(val: string): P2Pr.Var {
        return this.var(val, { nativeType: "Float" });
    }
}

export const prTh = new PrTransformHelper();

type Symbol = P2Pr.Symbol;