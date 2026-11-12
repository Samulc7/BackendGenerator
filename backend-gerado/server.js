
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const usuarioRoutes = require("./routes/usuario");
const usoiaRoutes = require("./routes/usoia");


app.get("/", (req, res) => {
    res.json({ mensagem: "Backend gerado funcionando!" });
});

app.use("/api/usuario", usuarioRoutes);
app.use("/api/usoia", usoiaRoutes);


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
