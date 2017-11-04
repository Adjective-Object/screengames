// import bunyan from 'bunyan';

// TODO
// const bunyan_logger = bunyan.createLogger(
//   typeof window === 'undefined'
//     ? // Node-like environment. Log to file
//       {
//         name: 'screengames',
//         streams: [
//           {
//             level: 'debug',
//             path: './logs/debug.log',
//           },
//           {
//             level: 'info',
//             path: './logs/info.log',
//           },
//           {
//             level: 'warn',
//             path: './logs/warn.log',
//           },
//           {
//             level: 'error',
//             path: './logs/error.log',
//           },
//         ],
//       }
//     : {
//         name: 'screengames',
//       },
// );

class WrappedLogger {
  constructor(logger) {
    this.logger = logger;
  }
  _thing(fn, args) {
    let evt = args.length > 0 ? args[0] : null;
    if (evt && evt.type && evt.message) {
      console.log(evt.type, '\t', evt.message);
      if (fn) fn.call(args);
    } else {
      console.log.apply(console.log, args);
      if (fn) fn.call(args);
    }
  }
  info() {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
  debug() {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
  warn() {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
  error() {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
}

export default new WrappedLogger();
