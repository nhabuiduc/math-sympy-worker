import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class Float {
    constructor() {

    }

    convert(obj: P2Pr.Float): Pr2M.CResult {
        return { blocks: [blockBd.textBlock(obj.value)], prMinusSign: obj.value[0] == "-" }
    }
}