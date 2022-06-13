import { ConfigOptions } from '../types';

export class Config {
  prefix?: string;
  state: 'release' | 'dev';
  tokens: {
    release: string;
    dev?: string;
  };
  dbPaths?: {
    release: string;
    dev?: string;
  };
  owners: string[];

  constructor(options: ConfigOptions) {
    this.prefix = options.prefix;

    this.state = options.state ?? 'release';

    if (this.state === 'dev' && !options.tokens.dev)
      throw new TypeError("A development token hasn't been provided.");
    this.tokens = options.tokens;

    if (options.dbPaths) {
      if (this.tokens.dev && !options.dbPaths.dev)
        throw new TypeError('A development database path must be provided.');
      this.dbPaths = options.dbPaths;
    }

    this.owners = options.owners;
  }

  getToken() {
    return this.tokens[this.state];
  }

  getDbPath() {
    return this.dbPaths?.[this.state];
  }
}
