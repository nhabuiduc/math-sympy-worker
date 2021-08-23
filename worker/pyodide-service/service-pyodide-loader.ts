import { PyodideNs } from "../pyodide-models";
import { defineAllSetupFuncs } from "../python-code";

export class ServicePyodideLoader implements PyodideNs.IPyodideLoader {
    async load(_cb: (loaded: number, total: number) => void, port?: number): Promise<PyodideNs.PythonRunner> {
        return Promise.resolve(new PyodideRunner(port))
    }
}

class PyodideRunner implements PyodideNs.PythonRunner {
    constructor(private servicePort = 4892) {

    }
    run(code: string): Promise<[PyodideNs.DummyPythonRunnerResult, string]> {
        code = defineAllSetupFuncs + "\n" + code;
        const request = { code };
        return this.runRequest("run", JSON.stringify(request), "json").then(({ json, log }) => {
            return [JSON.parse(json), log + "\n" + json]
        });
    }

    runRaw(code: string): Promise<string> {
        const request = { code };
        return this.runRequest("raw-run", JSON.stringify(request), "text").catch(e => {
            console.error(e);
            return e.message;
        });
    }

    private runRequest(url: "run" | "raw-run", body: string, responseType: "text" | "json") {
        return new Promise<any>((resolve, reject) => {
            var xhr = new XMLHttpRequest();

            xhr.open('POST', `http://localhost:${this.servicePort}/` + url, true);
            xhr.setRequestHeader("Content-Type", "application/json")
            xhr.responseType = responseType;

            xhr.onerror = function (event) {
                console.error(event);
                reject(new Error("NetworkError for: "));
            }
            xhr.onload = function (_event) {
                if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
                    var packageData = xhr.response;
                    if (packageData && packageData.type == "error") {
                        reject(new Error(packageData.log + "\n" + packageData.errorMessage));
                        return;
                    }
                    resolve(packageData as any);
                } else {
                    reject(new Error(xhr.statusText + " : " + xhr.responseURL));
                }
            };

            xhr.send(body);
        })
    }
}

