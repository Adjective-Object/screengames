import bunyan from 'bunyan';

// TODO
const bunyan_logger = bunyan.createLogger(
  typeof window === 'undefined'
    ? // Node-like environment. Log to file
      {
        name: 'screengames',
        streams: [
          {
            level: 'debug',
            path: './logs/debug.log',
          },
          {
            level: 'info',
            path: './logs/info.log',
          },
          {
            level: 'warn',
            path: './logs/warn.log',
          },
          {
            level: 'error',
            path: './logs/error.log',
          },
        ],
      }
    : {
        name: 'screengames',
      },
);

class WrappedLogger {
  constructor(logger) {
    this.logger = logger;
  }
  _thing(fn, args) {
    let evt = args.length > 0 ? args[0] : null;
    if (evt && evt.type && evt.message) {
      console.log(evt.type, '\t', evt.message);
      fn.call(args);
    } else {
      console.log.apply(console.log, args);
      fn.call(args);
    }
  }
  info() {
    this._thing(this.logger.info.bind(this.logger), arguments);
  }
  debug() {
    this._thing(this.logger.debug.bind(this.logger), arguments);
  }
  warn() {
    this._thing(this.logger.warn.bind(this.logger), arguments);
  }
  error() {
    this._thing(this.logger.error.bind(this.logger), arguments);
  }
}

export default new WrappedLogger(bunyan_logger);
