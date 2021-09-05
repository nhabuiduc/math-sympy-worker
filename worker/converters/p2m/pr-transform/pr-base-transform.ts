import { P2Pr } from "../p2pr";
import { PrTransformMap } from "./pr-transform-map";

export abstract class PrBaseTransform<TContext extends object = {}> implements P2Pr.IPrTransform {
    private transformObjs: PrTransformMap<TContext>[];

    transform(symbol: P2Pr.Symbol, ops: P2Pr.TransformOptions): P2Pr.Symbol {
        if (!this.transformObjs) {
            this.transformObjs = this.initTransform();
        }
        const ctx = this.initCtx();

        return this.transformObjs.reduce((prev, cur) => cur.map(prev, ops, ctx), symbol)
    }

    protected makeTransform(transform: (s: Symbol, ctx: TContext) => Symbol, enabled: (ops: P2Pr.TransformOptions, ctx: TContext) => boolean): PrTransformMap<TContext> {
        return new PrTransformMap<TContext>(transform, enabled);
    }

    protected abstract initTransform(): PrTransformMap<TContext>[];
    protected abstract initCtx(): TContext;

}

type Symbol = P2Pr.Symbol;