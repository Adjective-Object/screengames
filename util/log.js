// @flow
import bunyan from 'bunyan';

type Environment = 'BROWSER' | 'JEST' | 'NODE' | 'UNKNOWN';

function determineEnvironment(): Environment {
  // $FlowFixMe ignored for environment checks
  if (typeof jest !== undefined) {
    return 'JEST';
    // $FlowFixMe ignored for environment checks
  } else if (typeof window !== undefined) {
    return 'BROWSER';
    // $FlowFixMe ignored for environment checks
  } else if (typeof __file !== undefined) {
    return 'NODE';
  }
  return 'UNKNOWN';
}

const environment = determineEnvironment();

let bunyan_logger = null;
if (environment === 'NODE') {
  bunyan_logger = bunyan.createLogger({
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
  });
}

type FlexibleFunction = (...args: any[]) => void;

class WrappedLogger {
  logger: bunyan.Logger | null;
  constructor(logger: bunyan.Logger | null) {
    this.logger = logger;
  }
  _thing(fn: FlexibleFunction | null, ...args: any[]) {
    let evt = args.length > 0 ? args[0] : null;
    if (evt && evt.type && evt.message) {
      // don't log in tests -- too high noise
      if (environment !== 'JEST') {
        console.log(evt.type, '\t', evt.message);
      }
      if (fn) fn.call(args);
    } else {
      // don't log in tests -- too high noise
      if (environment !== 'JEST') {
        console.log.apply(console.log, args);
      }
      if (fn) fn.call(args);
    }
  }
  info(...args: any[]) {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
  debug(...args: any[]) {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
  warn(...args: any[]) {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
  error(...args: any[]) {
    let logfn = this.logger ? this.logger.info.bind(this.logger) : null;
    this._thing(logfn, arguments);
  }
}

export default new WrappedLogger(bunyan_logger);
