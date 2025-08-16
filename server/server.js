const fs = require("node:fs");
const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
var tmp = {vertices:[], faces:[], mode: ""};

async function LoadFromObj(filename) {
    tmp.vertices = [];
    tmp.faces = [];
    tmp.mode = "wireframe"
    let file = fs.readFileSync(filename, { encoding: "utf-8" });
    for (let line of file.split("\n")) {
        let parts = line.split(" ");
        switch (parts.shift()) {
            case "v":
                let coord = `(${parts.join(",")})`;
                tmp.vertices.push(coord);
                break;
            case "f":
                let vertices = parts.map((bundle) => {
                    return parseInt(bundle.split("/")[0]);
                });
                vertices.push(vertices[0]);
                vertices = vertices.map((indice) => {
                    return `v[${indice}]`;
                });
                tmp.faces.push(`[${vertices.join(",")}]`);
                break;
        }
    }
    console.log(`Sending newly generated graph data (from ${filename})...`);
    return;
}

async function LoadCached(filename) {
    let data = fs.readFileSync(filename, { encoding: "utf-8" });
    try {
        data = JSON.parse(data);
        tmp.vertices = data.vertices;
        tmp.faces = data.faces;
        tmp.mode = data.mode;
    } catch (e) {
        console.error(e);
    }
    console.log(`Sending cached graph data (from ${filename})...`);
    return;
}

app.use(cors());

app.get("/ping", (req, res) => {
    res.sendStatus(200);
})

app.get("/", (req, res) => {
    res.sendFile(__dirname + "\\www\\index.html");
});

io.on("connection", async (socket) => {
    console.log("connection opened.");
    socket.on("Blender", async (data) => {
        try {
            data.faces = data.faces.map((face) => {
                return face.map((indice) => {
                    return `v[${indice}]`;
                });
            })
            io.emit("Desmos", JSON.stringify({
                vertices: data.vertices,
                faces: data.faces,
                mode: data.mode
            }));
			let path = `${__dirname}\\cache\\object.json`;
            fs.writeFileSync(path, JSON.stringify(data), { encoding: "utf-8" });
            console.log(`BLENDER -> DESMOS Sending graph data & Saving meshdata to ${path}`)
        } catch (e) {
            console.error(e);
        }
    });

    socket.on("Desmos", async (data) => {
        try {
            //future implementation
            console.log(data)
        } catch (e) {
            console.error(e)
        }
    });

    socket.on("Awake", async () => {
        await LoadCached(`${__dirname}\\cache\\object.json`);
        io.emit("Desmos", JSON.stringify({
            vertices: tmp.vertices,
            faces: tmp.faces,
            mode: tmp.mode
        }));
    });
});

server.listen(5002, () => {
    console.log("listening on :5002");
});