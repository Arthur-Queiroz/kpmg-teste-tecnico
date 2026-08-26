import * as path from 'node:path';

import { config } from 'dotenv';

// Points DATABASE_URL to the isolated test database (see
// docs/07-TESTING-STRATEGY.md) before any module touches process.env.
// `override` wins over the developer's local .env.
config({ path: path.resolve(__dirname, '../.env.test'), override: true });
