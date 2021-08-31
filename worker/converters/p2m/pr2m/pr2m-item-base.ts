import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";
import { GenericFunc } from "./generic-func";
import { Pr2MCommon } from "./pr2m-common";

export abstract class Pr2MItemBase {
    constructor(protected main: {
        convert(obj: P2Pr.Symbol): Pr2M.CResult;
        convertMaps(ss: Symbol[], level?: number): BlockModel[][];
        prCommon: Pr2MCommon;
        genericFunc: GenericFunc;
    }) {

    }

    protected c(s: Symbol): Pr2M.CResult {
        return this.main.convert(s);
    }
}

type Symbol = P2Pr.Symbol;