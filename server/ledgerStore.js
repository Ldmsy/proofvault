// Storage for the seal ledger and the demo signing keys.
// - Upstash Redis when its REST credentials are set (Vercel Marketplace sets KV_REST_API_* or
//   UPSTASH_REDIS_REST_*): shared by every serverless function, so seals survive and stay in sync.
// - Otherwise a local JSON file (.data/, or /tmp on Vercel without Redis).
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Redis } from '@upstash/redis';

const LEDGER_KEY = 'proofvault:ledger';
const KEYS_KEY = 'proofvault:keys';

// Appends entries only if the list still has the length the caller built them on.
const APPEND_IF_LENGTH = `
if redis.call('LLEN', KEYS[1]) ~= tonumber(ARGV[1]) then return -1 end
for i = 2, #ARGV do redis.call('RPUSH', KEYS[1], ARGV[i]) end
return redis.call('LLEN', KEYS[1])`;

function redisStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token, automaticDeserialization: false });
  return {
    kind: 'redis',
    async readChain() {
      return (await redis.lrange(LEDGER_KEY, 0, -1)).map((s) => JSON.parse(s));
    },
    async appendIfLength(expected, entries) {
      const res = await redis.eval(APPEND_IF_LENGTH, [LEDGER_KEY], [String(expected), ...entries.map((e) => JSON.stringify(e))]);
      return Number(res) !== -1;
    },
    async clearChain() {
      await redis.del(LEDGER_KEY);
    },
    // First writer wins, so concurrent requests never end up with two keys for one reviewer.
    async getOrCreateKey(id, create) {
      const existing = await redis.hget(KEYS_KEY, id);
      if (existing) return JSON.parse(existing);
      await redis.hsetnx(KEYS_KEY, id, JSON.stringify(create()));
      return JSON.parse(await redis.hget(KEYS_KEY, id));
    },
  };
}

function fileStore() {
  const dir = process.env.PV_DATA_DIR || (process.env.VERCEL ? '/tmp/proofvault' : join(process.cwd(), '.data'));
  const ledgerFile = join(dir, 'ledger.json');
  const keysFile = join(dir, 'keys.json');
  const load = (file, fallback) => {
    try {
      return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback;
    } catch {
      return fallback;
    }
  };
  const save = (file, data) => {
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[ledger] could not persist', file, err.message);
    }
  };
  let chain = null;
  let keys = null;
  return {
    kind: 'file',
    async readChain() {
      chain ??= load(ledgerFile, []);
      return [...chain];
    },
    async appendIfLength(expected, entries) {
      chain ??= load(ledgerFile, []);
      if (chain.length !== expected) return false;
      chain.push(...entries);
      save(ledgerFile, chain);
      return true;
    },
    async clearChain() {
      chain = [];
      save(ledgerFile, chain);
    },
    async getOrCreateKey(id, create) {
      keys ??= load(keysFile, {});
      if (!keys[id]) {
        keys[id] = create();
        save(keysFile, keys);
      }
      return keys[id];
    },
  };
}

export const store = redisStore() || fileStore();
