'use strict'

import { showError, showServerError } from '../utils/toast'
import { getSite } from '../utils/networking'
import { GeneratorType } from './interfaces'
import { OptionsStore } from './options'

// Split the string around the word
function splitWordString(str: string, count: number): [string, string, number] {
  let n = 0
  let seen = 0
  while (seen < count && n < str.length) {
    if (str[n] == ' ') seen += 1
    n += 1
  }
  return [str.substring(0, n-1), str.substring(n), seen]
}

async function fetchText(id: GeneratorType, state: string, count: number = 1 << 16): Promise<{state?: string, text: string}> {
  const result = await fetch(getSite('typing') + '/gen', {headers: {id: String(id), count: String(count), state: String(state)}})
  const text = await result.text()
  if (!result.ok) showServerError(text)

  const retval: {state?: string, text: string} = {} as any
  let stateIdx = text.substring(0, 13).indexOf('\n')
  if (stateIdx == -1) {
    showError({
      name: 'Invalid Response',
      message: 'The server did not return any `state` header'
    })
  } else {
    retval.state = text.substring(0, stateIdx)
  }
  retval.text = text.substring(stateIdx+1)

  return retval
}

// This makes it so that we dont have to go to loading screen when fetching next text synchronously
export function getText(id?: GeneratorType, count?: number, state?: string): string | Promise<string> {
  id ??= OptionsStore.get()!.type
  count??= OptionsStore.get()!.wordCount
  const cacheName = 'game.typing.textcache.' + id
  const stateCacheName = cacheName + '.state'
  // MAX(uint32) causes the generator to reroll to a random value
  state ??= localStorage.getItem(stateCacheName) ?? String(((1 << 31) - 1) | (1 << 31))

  if (count > (1 << 16)) throw new Error(`Invalid count: ${count} is grater than maximum allowed (${(1 << 16) - 1})`)
  async function fulfillCache(currentCache: string) {
    // Note `1 << 16` here is character count not word count so this works
    if (currentCache.length < (1 << 16)) {
      try {
        currentCache = currentCache + await fetchText(id!, state!)
        localStorage.setItem(stateCacheName, state!)
      } catch (e) {
        showError(e as any)
      }
    }
    localStorage.setItem(cacheName, currentCache)
  }

  let cache = localStorage.getItem(cacheName)!

  if (cache) {
    const [retval, ncache, seen] = splitWordString(cache, count)
    if (seen == count) {
      fulfillCache(ncache)
      return retval
    }
  }

  async function getTextAsync(): Promise<string> {
    const result = await fetchText(id!, state!)
    state = result.state ?? state!
    if (cache) {
      result.text = cache + ' ' + result.text
    }

    const [retval, ncache, seen] = splitWordString(result.text, count!)
    if (seen != count) {
      showError({
        name: 'An unexpected Error occurred',
        message: 'number of words is less that expected, even after merging local cache with server response'
      })
    }

    fulfillCache(ncache)
    return retval
  }
  
  return getTextAsync()
}

