import { M2T } from "./m2t";
import { T2A } from "./t2a";
import { A2P } from "./a2p";
import { PGen } from "./p-gen";
import { CasEngineNs } from "../../../worker-main-shared/cas-engine-ns";

export class M2P {
    private m2t: M2T;
    private t2a: T2A;
    private a2p: A2P;
    private pGen: PGen;

    constructor(constantTextFuncSet: Set<string>) {
        this.m2t = new M2T(constantTextFuncSet);
        this.t2a = new T2A(constantTextFuncSet);
        this.a2p = new A2P();
        this.pGen = new PGen();
    }

    convert(action: CasEngineNs.RunAction): string {
        return this.handleSubstituteAction(action);
    }

    private handleSubstituteAction(action: CasEngineNs.SubstituteRunAction): string {
        const { pythonCode: mainCode, symbolNames: mainSymbols } = this.toPythonExprCode(action.expr);
        const { pythonCode: fromCode, symbolNames: fromSymbols } = this.toPythonExprCode(action.from);
        const { pythonCode: toCode, symbolNames: toSymbols } = this.toPythonExprCode(action.to);
        const allSymbols = this.mergeSymbolMaps(mainSymbols, fromSymbols, toSymbols);
        return this.pGen.toCode(mainCode, "subs", allSymbols, fromCode, toCode);
    }

    private toPythonExprCode(blocks: BlockModel[]): { pythonCode: string, symbolNames: Map<string, string> } {
        const tokens = this.m2t.parse(blocks);
        const expr = this.t2a.toAst(tokens);
        const symbolNames = this.t2a.extractAllVarNames(expr);
        return {
            pythonCode: this.a2p.convert(expr),
            symbolNames: symbolNames,
        };
    }

    private mergeSymbolMaps(...maps: Map<string, string>[]): Map<string, string> {
        const rs = new Map<string, string>();
        return maps.reduce((prev, c) => {
            c.forEach((vl, key) => {
                prev.set(key, vl);
            });
            return prev;
        }, rs)
    }
}