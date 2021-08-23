import { CasEngineNs } from "./cas-engine-ns";
import { PyodideNs } from "./pyodide-models";
import { CasConverter } from "./converters/cas-converter";
import { CasMd } from "./cas-models";

export class CasEngineProcess {
    private casConverter: CasConverter;
    constructor(private pythonRunner: PyodideNs.PythonRunner, iniCtx: CasMd.WorkerInitCtx) {
        console.log(iniCtx);
        console.log(pythonRunner.runRaw);

        const constantTextFuncSet = new Set(iniCtx.constantTextFuncs);
        this.casConverter = new CasConverter(constantTextFuncSet);

    }

    async process(action: CasEngineNs.RunAction, logInfoCb: (log: string) => void): Promise<BlockModel[]> {
        const pyExp = this.casConverter.toPythonCode(action);
        console.log(pyExp);
        logInfoCb(`---------------Start Log------------\n${pyExp}`);

        return this.pythonRunner.run(pyExp).then(([rs, log]) => {
            logInfoCb(`${log}\n---------------End Log------------`);
            return this.casConverter.toModel(rs);
        })
    }

    async processRaw(code: string, dump: boolean): Promise<[string, BlockModel[]]> {
        console.log(this.pythonRunner.runRaw);
        return this.pythonRunner.runRaw(code).then(runResult => {
            if (!dump) {
                return [runResult, undefined];
            }

            const parsedOutput = this.tryParseJson(runResult);
            if (parsedOutput) {
                try {
                    return [runResult, this.casConverter.toModel(parsedOutput)]
                } catch (e) {
                    console.error(e);
                    return [`${runResult}"\n\n"Error: ${e.message}`, undefined];
                }
            }
            return [runResult + "\n\nError: Unable to parse and add result to Mathcha", undefined];
        });
    }

    private tryParseJson(text: string): any {
        try {
            return JSON.parse(text)
        } catch (e) {
            console.error(e);
            return undefined;
        }
    }

}
