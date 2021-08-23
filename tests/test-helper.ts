import { CasEngineProcess } from "@sympy-worker/cas-engine-process";
declare const casEngineProcess: CasEngineProcess;


class TestHelper {
    async prepare(statement: string): Promise<void> {
        await casEngineProcess.processRaw(statement, false);
    }

    async run(statement: string) {
        const code = `
expr=${statement}
rootDic = ___mcSympyExprDump(expr)
json.dumps(rootDic)
`;
        const [, blocks] = await casEngineProcess.processRaw(code, true);
        let blocksText = "";
        if (blocks) {
            blocksText = this.blocksToText(blocks);
        }
        return blocksText
    }

    blocksToText(blocks: BlockModel[]): string {
        return blocks.map(b => {
            if (b.type == "composite") {
                const elements = Object.keys((b as CompositeBlockModel).elements)
                    .map(c => this.blocksToText((b as CompositeBlockModel).elements[c].lines[0].blocks))
                    .join(",");
                return `[${this.reduceFuncName(b.text.substr(1))},${elements}${this.styleToText(b.style)}]`
            }
            return `[${b.text}${this.styleToText(b.style)}]`;
        }).join("");
    }

    private styleToText(bs: BlockStyle): string {
        if (!bs) {
            return "";
        }

        return `,${Object.keys(bs).map(k => bs[k]).join("|")}`
    }

    private reduceFuncName(name: string): string {
        return commonFuncReducedMap[name] || name;
    }

}

const commonFuncReducedMap = {
    "power-index": "pow"
}

export const testHelper = new TestHelper();