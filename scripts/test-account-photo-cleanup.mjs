import assert from 'node:assert/strict'
import { test } from 'node:test'
import { removeOwnedCollectionPhotos } from '../lib/account/collection-photo-cleanup.ts'

function bucket(pages, failure) {
  const reads = [], deletes = []
  return { reads, deletes, api: {
    async list(prefix, options) {
      reads.push({ prefix, ...options })
      assert.equal(deletes.length, 0, 'all pages must be enumerated before any deletion')
      return failure ? { data: null, error: failure } : { data: pages[`${prefix}:${options.offset}`] ?? [], error: null }
    },
    async remove(paths) { deletes.push(paths); return { error: null } },
  } }
}

test('cleans current, sold-history and orphaned uploads only under this account', async () => {
  const b = bucket({ 'user:0': [{ name: 'current', id: null }, { name: 'sold', id: null }], 'user/current:0': [{ name: 'a.jpg', id: '1' }, { name: 'orphan.jpg', id: '2' }], 'user/sold:0': [{ name: 'history.jpg', id: '3' }] })
  await removeOwnedCollectionPhotos(b.api, 'user', ['user/current/a.jpg'])
  assert.deepEqual(b.deletes.flat().sort(), ['user/current/a.jpg', 'user/current/orphan.jpg', 'user/sold/history.jpg'])
})

test('handles pagination and limits every Storage deletion to 1000 objects', async () => {
  const b = bucket({ 'user:0': Array.from({ length: 1000 }, (_, i) => ({ name: `${i}.jpg`, id: `${i}` })), 'user:1000': [{ name: 'last.jpg', id: '1000' }] })
  await removeOwnedCollectionPhotos(b.api, 'user')
  assert.deepEqual(b.reads.map(r => r.offset), [0, 1000])
  assert.deepEqual(b.deletes.map(r => r.length), [1000, 1])
})

test('listing failures abort without removing any object', async () => {
  const error = new Error('storage unavailable'), b = bucket({}, error)
  await assert.rejects(removeOwnedCollectionPhotos(b.api, 'user'), error)
  assert.equal(b.deletes.length, 0)
})

test('rejects paths belonging to another account', async () => {
  const b = bucket({})
  await assert.rejects(removeOwnedCollectionPhotos(b.api, 'user', ['other/item/photo.jpg']), /Invalid account photo path/)
  assert.equal(b.deletes.length, 0)
})

test('rejects unsafe storage names before removing any object', async () => {
  const b = bucket({ 'user:0': [{ name: '../other', id: '1' }] })
  await assert.rejects(removeOwnedCollectionPhotos(b.api, 'user'), /Invalid account photo entry/)
  assert.equal(b.deletes.length, 0)
})

test('an empty account needs no Storage delete call', async () => {
  const b = bucket({})
  await removeOwnedCollectionPhotos(b.api, 'user')
  assert.equal(b.deletes.length, 0)
})

test('a Storage deletion error is propagated to prevent Auth deletion', async () => {
  const error = new Error('remove failed'), b = bucket({ 'user:0': [{ name: 'photo.jpg', id: '1' }] })
  b.api.remove = async () => ({ error })
  await assert.rejects(removeOwnedCollectionPhotos(b.api, 'user'), error)
})
