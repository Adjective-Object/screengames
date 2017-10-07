import express from "express";
import Handlebars from "handlebars";
import fs from "fs";

let app = express();
app.use(express.static("public"));

let pictionary_src = fs.readFileSync(
  "client/template/pictionary.handlebars",
  "utf-8"
);
let pictionary_template = Handlebars.compile(pictionary_src);

let icon_pen = fs.readFileSync(
  "client/assets/img/ic_create_white_24px.svg",
  "utf-8"
);
let icon_pan = fs.readFileSync(
  "client/assets/img/ic_pan_tool_white_24px.svg",
  "utf-8"
);
let icon_clear_canvas = fs.readFileSync(
  "client/assets/img/ic_layers_clear_white_24px.svg",
  "utf-8"
);
let icon_center_canvas = fs.readFileSync(
  "client/assets/img/ic_center_focus_weak_white_24px.svg",
  "utf-8"
);
let icon_start_fullscreen = fs.readFileSync(
  "client/assets/img/ic_fullscreen_white_24px.svg",
  "utf-8"
);
let icon_stop_fullscreen = fs.readFileSync(
  "client/assets/img/ic_fullscreen_exit_white_24px.svg",
  "utf-8"
);

app.get("/", (req, res) => {
  res.redirect("/r/default");
});
app.get("/r/:roomId", (req, res) => {
  res.send(
    pictionary_template({
      icon_pen,
      icon_pan,
      icon_clear_canvas,
      icon_center_canvas,
      icon_start_fullscreen,
      icon_stop_fullscreen
    })
  );
});

export default app;
