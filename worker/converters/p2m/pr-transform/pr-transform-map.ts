import { P2Pr } from "../p2pr";

export class PrTransformMap<TContext extends object> {
    constructor(
        private transform: (s: Symbol, ctx: TContext) => Symbol,
        private enabled: (ops: P2Pr.TransformOptions, ctx: TContext) => boolean) {

    }

    map(main: Symbol, ops: P2Pr.TransformOptions, ctx: TContext): Symbol {
        if (!this.enabled(ops, ctx)) {

            return main;
        }

        return this.innerMap(main, ctx);
    }

    private innerMap(main: Symbol, ctx: TContext): Symbol {
        let newMain = main;
        switch (main.type) {
            case "GenericFunc":
            case "Derivative":
            case "Matrix":
            case "OverSymbol":
            case "Piecewise":
            case "Product":
            case "Sum":
            case "Limit":
            case "Integral":
            case "Binomial":
            case "Relational":
            case "Subs":
            case "Order":
            case "Sqrt":
            case "Frac":
            case "PrescriptIdx":
            case "Index":
            case "Pow":
            case "Mul":
            case "VarList":
            case "Add":
            case "UnaryOp":
            case "BinaryOp": {
                let children = main.symbols;
                for (let idx = 0; idx < main.symbols.length; idx++) {
                    const cur = main.symbols[idx];
                    const rs = this.innerMap(cur, ctx);
                    if (rs && rs != cur) {
                        children = (children == main.symbols) ? main.symbols.slice() : children;
                        children[idx] = rs;
                    }
                }
                if (children != main.symbols) {
                    newMain = { ...main, symbols: children };
                }
                if (newMain.type == "GenericFunc" && typeof newMain.func != "string") {
                    const newFunc = this.innerMap(newMain.func, ctx);
                    if (newFunc && newFunc != newMain.func) {
                        newMain = { ...newMain, func: newFunc }
                    }
                }

                break;
            }

            case "Quantity":
            case "Var":
            case "JsonData": {
                newMain = main;
                break;
            }
            default: {
                assertUnreachable(main);
            }
        }

        return this.transform(newMain, ctx) || newMain;
    }
}


function assertUnreachable(_x: never): void {
    /**should not throw exception, as reducer will come here :() or other cases */
    // throw new Error("Didn't expect to get here");
}

type Symbol = P2Pr.Symbol;
