const databaseName = 'startup-profile-photos'
const objectStoreName = 'photos'
const demoPhotoKey = 'demo-user'

const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(databaseName, 1)
  request.onupgradeneeded = () => {
    request.result.createObjectStore(objectStoreName)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error('Could not open local photo storage.'))
})

const runPhotoTransaction = async (mode, action) => {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(objectStoreName, mode)
    const request = action(transaction.objectStore(objectStoreName))
    let result
    let settled = false
    request.onsuccess = () => { result = request.result }
    request.onerror = () => {
      settled = true
      database.close()
      reject(request.error || new Error('Could not access local photo storage.'))
    }
    transaction.onabort = () => {
      database.close()
      if (!settled) reject(transaction.error || new Error('Local photo storage was interrupted.'))
    }
    transaction.oncomplete = () => {
      database.close()
      if (!settled) resolve(result)
    }
  })
}

export const getDemoProfilePhoto = () =>
  runPhotoTransaction('readonly', (store) => store.get(demoPhotoKey))

export const saveDemoProfilePhoto = (photo) =>
  runPhotoTransaction('readwrite', (store) => store.put(photo, demoPhotoKey))

export const removeDemoProfilePhoto = () =>
  runPhotoTransaction('readwrite', (store) => store.delete(demoPhotoKey))
