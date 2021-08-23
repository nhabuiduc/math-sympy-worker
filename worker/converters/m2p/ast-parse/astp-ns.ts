import type { T2A } from "../t2a";
import type { M2T } from "../m2t";

type Symbol = T2A.Symbol;
type Expr = T2A.Expr;
export namespace AstpNs {
    export type ParsedUnit = Symbol | Symbol[] | MergedParsedUnit;

    export type MergedParsedUnit = SqrtMergedParsedUnit;

    export interface SqrtMergedParsedUnit {
        type: "merged-parsed-unit";
        parseType: "sqrt";
        info(): { power: Expr | undefined, index: Expr | undefined }
        merge(symbols: Symbol[]): Symbol[];
    }

    export interface RunCtx {
        // tokens: M2T.Token[];
        // tokenIdx: number;
        current(): M2T.Token;
        advanceToken(): M2T.Token;
        tryAdvanceToken(): M2T.Token | undefined;
        isNextAvailable(): boolean;
    }

    export interface AstpUnit<T extends M2T.Token> {
        parse(token: T, ctx: RunCtx): ParsedUnit;
    }

    export interface AstpMain extends AstpUnit<M2T.Token> {
        toAst(tokens: M2T.Token[]): T2A.Expr;
    }

}

