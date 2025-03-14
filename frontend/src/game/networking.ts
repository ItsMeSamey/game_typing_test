'use strict'

import { showError, showServerError } from '../utils/toast'
import { getSite } from '../utils/networking'
import { GeneratorStateType, GeneratorType, Options } from './interfaces'
import { applyFilters } from './options'
import { createMutable } from 'solid-js/store'

// Split the string around the word
function splitWordString(str: string, count: number): [string[], string] {
  let n = 0
  const retArray: string[] = []
  let lastEnd = 0
  while (retArray.length < count && n < str.length) {
    if (str[n] == ' ') {
      retArray.push(str.substring(lastEnd, n))
      lastEnd = n+1
    }
    n += 1
  }
  return [retArray, str.substring(n)]
}

async function fetchText(id: GeneratorType, state: GeneratorStateType, count: number = 1 << 16): Promise<string> {
  const result = await fetch(getSite('typing') + '/gen', {headers: {id: String(id), count: String(count), state: String(state.state)}})
  const text = await result.text()
  if (!result.ok) showServerError(text)

  let stateIdx = text.substring(0, 13).indexOf('\n')
  if (stateIdx == -1) {
    showError({
      name: 'Invalid Response',
      message: 'The server did not return any `state` header'
    })
  } else {
    state.state = +text.substring(0, stateIdx)
  }

  return text.substring(stateIdx+1)
}

async function fulfillCache(id: GeneratorType, state: GeneratorStateType, currentCache: string) {
  // Note `1 << 16` here is character count not word count so this works
  if (currentCache.length < (1 << 16)) {
    try {
      currentCache = currentCache + await fetchText(id!, state)
      localStorage.setItem('game.typing.textcache.' + id + '.state', String(state.state))
    } catch (e) {
      showError(e as any)
    }
  }
  localStorage.setItem('game.typing.textcache.' + id, currentCache)
}

// This makes it so that we dont have to go to loading screen when fetching next text synchronously
export function getText(id: GeneratorType, state: GeneratorStateType, count: number): string[] | Promise<string[]> {
  const cacheName = 'game.typing.textcache.' + id
  // MAX(uint32) causes the generator to reroll to a random value

  if (count > (1 << 16)) throw new Error(`Invalid count: ${count} is grater than maximum allowed (${(1 << 16) - 1})`)
  let cache = localStorage.getItem(cacheName)!

  if (cache) {
    const [retval, ncache] = splitWordString(cache, count)
    if (retval.length == count) {
      fulfillCache(id, state, ncache)
      return retval
    }
  }

  async function getTextAsync(): Promise<string[]> {
    let result = await fetchText(id!, state)
    if (cache) result = cache + ' ' + result

    const [retval, ncache] = splitWordString(result, count!)
    if (retval.length != count) showError({
      name: 'An unexpected Error occurred',
      message: 'number of words is less that expected, even after merging local cache with server response'
    })

    fulfillCache(id, state, ncache)
    return retval
  }
  
  return getTextAsync()
}

export async function fetchFromCache(options: Options) {
  let localCache = localStorage.getItem('game.typing.textcache.' + options.type + '.current')
  localCache = localCache? localCache + ' ': ''

  const count = options.wordCount
  let words = localCache.split(' ')
  const currentCount = words.length

  const keyName = 'game.typing.textcache.' + options.type
  if (currentCount > count) {
    localStorage.setItem(keyName, words.slice(count).join(' ') + ' ' + localStorage.getItem(keyName))
    words = words.slice(0, count)
  } else if (currentCount < count) {
    const state = createMutable(JSON.parse(localStorage.getItem(keyName + '.state') ?? '{state: -1}'))
    words.push(...await getText(options.type, state, count - currentCount))
  }

  return applyFilters(options, words)
}

