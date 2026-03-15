/**
 * Central application logger. Single entry point for all backend logging.
 * - Test: no-op so expected error paths don't clutter output.
 * - Dev: console (default). Production: set LOG_TRANSPORT=json for structured JSON to stdout.
 *
 * @see backend/docs/logger-design.md
 */

export interface LogMeta {
  [key: string]: unknown;
}

export interface Transport {
  error(message: string, err?: unknown): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
}

function noopTransport(): Transport {
  return {
    error() {},
    warn() {},
    info() {},
    debug() {},
  };
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const out: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
    const code = (err as unknown as Record<string, unknown>).code;
    if (code !== undefined) {
      out.code = code;
    }
    return out;
  }
  return { value: String(err) };
}

function consoleTransport(): Transport {
  return {
    error(message: string, err?: unknown) {
      if (err !== undefined) {
        console.error(message, err);
      } else {
        console.error(message);
      }
    },
    warn(message: string, meta?: LogMeta) {
      if (meta !== undefined) {
        console.warn(message, meta);
      } else {
        console.warn(message);
      }
    },
    info(message: string, meta?: LogMeta) {
      if (meta !== undefined) {
        console.log(message, meta);
      } else {
        console.log(message);
      }
    },
    debug(message: string, meta?: LogMeta) {
      if (meta !== undefined) {
        console.debug(message, meta);
      } else {
        console.debug(message);
      }
    },
  };
}

/** One JSON line per log; stdout so hosts/aggregators can capture. Errors serialized for safe JSON. */
function jsonTransport(): Transport {
  const write = (level: string, message: string, err?: unknown, meta?: LogMeta) => {
    const payload: Record<string, unknown> = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    if (err !== undefined) {
      payload.err = serializeError(err);
    }
    if (meta !== undefined && Object.keys(meta).length > 0) {
      payload.meta = meta;
    }
    const line = JSON.stringify(payload) + '\n';
    if (level === 'error' || level === 'warn') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
  };
  return {
    error(message: string, err?: unknown) {
      write('error', message, err);
    },
    warn(message: string, meta?: LogMeta) {
      write('warn', message, undefined, meta);
    },
    info(message: string, meta?: LogMeta) {
      write('info', message, undefined, meta);
    },
    debug(message: string, meta?: LogMeta) {
      write('debug', message, undefined, meta);
    },
  };
}

function selectTransport(): Transport {
  if (process.env.NODE_ENV === 'test') {
    return noopTransport();
  }
  const kind = process.env.LOG_TRANSPORT ?? 'console';
  if (kind === 'json') {
    return jsonTransport();
  }
  return consoleTransport();
}

const transport: Transport = selectTransport();

export const logger: Transport = {
  error(message: string, err?: unknown) {
    transport.error(message, err);
  },
  warn(message: string, meta?: LogMeta) {
    transport.warn(message, meta);
  },
  info(message: string, meta?: LogMeta) {
    transport.info(message, meta);
  },
  debug(message: string, meta?: LogMeta) {
    transport.debug(message, meta);
  },
};
