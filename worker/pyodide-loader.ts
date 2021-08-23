import { PyodideNs } from "./pyodide-models";
import { defineAllSetupFuncs } from "./python-code";

interface LoadPyodideConfig {
    fullStdLib: boolean,
    indexURL: string
}

// declare 
// declare const pyodide: PyodideNs.Pyodide;


// ModuleInit: PyodideModule
interface PyodideModule {
    setStatus(text: string): void;
}

interface ExtendedWindow extends Window {
    __pyodide_module?: PyodideModule;
    loadPyodide(config: LoadPyodideConfig): Promise<PyodideNs.Pyodide>;
}

declare const self: ExtendedWindow;


export class PyodideLoader implements PyodideNs.IPyodideLoader {
    async load(cb: (loaded: number, total: number) => void): Promise<PyodideNs.PythonRunner> {
        let lastRaiseProgressingTime = Date.now();
        const startTime = Date.now();
        // importScripts("http://localhost:3000/dynamic-resources/pyodide.js");
        importScripts("https://cdn.jsdelivr.net/pyodide/v0.18.0/full/pyodide.js");
        const pyodidePromise = self.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.0/full/",
            fullStdLib: true,
        });

        self.__pyodide_module["setStatus"] = function (text: string) {
            if (Date.now() - lastRaiseProgressingTime < 100) {
                // console.log("ignore, to soon");
                return;
            }

            const loadingInfoMatched = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
            if (loadingInfoMatched) {
                console.log(text);
                cb(parseInt(loadingInfoMatched[2]), parseInt(loadingInfoMatched[4]));
            }

            lastRaiseProgressingTime = Date.now();

        }

        const pyodide = await pyodidePromise;
        await pyodide.loadPackage("sympy", (msg) => { console.log(msg) }, (msg) => { console.error(msg) })
        pyodide.runPython(defineAllSetupFuncs);

        console.log(`time take: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
        return new PythonRunner(pyodide);
        // Pyodide is now ready to use...
        // console.log(pyodide.runPython(`
        //   import sys
        //   sys.version
        // `));
    }
}

class PythonRunner implements PyodideNs.PythonRunner {
    constructor(private pyodide: PyodideNs.Pyodide) {

    }
    runRaw(code: string): Promise<string> {
        try {
            const rs = this.pyodide.runPython(code);
            return Promise.resolve(rs.toString())
        } catch (e) {
            Promise.resolve(e.message);
        }

    }

    run(code: string): Promise<[PyodideNs.DummyPythonRunnerResult, string]> {
        const rs = this.pyodide.runPython(code);
        const obj: PyodideNs.DummyPythonRunnerResult = JSON.parse(rs.toString());
        return Promise.resolve([obj, ""]);
    }

}


