'use strict'

import { showError, showServerError } from '../utils/toast'
import { getSite } from '../utils/networking'
import { GeneratorState, GeneratorType, Options } from './types'
import { applyFilters } from './options'

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

async function fetchText(id: GeneratorType, state: GeneratorState, count: number = 1 << 16): Promise<string> {
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

async function fulfillCache(id: GeneratorType, state: GeneratorState, currentCache: string) {
  // Note `1 << 16` here is character count not word count so this works
  if (currentCache.length < (1 << 16)) {
    try {
      currentCache = currentCache + await fetchText(id!, state)
    } catch (e) {
      showError(e as any)
    }
  }
  localStorage.setItem('game.typing.textcache.' + id, currentCache)
}

// This makes it so that we dont have to go to loading screen when fetching next text synchronously
export function getText(id: GeneratorType, range: [number, number], setcache: boolean = true): string[] | Promise<string[]> {
  const count = Math.round(range[0] + Math.random() * (range[1] - range[0]))
  // MAX(uint32) causes the generator to reroll to a random value
  if (count > (1 << 16)) throw new Error(`Invalid count: ${count} is grater than maximum allowed (${(1 << 16) - 1})`)
  let cache = localStorage.getItem('game.typing.textcache.' + id)!
  const state = new GeneratorState(id)

  if (cache) {
    const [retval, ncache] = splitWordString(cache, count)
    if (retval.length == count) {
      fulfillCache(id, state, ncache)
      if (setcache) localStorage.setItem('game.typing.current.' + id, retval.join(' '))
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
    if (setcache) localStorage.setItem('game.typing.current.' + id, retval.join(' '))
    return retval
  }
  
  return getTextAsync()
}

export async function fetchFromCache(options: Options) {
  let localCache = localStorage.getItem('game.typing.current.' + options.type)
  localCache ??= ''

  const [count_min, count_max] = options.wordCount
  let words = localCache? localCache.split(' ').filter(x => x): []
  const currentCount = words.length

  if (currentCount > count_max) {
    const keyName = 'game.typing.textcache.' + options.type
    const count = Math.round(count_min + Math.random() * (count_max - count_min))
    localStorage.setItem(keyName, words.slice(count).join(' ') + ' ' + localStorage.getItem(keyName))
    words = words.slice(0, count)
  } else if (currentCount < count_min) {
    words.push(...await getText(options.type, [count_min - currentCount, count_max - currentCount], false))
  } else {
    return applyFilters(words)
  }

  localStorage.setItem('game.typing.current.' + options.type, words.join(' '))

  return applyFilters(words)
}

