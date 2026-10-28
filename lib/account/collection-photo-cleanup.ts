type StorageEntry = { name: string; id?: string | null }
type PhotoBucket = {
  list: (prefix: string, options: { limit: number; offset: number; sortBy: { column: string; order: string } }) => PromiseLike<{ data: StorageEntry[] | null; error: unknown }>
  remove: (paths: string[]) => PromiseLike<{ error: unknown }>
}

// Include unregistered uploads and photos retained after a sale. Enumerate
// before deleting so pagination offsets cannot skip files as pages shrink.
export async function removeOwnedCollectionPhotos(bucket: PhotoBucket, userId: string, registeredPaths: string[] = []) {
  const root = `${userId}/`
  const paths = new Set<string>()
  for (const path of registeredPaths) {
    if (!path.startsWith(root) || path.includes("..")) throw new Error("Invalid account photo path")
    paths.add(path)
  }

  const folders = [{ prefix: userId, depth: 0 }]
  for (let index = 0; index < folders.length; index++) {
    const { prefix, depth } = folders[index]
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await bucket.list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } })
      if (error) throw error
      const entries = data ?? []
      for (const entry of entries) {
        if (!entry.name || entry.name.includes("/") || entry.name.includes("..")) throw new Error("Invalid account photo entry")
        const path = `${prefix}/${entry.name}`
        if (!entry.id) {
          if (depth >= 2) throw new Error("Unexpected account photo folder depth")
          folders.push({ prefix: path, depth: depth + 1 })
        } else {
          paths.add(path)
        }
      }
      if (entries.length < 1000) break
    }
  }

  const allPaths = [...paths]
  for (let start = 0; start < allPaths.length; start += 1000) {
    const { error } = await bucket.remove(allPaths.slice(start, start + 1000))
    if (error) throw error
  }
}
