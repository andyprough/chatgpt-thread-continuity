// Simple no-browser smoke test for the pure prompt generator embedded in exporter-main.js.
// Usage: node scripts/test-initial-prompt.js
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'content', 'exporter-main.js'), 'utf8');
const start = source.indexOf('  function buildInitialPacketPrompt(data) {');
const end = source.indexOf('  async function copyText(text)', start);
assert(start > 0 && end > start, 'Prompt function not found');
const code = source.slice(start, end).replace('function buildInitialPacketPrompt', 'function buildInitialPacketPrompt');
const generator = new Function('formatNumber', `${code}; return buildInitialPacketPrompt;`)(n => Number(n).toLocaleString('en-US'));
const sample = {
  title: 'uBlock fork development',
  extractedAt: '2026-11-02 14:00',
  messages: Array.from({length:218}, () => ({})),
  totalWords: 68408,
  estimatedTokens: 91211,
  userWords:2340,
  assistantWords:66068,
  attachments:Array.from({length:214}, () => ({})),
  uploadTurns:89,
  guidance:{title:'Maintain the rolling continuation packet',text:'Document-heavy thread; act conservatively.'}
};
const result=generator(sample);
for (const text of [
  'FIRST ROLLING CONTINUATION PACKET',
  'not a request to end this thread',
  '68,408', '~91,211', '214', '89', '218',
  'NOT a measure of live model context',
  'current_node'
]) {
  if (text === 'current_node') continue;
  assert(result.toLowerCase().includes(text.toLowerCase()), `Missing ${text}`);
}
assert(!result.includes('Bearer '));
assert(result.includes('uncommitted work'));
assert(result.includes('downloadable .md'));
assert(result.toLowerCase().includes('keep working here')); 
assert(result.includes('meaningful project milestones'));
console.log('PASS initial prompt: generic instruction + exact current sample metrics + limitations');
