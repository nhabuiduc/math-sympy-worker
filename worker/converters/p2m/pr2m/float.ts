import { blockBd } from "../block-bd";
import { P2Pr } from "../p2pr";
import { Pr2M } from "../pr2m";

export class Float {
    constructor(private main: { convert(obj: P2Pr.Symbol, level?: number): Pr2M.CResult }) {

    }

    convert(obj: P2Pr.Float, level: number): Pr2M.CResult {
        if (typeof obj.value == "string") {
            return { blocks: [blockBd.textBlock(obj.value)] }
        }

        return this.main.convert(obj.value, level);

    }
}