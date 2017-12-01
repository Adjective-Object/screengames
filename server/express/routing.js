import express from 'express';
import Handlebars from 'handlebars';
import fs from 'mz/fs';

let app = express();
app.use(express.static('public'));

let pictionary_assets = null;
async function loadPictionaryClientAssets() {
  if (pictionary_assets !== null) return pictionary_assets;
  let [
    pictionary_client_src,
    pictionary_board_src,
    icon_pen,
    icon_pan,
    icon_clear_canvas,
    icon_center_canvas,
    icon_start_fullscreen,
    icon_stop_fullscreen,
    icon_undo,
  ] = await Promise.all([
    fs.readFile('client/template/pictionary.handlebars', 'utf-8'),
    fs.readFile('client/template/pictionary-board.handlebars', 'utf-8'),
    fs.readFile('client/assets/img/ic_create_white_24px.svg', 'utf-8'),
    fs.readFile('client/assets/img/ic_pan_tool_white_24px.svg', 'utf-8'),
    fs.readFile('client/assets/img/ic_layers_clear_white_24px.svg', 'utf-8'),
    fs.readFile(
      'client/assets/img/ic_center_focus_weak_white_24px.svg',
      'utf-8',
    ),
    fs.readFile('client/assets/img/ic_fullscreen_white_24px.svg', 'utf-8'),
    fs.readFile('client/assets/img/ic_fullscreen_exit_white_24px.svg', 'utf-8'),
    // TODO (adjective-object) change this to an actual undo button when
    // I'm back on network access
    fs.readFile('client/assets/img/ic_fullscreen_exit_white_24px.svg', 'utf-8'),
  ]);
  pictionary_assets = {
    pictionary_client_template: Handlebars.compile(pictionary_client_src),
    pictionary_board_template: Handlebars.compile(pictionary_board_src),
    icon_pen,
    icon_pan,
    icon_clear_canvas,
    icon_center_canvas,
    icon_start_fullscreen,
    icon_stop_fullscreen,
    icon_undo,
  };
  return pictionary_assets;
}

app.get('/', (req, res) => {
  res.redirect('/r/default');
});
app.get('/r/:roomId', async (req, res) => {
  try {
    let assets = await loadPictionaryClientAssets();
    res.send(assets.pictionary_client_template(assets));
  } catch (e) {
    res.status(500);
  }
});
app.get('/r/:roomId/board', async (req, res) => {
  try {
    let assets = await loadPictionaryClientAssets();
    res.send(assets.pictionary_board_template(assets));
  } catch (e) {
    res.status(500);
  }
});

export default app;
