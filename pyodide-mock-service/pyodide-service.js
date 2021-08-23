(async function main() {
  let lastStdout = "";
  let pyodide_pkg = await import("pyodide/pyodide.js");
  console.log(pyodide_pkg);
  let pyodide = await pyodide_pkg.loadPyodide({
    // indexURL: "https://cdn.jsdelivr.net/pyodide/v0.17.0/full/",
    indexURL: "/Users/ducnhabui/Downloads/pyodide",
    stdout: (text) => {
      lastStdout += text + "\n";
      // console.log(text);
      console.log(lastStdout);
    },
    stderr: (text) => {
      console.error("Error occurred in python");
      console.error(text);
    }
  });

  await pyodide.loadPackage("sympy", (msg) => { console.log(msg) }, (msg) => { console.error(msg) })

  const express = require('express');
  const bodyParser = require('body-parser');
  var cors = require('cors');

  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cors());

  const port = process.env.PYODIDE_SERVICE_PORT || 4892;
  // importScripts("http://localhost:3000/dynamic-resources/pyodide.js");

  app.post('/run', async (req, res) => {
    lastStdout = "";
    const code = req.body.code;
    console.log(code);
    try {
      const proxy = await pyodide.runPythonAsync(code || "dic={}\ndic\njson.dumps(dic)");
      // await delay(300);
      if (proxy) {
        console.log(proxy.toString())
        res.send({
          type: "ok",
          json: proxy.toString(),
          log: lastStdout
        });
        // console.log(lastStdout);
      } else {
        res.send({ type: "error", errorMessage: "No output from service", log: lastStdout });
      }
      lastStdout = "";
    } catch (e) {
      console.error("Error catched!!!");
      console.error(e);
      res.send({ type: "error", errorMessage: e.message, log: lastStdout });
      lastStdout = "";
    }
  })

  app.post('/raw-run', async (req, res) => {
    lastStdout = "";
    const code = req.body.code;
    console.log(code);
    try {
      const proxy = await pyodide.runPythonAsync(code || "dic={}\ndic\njson.dumps(dic)");
      if (proxy) {
        console.log(proxy.toString())
        res.send(proxy.toString());
      } else {
        res.send(lastStdout || "");
        lastStdout = "";
      }
    } catch (e) {
      console.error("Error catched!!!");
      console.error(e);
      res.send(lastStdout + "\n" + e.message);
      lastStdout = "";
    }
  })

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
})();

// function delay(wait) {
//   return new Promise((rs) => {
//     setTimeout(rs, wait);
//   })
// }

// function convertMapToObj(map) {
//   const obj = {};
//   map.forEach((vl, key) => {
//     if (vl instanceof Array) {
//       obj[key] = vl.map(data => {
//         if (data instanceof Map) {
//           return convertMapToObj(data);
//         }
//         return data;
//       })
//       return;
//     }

//     if (vl instanceof Map) {
//       obj[key] = convertMapToObj(vl);
//       return;
//     }

//     obj[key] = vl;
//   })
//   return obj
// }