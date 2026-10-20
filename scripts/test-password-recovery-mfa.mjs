// Component behavior with mocked Auth transport. These tests do not replace
// the owner's real email, TOTP, password reset and subsequent sign-in tests.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync('components/screens/update-password-screen.tsx', 'utf8')
function screen({ user = { id: 'synthetic-user' }, currentLevel = 'aal1', nextLevel = 'aal1', assuranceError = null, transportError = false } = {}) {
  const states = [], redirects = [], effects = []
  let assuranceCalls = 0
  const auth = {
    getUser: async () => {
      if (transportError) throw Error('transport unavailable')
      return { data: { user } }
    },
    mfa: { getAuthenticatorAssuranceLevel: async () => {
      assuranceCalls++
      return { data: { currentLevel, nextLevel }, error: assuranceError }
    } },
  }
  const exports = {}
  const jsx = (type, props) => ({ type, props })
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, require: name => {
    if (name === 'react') return {
      useState: initial => { const index = states.length; states.push(initial); return [initial, value => { states[index] = value }] },
      useEffect: effect => effects.push(effect),
    }
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
    if (name === 'next/navigation') return { useRouter: () => ({ replace: path => redirects.push(path) }) }
    if (name === '@/lib/supabase/client') return { createClient: () => ({ auth }) }
    if (name === '@/lib/i18n') return { useI18n: () => ({ locale: 'it' }) }
    return new Proxy({}, { get: (_, key) => key === 'toast' ? { error() {} } : key })
  } })
  exports.UpdatePasswordScreen()
  return { states, redirects, get assuranceCalls() { return assuranceCalls },
    async load() { effects[0](); for (let i = 0; i < 8; i++) await Promise.resolve() },
  }
}

test('recovery session with existing MFA is routed to verification before showing the password form', async () => {
  const s = screen({ nextLevel: 'aal2' }); await s.load()
  assert.deepEqual(s.redirects, ['/mfa?next=%2Fupdate-password'])
  assert.notEqual(s.states[0], 'valid')
})
test('verified MFA session returns to the password form without another MFA redirect', async () => {
  const s = screen({ currentLevel: 'aal2', nextLevel: 'aal2' }); await s.load()
  assert.deepEqual(s.redirects, []); assert.equal(s.states[0], 'valid')
})
test('accounts without MFA can recover without being forced to enroll a factor', async () => {
  const s = screen(); await s.load()
  assert.deepEqual(s.redirects, []); assert.equal(s.states[0], 'valid')
})
test('expired recovery session stays invalid and never enrolls MFA', async () => {
  const s = screen({ user: null }); await s.load()
  assert.equal(s.states[0], 'invalid'); assert.equal(s.assuranceCalls, 0)
  assert.deepEqual(s.redirects, [])
})
test('assurance lookup failure keeps password form closed with a retry state', async () => {
  const s = screen({ assuranceError: { message: 'unavailable' } }); await s.load()
  assert.equal(s.states[0], 'unavailable'); assert.deepEqual(s.redirects, [])
})
test('transport failure offers retry rather than leaving the recovery screen loading forever', async () => {
  const s = screen({ transportError: true }); await s.load()
  assert.equal(s.states[0], 'unavailable')
})
