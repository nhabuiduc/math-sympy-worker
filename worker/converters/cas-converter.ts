import { CasEngineNs } from "@sympy-worker/cas-engine-ns";
import { P2M } from "./p2m/p2m";
import { M2P } from "./m2p/m2p";
import { PyodideNs } from "../pyodide-models";
import { P2Pr } from "./p2m/p2pr";

export class CasConverter {
    private p2m: P2M;
    private m2p: M2P;
    constructor(constantTextFuncSet: Set<string>) {
        this.p2m = new P2M(constantTextFuncSet);
        this.m2p = new M2P(constantTextFuncSet);
    }

    toPythonCode(action: CasEngineNs.RunAction): string {
        return this.m2p.convert(action);
    }

    toModel(data: PyodideNs.DummyPythonRunnerResult, ops?: P2Pr.TransformOptions): BlockModel[] {
        return this.p2m.convert(data, ops);
    }

}
