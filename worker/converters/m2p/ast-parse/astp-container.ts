import { symbolIndexSerialize } from "../../../symbol-index-serializer";
import { M2T } from "../m2t";
import { T2A } from "../t2a";
import { AstpNs } from "./astp-ns";

export class AstpContainer implements AstpNs.AstpUnit<M2T.Token> {
    constructor(private astpMain: AstpNs.AstpMain) {

    }

    parse(token: M2T.ContainerToken, _ctx: AstpNs.RunCtx): AstpNs.ParsedUnit {
        switch (token.groupType) {
            case "power-index": {
                return this.handlePowerIndexGroup(token);
            }
            case "frac": {
                const cur: Symbol = {
                    type: "func-symbol",
                    kind: "container",
                    name: "mul",
                    args: [this.astpMain.toAst(token.enumerator), this.inverse(this.astpMain.toAst(token.denominator))]
                }
                return cur;
            }
            case "sqrt": {
                const root: Expr = token.root.length <= 0 ? { symbols: [{ type: "half-symbol", kind: "leaf" }] } : this.inverse(this.astpMain.toAst(token.root));
                return [{
                    type: "func-symbol",
                    kind: "container",
                    name: "power",
                    args: [this.astpMain.toAst(token.base), root]
                }]
            }
            case "matrix": {
                const nOfRow = token.cells.length;
                const nOfCol = token.cells[0].length;
                const exprs = new Array<Expr>(nOfRow * nOfCol);
                let cellIdx = 0;
                for (const row of token.cells) {
                    for (const cell of row) {
                        exprs[cellIdx] = this.astpMain.toAst(cell.tokens);
                        cellIdx++;
                    }
                }
                return [{
                    type: "func-symbol",
                    kind: "container",
                    name: "matrix",
                    
                    row: nOfRow,
                    column: nOfCol,
                    args: exprs,
                }]
            }
        }
        // throw new Error("Unsupported group:" + token.groupType);
    }



    private inverse(expr: Expr): Expr {
        return {
            symbols: [{
                type: "func-symbol",
                kind: "container",
                name: "power",
                args: [expr, this.astpMain.toAst([{ type: "number-token", text: "-1" }])]
            }]
        }
    }

    private handlePowerIndexGroup(token: M2T.PowerIndexContainerToken): AstpNs.MergedParsedUnit {

        return {
            type: "merged-parsed-unit",
            parseType: "sqrt",
            info: () => {
                const power = token.power?.length > 0 ? this.astpMain.toAst(token.power) : undefined;
                const index = token.index?.length > 0 ? this.astpMain.toAst(token.index) : undefined;
                return { power, index }
            },
            merge: (prev: Symbol[]) => {
                if (prev.length <= 0) {
                    throw new Error("Missing base for power");
                }

                const powerExp = this.astpMain.toAst(token.power);
                const prevSymbol = prev[prev.length - 1];
                if (token.indexRaw && prevSymbol.type == "var-symbol") {
                    prevSymbol.indexStr = symbolIndexSerialize.toJson({ lines: token.indexRaw.lines });
                }

                if (powerExp.symbols.length <= 0) {
                    return prev;
                }

                const head = prev.slice(0, prev.length - 1);

                const tail: Symbol[] = [{
                    type: "func-symbol",
                    kind: "container",
                    name: "power",
                    args: [
                        { symbols: [prevSymbol] },
                        powerExp
                    ]
                }];
                return head.concat(tail)
            }
        }
    }
}

// type Token = M2T.Token;
type Symbol = T2A.Symbol;
type Expr = T2A.Expr;