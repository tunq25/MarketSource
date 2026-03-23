const fs = require('fs');
const path = require('path');

// 1. Export getPoolInstance in core.ts
const corePath = path.join(__dirname, '../lib/db/core.ts');
let core = fs.readFileSync(corePath, 'utf8');
if (!core.includes('export function getPoolInstance')) {
    core = core.replace('function getPoolInstance(', 'export function getPoolInstance(');
    fs.writeFileSync(corePath, core);
}

// 2. Remove duplicate normalizeUserId in users.ts
const usersPath = path.join(__dirname, '../lib/db/users.ts');
let users = fs.readFileSync(usersPath, 'utf8');
users = users.replace(/import { normalizeUserId } from '\.\/users';\n/g, '');
fs.writeFileSync(usersPath, users);

// 3. Fix missing internal variables in transactions.ts
const dbPath = path.join(__dirname, '../lib/database.ts');
const transactionsPath = path.join(__dirname, '../lib/db/transactions.ts');

const oldDbContent = fs.readFileSync(dbPath, 'utf8');

// Use simple string matching or regex to find the missing functions
const ensureFuncRegex = /async function ensureDepositsSchema\(\)(?:.|\n)*?catch \(e\) \{\s*logger.warn(?:.|\n)*?\}\n\}/;
const ensureMatch = oldDbContent.match(ensureFuncRegex);

const refRegex = /function generateDepositReferenceCode\(\)(?:.|\n)*?return result;\n\}/;
const refMatch = oldDbContent.match(refRegex);

let transactions = fs.readFileSync(transactionsPath, 'utf8');

if (!transactions.includes('depositsSchemaCache')) {
    const missingLogic = `
let depositsSchemaCache = false;

${ensureMatch ? ensureMatch[0] : `async function ensureDepositsSchema() {
  if (depositsSchemaCache) return;
  try {
    const instance = getPoolInstance();
    await instance?.query(\`
      CREATE TABLE IF NOT EXISTS deposits (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(15,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(255),
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    \`);
    depositsSchemaCache = true;
  } catch (error) { console.error('Error creating deposits table', error); }
}`}

${refMatch ? refMatch[0] : `function generateDepositReferenceCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'DEP-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}`}
`;
    transactions = transactions + '\n\n' + missingLogic;
}

// 4. Import createNotification in transactions and features
if (!transactions.includes('createNotification')) {
    transactions = "import { createNotification } from './admin';\n" + transactions;
}
fs.writeFileSync(transactionsPath, transactions);

const featuresPath = path.join(__dirname, '../lib/db/features.ts');
let features = fs.readFileSync(featuresPath, 'utf8');
if (!features.includes('createNotification')) {
    features = "import { createNotification } from './admin';\n" + features;
}
fs.writeFileSync(featuresPath, features);

console.log('Patch complete.');
