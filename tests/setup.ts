
// var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var XMLHttpRequest = require("xhr2");
import { ServicePyodideLoader } from "@sympy-worker/pyodide-service/service-pyodide-loader";
import { CasEngineProcess } from "@sympy-worker/cas-engine-process";
import { defineAllSetupFuncs } from "@sympy-worker/python-code";

exports.mochaGlobalSetup = async function () {
    const loader = new ServicePyodideLoader();
    const pyodide = await loader.load(() => { }, 4893);
    console.log(pyodide.runRaw);
    const casEngineProcess = new CasEngineProcess(pyodide, { constantTextFuncs: [] })
    global.XMLHttpRequest = XMLHttpRequest;
    global.casEngineProcess = casEngineProcess;
    global.pyodide = pyodide;

    await casEngineProcess.processRaw(defineAllSetupFuncs, false);
    await casEngineProcess.processRaw(`
x, y, z, t, w, a, b, c, s, p = symbols('x y z t w a b c s p')
k, m, n = symbols('k m n', integer=True)
    `, false);
    // this.server = await startSomeServer({port: process.env.TEST_PORT});
    // console.log(`server running on port ${this.server.port}`);
    console.log("mocha setup run!")
};