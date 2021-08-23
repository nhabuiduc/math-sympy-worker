export class PGen {
    constructor() {
    }

    toCode(mainExp: string, invokeName: string, symbolNames: Map<string, string>, ...paramExprs: string[]) {
        const oriExprName = "oriExpr";
        const exprName = "expr";

        const declareSymbols = this.makeDeclareSymbols(symbolNames);
        const declareExp: PCG.Assign = { type: "assign", target: oriExprName, value: { type: "raw", exp: mainExp } };

        const runExp: PCG.Assign = {
            type: "assign",
            target: exprName,
            value: {
                type: "call",
                func: { type: "attribute", value: oriExprName, attr: invokeName },
                args: paramExprs,
            }
        };

        const module: PCG.Module = {
            type: "module",
            body: [
                ...declareSymbols,
                declareExp,
                runExp,
                {
                    type: "raw", exp: `
print('Input Tree: ',srepr(${oriExprName}))
print('Output Tree: ',srepr(${exprName}))
print('Input Expr Str: ',str(${oriExprName}))
print('Output Expr Str: ',str(${exprName}))

rootDic = ___mcSympyExprDump(expr)
json.dumps(rootDic)
`}
            ]
        };

        return this.expStr(module);
    }

    private makeDeclareSymbols(symbolNames: Map<string, string>): PCG.Assign[] {
        return Array.from(symbolNames.entries()).map(([key, value]) => {
            const declareSymbol: PCG.Assign = {
                type: "assign",
                target: key,
                value: { type: "call", func: "Symbol", args: [{ type: "str", s: value }] }
            };
            return declareSymbol;
        })
    }

    private expStr(exp: PCG.Expression | string): string {
        if (typeof exp == "string") {
            return exp;
        }

        switch (exp.type) {
            case "module": {
                return `${exp.body.map(e => this.expStr(e)).join("\n")}`;
            }
            case "assign": {
                return `${this.expStr(exp.target)} = ${this.expStr(exp.value)}`
            }
            case "tuple": {
                return `${exp.elts.join(", ")}`;
            }
            case "call": {
                return `${this.expStr(exp.func)}(${exp.args.map(a => this.expStr(a)).join(", ")})`;
            }
            case "raw": {
                return exp.exp;
            }
            case "expr": {
                return `${this.expStr(exp.exp)}`;
            }
            case "attribute": {
                return `${exp.value}.${exp.attr}`;
            }
            case "str": {
                return `'${exp.s}'`;
            }
            default: {
                // const _a: never = exp;
            }
        }
    }
}


namespace PCG {
    export type Expression = Module | Assign | Tuple | Call | Raw | Expr | Attribute | Str;
    export interface Module {
        type: "module";
        body: (Assign | Raw | Expr)[];
    }

    export interface Assign {
        type: "assign";
        target: Tuple | string;
        value: Call | Raw;
    }

    export interface Tuple {
        type: "tuple";
        elts: string[];
    }

    export interface Call {
        type: "call";
        func: string | Attribute;
        args: (string | Str)[];
    }
    export interface Raw {
        type: "raw";
        exp: string;
    }

    export interface Expr {
        type: "expr";
        exp: Call;
    }

    export interface Attribute {
        type: "attribute";
        attr: string;
        value: string;
    }

    export interface Str {
        type: "str";
        s: string;
    }
}

export namespace PGen {

}