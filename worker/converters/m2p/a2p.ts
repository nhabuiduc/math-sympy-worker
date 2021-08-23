import { astpCommon } from "./ast-parse/astp-common";
import type { T2A } from "./t2a";
import { mcFuncToSympyMap } from "../mapping/generic-func-map";

export class A2P {
    convert(expr: T2A.Expr): string {
        return this.convertSymbols(expr.symbols);
    }

    private opToSstr(s: T2A.OpSymbol): string {
        switch (s.op) {
            case "*":
            case "/":
            case "-":
            case "+": {
                return s.op;
            }
            case "×": {
                return "*"
            }
        }
        throw new Error("Unsupported op:" + s.op);
    }

    private convertSymbols(symbols: T2A.Symbol[]): string {
        const tokenStrs = symbols.map(symbol => {
            switch (symbol.type) {
                case "op-symbol": return this.opToSstr(symbol);
                case "number-symbol": return symbol.value;
                case "float-symbol": return symbol.value;
                case "half-symbol": return "core.numbers.Half()";
                case "var-symbol": {
                    return astpCommon.symbolName(symbol);
                }
                case "func-symbol": {
                    switch (symbol.name) {
                        case "power": {
                            return `core.power.Pow(${this.convert(symbol.args[0])},${this.convert(symbol.args[1])})`;
                        }
                        case "mul": {
                            return `core.power.Mul(${this.convert(symbol.args[0])},${this.convert(symbol.args[1])})`;
                        }
                        case "rational": {
                            return `core.numbers.Rational(${this.convert(symbol.args[0])},${this.convert(symbol.args[1])})`;
                        }
                        case "matrix": {
                            const cells: T2A.Expr[][] = new Array(symbol.row);
                            let cellIdx = 0;
                            for (let rIdx = 0; rIdx < symbol.row; rIdx++) {
                                const row = new Array(symbol.column);
                                cells[rIdx] = row;
                                for (let cIdx = 0; cIdx < symbol.column; cIdx++) {
                                    row[cIdx] = symbol.args[cellIdx];
                                    cellIdx++;
                                }
                            }

                            const argStr = `[${cells.map(row => `[${row.map(c => this.convert(c)).join(",")}]`).join(",")}]`;
                            return `Matrix(${argStr})`;
                        }
                    }
                }
                case "generic-func-symbol": {
                    const found = mcFuncToSympyMap[symbol.name];
                    if (found) {
                        return `${found}(${symbol.args.map(c => this.convert(c)).join(",")})`;
                    }
                    throw new Error("Unrecognized function:" + symbol.name);
                }
                case "group-symbol": {
                    return `(${this.convertSymbols(symbol.symbols)})`;
                }

            }
            return "";
        });
        return tokenStrs.join("");
    }
}
