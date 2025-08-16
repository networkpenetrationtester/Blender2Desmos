// ==UserScript==
// @name         Blender2Desmos
// @namespace    http://tampermonkey.net/
// @version      2025-06-07
// @description  try to take over the world!
// @author       ::>^Neo^<::
// @match        https://www.desmos.com/3d
// @icon         https://www.desmos.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    var Calc = window.Calc, mesh_expressions = [], io = {}, socket = {},
        domain = "localhost";
    loadSocketIO();

    function clearMesh() {
        for (let id of mesh_expressions) {
            Calc.removeExpression({ "id": id });
        }
        mesh_expressions = [];
    }

    function update() {
        socket.emit("Awake");
        setSettings();
    }

    function setColors() {
        let state = Calc.getState();
        let color = "C_{olor}";
        state.expressions.list = state.expressions.list.map(
            (expression) => ({ ...expression, colorLatex: color })
        );
        Calc.setState(state);
    }

    function setSettings() {
        Calc.setExpressions([
            {
                "id": "Color_Folder",
                "type": "folder",
                "title": "Color"
            },
            //figure out how to nest items in folders lmao
            {
                "id": "Color",
                "latex": "C_{olor}=\\operatorname{hsv}\\left(H,S,V\\right)",
            },
            {
                "id": "H_Angle",
                "latex": "\\theta_{C}=0",
                "sliderBounds": {
                    "min": "0",
                    "max": "\\frac{\\pi}{2}"
                },
                "playing": false
            },
            {
                "id": "H",
                "latex": "H=360\\cos\\left(\\theta_{C}\\right)",
                "parametricDomain": {
                    "min": "0",
                    "max": "1"
                },
                "sliderBounds": {
                    "min": "0",
                    "max": "360"
                }
            },
            {
                "id": "S",
                "latex": "S=1",
                "parametricDomain": {
                    "min": "0",
                    "max": "1"
                },
                "sliderBounds": {
                    "min": "0",
                    "max": "1",
                    "step": "0.01"
                },
                "playing": false
            },
            {
                "id": "V",
                "latex": "V=1",
                "parametricDomain": {
                    "min": "0",
                    "max": "1"
                },
                "sliderBounds": {
                    "min": "0",
                    "max": "1",
                    "step": "0.01"
                },
            },
            {
                "id": "width",
                "type": "expression",
                "latex": "W_{idth}=0.1",
                "color": "#00ff00",
                "sliderBounds": {
                    "min": "0.0",
                    "max": "10.0"
                }
            },
            {
                "id": "Vertices_Folder",
                "type": "folder",
                "title": "Vertices"
            }
            //figure out how to nest items in folders lmao
        ]);
    }

    function setup() {
        socket = window.io(`http://${domain}:5002`);
        socket.on("Desmos", (...args) => {
            try {
                Calc.setBlank();
                setSettings();
                args = JSON.parse(args);
                //eventually process multiple objects possibly?
                if (args.vertices) {
                    Calc.setExpression({
                        "id": "vertices",
                        "type": "expression",
                        "latex": `v = [${args.vertices.join(",")}]`,
                        "hidden": false,
                        "pointSize": "W_{idth}",
                        "color": "#000000",
                    });
                    mesh_expressions.push("vertices");
                }
                for (let i in args.faces) {
                    Calc.setExpression({
                        "id": `face-${i}`,
                        "type": "expression",
                        "latex": args.faces[i],
                        "color": "#00ff00",
                        "points": false,
                        "lines": true,
                        "lineWidth": "W_{idth}"
                    });
                    mesh_expressions.push(`face-${i}`);
                }
                setColors();
            } catch (e) { console.error(e) }
        });
        update();
    }

    async function waitForIO() {
        while (!window.io) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        setup();
    }

    async function loadSocketIO() {
        let script = document.createElement("script");
        script.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
        script.integrity = "sha384-mkQ3/7FUtcGyoppY6bz/PORYoGqOl7/aSUMn2ymDOJcapfS6PHqxhRTMh1RR0Q6+";
        script.crossOrigin = "anonymous";
        document.body.appendChild(script);
        if (await (await fetch(`http://${domain}:5002/ping`)).status === 200) {
            waitForIO();
        }
        return;
    }
})();