import type { P2Pr } from "../p2pr";

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
            case "One":
            case "Half": {
                return constantBase + EnumPosWeight.Integer;
            }

            case "NegativeOne": {
                return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.Integer;
            }
            case "Integer": {
                if (s.value > 0) {
                    return constantBase + EnumPosWeight.Integer;
                }

                return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.Integer;
            }
            case "Float": {
                if (s.value[0] == "-") {
                    return constantBase + EnumPosWeight.MinusSign + EnumPosWeight.Float;
                }

                return constantBase + EnumPosWeight.Float;
            }
            case "Frac": {
                if (this.isConstant(s)) {
                    return constantBase + EnumPosWeight.FracConstant;
                }

                return EnumPosWeight.Other + EnumPosWeight.Frac;
            }
            case "Mul": {
                if (s.type == "Mul" && s.symbols.length == 2 && s.symbols[0].type == "NegativeOne" && this.isConstant(s.symbols[1])) {
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
                if (s.symbols[1].type == "Integer") {
                    /**higher power will be in front */
                    return EnumPosWeight.Other + EnumPosWeight.Pow + 50 - s.symbols[1].value;
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

    mul(s1: Symbol, s2: Symbol): P2Pr.Mul {
        if (s1.type == "Mul" && s2.type == "Mul") {
            return { ...s1, symbols: s1.symbols.concat(s2.symbols) }
        }
        if (s1.type == "Mul") {
            return { ...s1, symbols: s1.symbols.concat([s2]) }
        }
        if (s2.type == "Mul") {
            return { ...s2, symbols: [s1 as Symbol].concat(s2.symbols) }
        }

        return { type: "Mul", unevaluatedDetected: true, kind: "Container", symbols: [s1, s2] };
    }


    isConstant(s: Symbol): "positive" | "negative" | false {
        switch (s.type) {
            case "Float":
                return s.value[0] == "-" ? "negative" : "positive";

            case "Integer":
                return s.value > 0 ? "positive" : "negative";
            case "NegativeOne":
                return "negative";
            case "Half":
            case "One": {
                return "positive";
            }
        }

        if (s.type == "Frac" && this.isConstant(s.symbols[0]) && this.isConstant(s.symbols[1])) {
            return "positive";
        }

        if (s.type == "Mul" && s.symbols.length == 2 && s.symbols[0].type == "NegativeOne") {
            if (this.isConstant(s.symbols[1])) {
                return "negative";
            }
        }
    }

    isSymbolValueOne(symbol: Symbol): boolean {
        if (symbol.type == "One") {
            return true;
        }

        if (symbol.type == "Integer" && symbol.value == 1) {
            return true;
        }

        return false;
    }

    startWithMinus(symbol: Symbol): boolean {
        if (symbol.type == "NegativeOne") {
            return true;
        }

        if (symbol.type == "Float" && symbol.value[0] == "-") {
            return true;
        }
        if (symbol.type == "Integer" && symbol.value < 0) {
            return true;
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

    extractIntegerValue(s: Symbol): number {
        if (s.type == "Zero") {
            return 0;
        }
        if (s.type == "One") {
            return 1;
        }
        if (s.type == "NegativeOne") {
            return -1;
        }
        if (s.type == "Integer") {
            return s.value;
        }

        throw new Error("Unable to extract integer value");
    }

    extractRationalFrac(s: P2Pr.Frac): [number, number] {
        return [this.extractIntegerValue(s.symbols[0]), this.extractIntegerValue(s.symbols[1])]
    }

    isSingleVar(s: Symbol): boolean {
        return s.type == "Var" && s.name.length == 1;
    }

    isIntegerValue(s: Symbol): boolean {
        if (s.type == "Zero") {
            return true;
        }
        if (s.type == "One") {
            return true;
        }
        if (s.type == "NegativeOne") {
            return true;
        }
        if (s.type == "Integer") {
            return true;
        }

        return false;
    }

    isNegativeOne(s: Symbol) {
        return s.type == "NegativeOne" || (s.type == "Integer" && s.value == -1);
    }

    var(text: string): P2Pr.Var {
        return { type: "Var", kind: "Leaf", name: text };
    }

    int(vl: number): P2Pr.Integer {
        return { type: "Integer", kind: "Leaf", value: vl }
    }

    pow(base: Symbol, root: Symbol): P2Pr.Pow {
        return {
            type: "Pow",
            kind: "Container",
            indexJson: undefined,
            symbols: [base, root]
        }
    }
}

export const prTh = new PrTransformHelper();

type Symbol = P2Pr.Symbol;