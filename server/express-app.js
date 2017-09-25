import express from "express";

let app = express();
app.use(express.static("public"));

export default app;
