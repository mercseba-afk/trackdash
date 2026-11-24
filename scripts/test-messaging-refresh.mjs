// Exercise the actual component effects with controlled transports. Database
// permissions and deal transitions are checked by audit-user-flows.sql.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, mocks, globals = {}) {
  const exports = {}
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  vm.runInNewContext(source, { exports, console, ...globals, require(name) {
    if (name in mocks) return mocks[name]
    if (name === 'react/jsx-runtime') return { jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) }
    if (name === 'lucide-react' || name.startsWith('@/components/') || name === 'next/link') return new Proxy({}, { get: (_, key) => String(key) })
    throw Error('Unexpected import ' + name)
  } })
  return exports
}

function fixture() {
  const effects = [], channels = [], removed = [], events = new Map()
  const window = { addEventListener: (name, cb) => events.set('window:' + name, cb), removeEventListener: name => events.delete('window:' + name) }
  const document = { visibilityState: 'visible', addEventListener: (name, cb) => events.set('document:' + name, cb), removeEventListener: name => events.delete('document:' + name) }
  const react = { useState: value => [typeof value === 'function' ? value() : value, () => {}], useRef: value => ({ current: value }), useMemo: fn => fn(), useCallback: fn => fn, useEffect: fn => effects.push(fn) }
  const client = { channel(name) {
    const channel = { name, handlers: [], on(_kind, filter, cb) { this.handlers.push({ filter, cb }); return this }, subscribe(cb) { this.subscribed = cb; return this } }
    channels.push(channel)
    return channel
  }, removeChannel: async channel => removed.push(channel) }
  return { effects, channels, removed, events, window, document, react, client }
}

test('an incoming request and acceptance refresh the conversation list without reopening Messages', async () => {
  const f = fixture()
  let reads = 0
  const user = { id: 'buyer' }
  const { MessagesScreenV2 } = load('components/screens/messages-screen-v2.tsx', {
    react: f.react,
    'next/navigation': { useRouter: () => ({}), useSearchParams: () => ({ get: () => null }) },
    '@/lib/actions/messaging': { getMyConversationsAction: async () => { reads++; return [] } },
    '@/lib/supabase/client': { createClient: () => f.client },
    '@/lib/store': { useStore: () => ({ user }) },
    '@/lib/i18n': { useI18n: () => ({ locale: 'it', t: value => value }) },
    sonner: { toast: {} },
  }, { window: f.window, document: f.document })
  MessagesScreenV2()
  const cleanups = f.effects.map(fn => fn())
  const channel = f.channels.find(c => c.name === 'conversation-list:buyer')
  assert.ok(channel)
  const handler = channel.handlers.find(h => h.filter.table === 'conversations')
  const before = reads
  if (['*', 'INSERT'].includes(handler.filter.event)) handler.cb({ eventType: 'INSERT' })
  assert.equal(reads, before + 1)
  if (['*', 'UPDATE'].includes(handler.filter.event)) handler.cb({ eventType: 'UPDATE' })
  assert.equal(reads, before + 2, 'acceptance must refresh the waiting requester too')
  channel.subscribed('SUBSCRIBED')
  assert.equal(reads, before + 3, 'reconnect retrieves changes missed offline')
  cleanups.forEach(fn => fn?.())
  assert.ok(f.removed.includes(channel))
})

test('returning to a deal or reconnecting retrieves the latest offer, with no background polling', async () => {
  const f = fixture()
  let reads = 0
  const { DealPanel } = load('components/messaging/deal-panel.tsx', {
    react: f.react,
    '@/lib/actions/messaging': { getConversationDealAction: async () => { reads++; return { offers: [], sale: null } } },
    '@/lib/supabase/client': { createClient: () => f.client },
    '@/lib/store': { useStore: () => ({ user: { id: 'buyer' } }) },
    sonner: { toast: {} },
  }, { window: f.window, document: f.document })
  DealPanel({ conversation: { id: 'deal', askingCurrency: 'EUR' }, locale: 'it' })
  const cleanups = f.effects.map(fn => fn())
  const channel = f.channels.find(c => c.name === 'deal:deal')
  const before = reads
  channel.subscribed('SUBSCRIBED')
  assert.equal(reads, before + 1)
  f.document.visibilityState = 'hidden'
  channel.handlers[0].cb()
  assert.equal(reads, before + 1)
  f.document.visibilityState = 'visible'
  f.events.get('document:visibilitychange')()
  assert.equal(reads, before + 2)
  f.events.get('window:focus')()
  assert.equal(reads, before + 3)
  assert.equal(channel.handlers.every(h => h.filter.filter === 'conversation_id=eq.deal'), true)
  cleanups.forEach(fn => fn?.())
  assert.equal(f.events.size, 0)
  assert.ok(f.removed.includes(channel))
})
