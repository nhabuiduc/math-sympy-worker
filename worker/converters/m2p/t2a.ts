import { AstpMain } from "./ast-parse/astp-main";
import { astpPostProcess } from "./ast-parse/astp-post-process";
import { astpCommon } from "./ast-parse/astp-common";
import { M2T } from "./m2t";

export class T2A {
    private astpMain: AstpMain
    constructor(constantTextFuncSet: Set<string>) {
        this.astpMain = new AstpMain(constantTextFuncSet);
    }

    toAst(tokens: Token[]): Expr {
        return astpPostProcess.insertTimes(this.astpMain.toAst(tokens));
    }

    extractAllVarNames(expr: Expr): Map<string, string> {
        const rs: T2A.VarSymbol[] = [];
        this.innerExtractAllVarNames(expr.symbols, rs);

        const map = new Map<string, string>();
        rs.forEach(s => {
            if (!s.indexStr) {
                map.set(s.name, s.name);
            } else {
                map.set(astpCommon.symbolName(s), `${s.name}|${s.indexStr}`);
            }
        })
        return map;
    }

    private innerExtractAllVarNames(symbols: Symbol[], varSymbols: T2A.VarSymbol[]): void {
        for (const symbol of symbols) {
            if (symbol.type == "var-symbol") {
                varSymbols.push(symbol);
            }
            else if (symbol.kind == "container") {
                symbol.args.forEach(arg => this.innerExtractAllVarNames(arg.symbols, varSymbols));
            }
            else if (symbol.kind == "groupable") {
                this.innerExtractAllVarNames(symbol.symbols, varSymbols)
            }
        }
    }
}


type Token = M2T.Token;
type Symbol = T2A.Symbol;
type Expr = T2A.Expr;

export namespace T2A {
    export interface Expr {
        symbols: Symbol[];
    }

    export type Symbol = VarSymbol | OpSymbol | NumberSymbol | FloatSymbol | HalfSymbol | FuncSymbol | MatrixSymbol | GenericFuncSymbol | GroupSymbol;
    export interface LeafSymbol {
        kind: "leaf";
    }
    export interface ContainerSymbol {
        kind: "container";
        args: Expr[];
    }

    export interface GroupableSymbol {
        kind: "groupable";
        symbols: Symbol[];
    }
    export interface VarSymbol extends LeafSymbol {
        type: "var-symbol";
        name: string;
        indexStr: string;
    }

    export interface OpSymbol extends LeafSymbol {
        type: "op-symbol";
        op: "+" | "-" | "*" | "/" | "×";
    }

    export interface NumberSymbol extends LeafSymbol {
        type: "number-symbol";
        value: string;
    }

    export interface FloatSymbol extends LeafSymbol {
        type: "float-symbol";
        value: string;
    }

    export interface HalfSymbol extends LeafSymbol {
        type: "half-symbol";
    }

    export interface GroupSymbol extends GroupableSymbol {
        type: "group-symbol";
    }

    export interface FuncSymbol extends ContainerSymbol {
        type: "func-symbol";
        name: "power" | "mul" | "rational";
    }

    export interface MatrixSymbol extends ContainerSymbol {
        type: "func-symbol";
        name: "matrix";
        row: number;
        column: number;
    }

    export interface GenericFuncSymbol extends ContainerSymbol {
        type: "generic-func-symbol";
        name: string;
    }
}