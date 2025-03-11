import { openDB } from 'idb'
import { getSite } from '../utils/networking'

export type WordLength = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20

export interface HistoryEntry {
  allowAny: boolean
  history: string[]
}
export interface Value {
  idx: number
  word: string
  done?: 0 | 1
  histories?: HistoryEntry[]
}

type schemaValue = {
  key: 'idx'
  value: Value
  indexes: {'wordIndex': 'word', 'doneIndex': 'done'}
}
interface Schema {
  'w3' : schemaValue
  'w4' : schemaValue
  'w5' : schemaValue
  'w6' : schemaValue
  'w7' : schemaValue
  'w8' : schemaValue
  'w9' : schemaValue
  'w10': schemaValue
  'w11': schemaValue
  'w12': schemaValue
  'w13': schemaValue
  'w14': schemaValue
  'w15': schemaValue
  'w16': schemaValue
  'w17': schemaValue
  'w18': schemaValue
  'w19': schemaValue
  'w20': schemaValue
}

export const db = await openDB<Schema>('wordle.words', 1, {
  upgrade(db) {
    for (let i = 3; i <= 20; i++) {
      const store = db.createObjectStore('w' + i, {autoIncrement: true, keyPath: 'idx'})
      store.createIndex('wordIndex', 'word', {unique: true})
      store.createIndex('doneIndex', 'done')
    }
  }
})

// Calculates the diff (coloring) from a word and a guess
// assumes that word and guess are of the same length
export function calcDiff(word: string, guess: string):  string {
  if (guess.length < 3 || guess.length > 20) throw new Error('Invalid guess length')
  if (word.length !== guess.length) throw new Error('Length mismatch')

  const og = word.split('')
  const retval = Array.from({length: guess.length}).fill('r')

  for (let i = 0; i < guess.length; i++) {
    if (guess[i].toLowerCase() == og[i].toLowerCase()) {
      retval[i] = 'g'
      og[i] = ''
    }
  }

  for (let i = 0; i < guess.length; i++) {
    const idx = og.indexOf(guess[i])
    if (idx === -1) continue
    retval[i] = 'y'
    og[idx] = ''
  }

  return retval.join('')
}

// Gets and returns the record of the word if it exists in db
export async function getGuessWord(guess: string): Promise<Value | undefined> {
  if (guess.length < 3 || guess.length > 20) throw new Error('Invalid guess length')
  const storeRO = db.transaction('w' + guess.length, 'readonly', {durability: 'relaxed'}).objectStore('w' + guess.length).index('wordIndex')
  return await storeRO.get(guess)
}

// Get a random word of length wlen
//   if done is true, get a random word which was already done
//   if done is false, get a random word which hasnt been done
//   if done is undefined, get a random word
export async function getRandomWord(wlen: WordLength, done?: boolean): Promise<string> {
  const store = db.transaction('w' + wlen, 'readonly', {durability: 'relaxed'}).objectStore('w' + wlen)
  const index = done === undefined? store: store.index('doneIndex')
  const newDone = done === undefined? undefined: +done
  const idx = Math.floor(Math.random() * (await index.count(newDone)))
  const cursor = await index.openCursor(newDone)
  await cursor?.advance(idx)
  return cursor?.value.word
}

// Sets the word as done, adding the history to the record
export async function setDone(word: string, h: [string, string][], allowAny: boolean): Promise<void> {
  if (word.length < 3 || word.length > 20) throw new Error('Invalid word length')
  const store = db.transaction('w' + word.length, 'readwrite').objectStore('w' + word.length)

  const record = await store.index('wordIndex').get(word) as Value
  record.done = 1
  record.histories = record.histories ?? []
  record.histories.push({
    allowAny,
    history: h.map(([w, _]) => w),
  })

  await store.put(record)
  store.transaction.commit()
}

// Get all the words that have been done
export async function getDoneWords(wlen: WordLength): Promise<Value[]> {
  const store = db.transaction('w' + wlen, 'readonly').objectStore('w' + wlen).index('doneIndex')
  return await store.getAll(1)
}

// Fetches and adds all words of length wlen from the server to local idb database
export async function addWords(wlen: WordLength): Promise<void> {
  const storeRO = db.transaction('w' + wlen, 'readonly', {durability: 'relaxed'}).objectStore('w' + wlen)
  if (await storeRO.count() !== 0) return

  const response = await fetch(getSite('wordle') + '/' + wlen)
  const text = await response.text()
  const data = []
  for (let i = 0; i < text.length; i += wlen) {
    data.push(text.substring(i, i + wlen))
  }

  const storeRW = db.transaction('w' + wlen, 'readwrite').objectStore('w' + wlen)
  const promises = data.map(word => storeRW.put({word}))
  await Promise.all(promises)
  storeRW.transaction.commit()
}

// Fetches and adds all words of length 3 to 20 from the server to local idb database
export async function addAllWords(): Promise<void> {
  const promises = []
  for (let i = 3; i <= 20; i++) {
    promises.push(addWords(i as any))
  }
  await Promise.all(promises)
}

