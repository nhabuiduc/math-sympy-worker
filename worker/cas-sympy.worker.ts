import { PyodideLoader } from "./pyodide-loader";
import { ServicePyodideLoader } from "./pyodide-service/service-pyodide-loader";
import { CasMd } from "./cas-models";
import { CasEngineProcess } from "./cas-engine-process";
import { PyodideNs } from "./pyodide-models";

interface ExtendedSelf extends Window {
    postMessage(response: CasMd.WorkerReponse): void;
}

declare const self: ExtendedSelf;

const loader: PyodideNs.IPyodideLoader = 1 ? new ServicePyodideLoader() : new PyodideLoader();
let casEngineProcess: CasEngineProcess;

loader.load((loaded, total) => {
    self.postMessage({ type: "init-progress-response", loaded, total });
}).then((pyodide) => {
    self.onmessage = (ev: MessageEvent<CasMd.WorkerRequest>) => {
        const data = ev.data;
        switch (data.type) {
            case "run-request": {
                casEngineProcess.process(data.action, (log: string) => {
                    self.postMessage({ type: "run-log-response", log });
                }).then((rs) => {
                    self.postMessage({ type: "run-response", blocks: rs });
                }).catch((e: Error) => {
                    console.error(e);
                    self.postMessage({ type: "run-response-error", message: e.message });
                });
                break;
            }
            case "run-raw-request": {
                casEngineProcess.processRaw(data.code, data.dump).then(rs => {
                    self.postMessage({ type: "run-raw-command-response", message: rs });
                }).catch((e: Error) => {
                    console.error(e);
                    self.postMessage({ type: "run-raw-command-response", message: [e.message, undefined] });
                });
                break;
            }
            case "set-ctx-request": {
                casEngineProcess = new CasEngineProcess(pyodide, data.ctx);
                self.postMessage({ type: "init-ctx-done-response" });
                break;
            }
        }
    }

    self.postMessage({ type: "init-done-response" });
});