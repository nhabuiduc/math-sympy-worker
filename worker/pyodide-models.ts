export namespace PyodideNs {
    export interface DummyPythonRunnerResult {

    }
    export interface PythonRunner {
        run(code: string): Promise<[DummyPythonRunnerResult, string]>;
        runRaw(code: string): Promise<string>;
    }

    export interface Pyodide {
        runPython(code: string): PyProxy;
        loadPackage(names: string | string[], messageCallback?: (msg: string) => void, errorCallback?: (msg: string) => void): Promise<void>;
    }

    export interface PyProxy {
        toString(): string;
        toJs(): Map<string, any>;
    }

    export interface IPyodideLoader {
        load(cb: (loaded: number, total: number) => void, extraData?: any): Promise<PyodideNs.PythonRunner>;
    }
}