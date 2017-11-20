import fs from 'fs';
import path from 'path';
import Game from './Game';
import Drawing from '../../client/pictionary/Drawing';
import type User from '../room/User';

const colors = ['#A6658F', '#D9A19C', '#9AC49F', '#1D797D'];

const icons = fs
  .readdirSync('./public/player-icons')
  .map(name => path.join('/player-icons/', name));

function select(items) {
  return items[Math.floor(items.length * Math.random())];
}

export default class Pictionary extends Game {
  constructor(room) {
    super(room);
    this.drawing = new Drawing();
  }

  getState() {
    return {
      game: 'Pictionary',
      strokes: this.drawing.strokes,
      strokeOrder: this.drawing.strokeOrder,
    };
  }

  processClientEvent(user_id, untyped_event) {
    let event = this.drawing.castEvent(untyped_event);
    if (event) {
      this.drawing.ingestEvent(event);
      this.room.broadcast(event, { exclude: [user_id] });
    }
  }

  getInitialUserData(user: User) {
    return {
      color: select(colors),
      icon: select(icons),
    };
  }
}
