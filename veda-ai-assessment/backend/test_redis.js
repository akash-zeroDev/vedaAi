const Redis = require('ioredis');
const url = 'redis://default:qL4LGnv81NfP5bJQDfHD5Ylk2hpYL71f@crowd-retrocozy-business-88676.db.redis.io:17444';
const client = new Redis(url, { maxRetriesPerRequest: null, connectTimeout: 5000 });
client.on('connect', () => { console.log("CONNECTED TO REDIS (plain)"); process.exit(0); });
client.on('error', (err) => { console.log("PLAIN ERROR:", err.message); process.exit(1); });
