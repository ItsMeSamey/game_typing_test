'use strict'

import { For, onCleanup, onMount, createSignal, createEffect, Show, untrack } from 'solid-js'
import { createMutable, createStore } from 'solid-js/store'

import { Timer } from '../utils/timer'
import { setPageError } from '../utils/navigation'
import { showError, showServerError } from '../utils/toast'
import LoadingScreen from '../pages/loading_screen'
import Keyboard from './keyboard'
import { CaseBehaviour, ErrorBehaviour, FilterCaseTypeEnum, FilterCharacterTypeEnum, GeneratorType, Options, SpacebarBehaviour } from './interfaces'
import { LocalstorageStore } from '../utils/store'
import { getSite } from '../utils/networking'

enum State {
  correct,
  mistake,
  unreached,
  unreached_mistake,
}

function getFontHeight() {
  const tempElement = document.createElement('span')
  tempElement.className = 'text-transparent'
  tempElement.textContent = 'Hg'
  document.body.appendChild(tempElement)
  const height = tempElement.getBoundingClientRect().height
  document.body.removeChild(tempElement)

  return Math.max(height, 8)
}

const optionsStore = new LocalstorageStore<Options>('game.typing.options', {
  type: GeneratorType.MarkovWord,
  wordCount: 4,

  filterCase: {
    enabled: true,
    filter: FilterCaseTypeEnum.AllLower,
  },
  filterCharacter: [
    {
      enabled: true,
      filter: FilterCharacterTypeEnum.Numbers | FilterCharacterTypeEnum.SpecialChars,
    },
  ],
  filters: [],

  caseBehaviour: CaseBehaviour.Warn,
  errorBehaviour: ErrorBehaviour.Halt,
  spacebarBehaviour: SpacebarBehaviour.NoErrorOnWordStart,
}, JSON.parse, JSON.stringify)

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
function getText(id?: GeneratorType, count?: number, state?: string): string | Promise<string> {
  id ??= optionsStore.get()!.type
  count??= optionsStore.get()!.wordCount
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

async function promisiyValue<T>(v: T | Promise<T>): Promise<T> {return v}

function TypingModel(options: Options) {
  const [text, setText] = createSignal<string>(localStorage.getItem('game.typing.textcache.' + options.type + '.current') ?? '')
  createEffect(() => localStorage.setItem('game.typing.textcache.' + options.type + '.current', text()))
  promisiyValue(getText()).then(setText);

  const [characters, setCharacters] = createStore<State[]>(Array(text().length).fill(State.unreached))
  createEffect(() => {
    const t = text()
    if (t !== '') setCursorPosition()
    setCharacters(Array(t.length).fill(State.unreached))
  })

  const [speed, setSpeed] = createSignal(0)
  const [myBest, setMyBest] = createSignal<number>(0)

  const fontHeight = getFontHeight()
  let cursor: HTMLDivElement = undefined as unknown as HTMLDivElement
  let divRef: HTMLDivElement = undefined as unknown as HTMLDivElement

  let at = 0
  let atWord = 0
  let presses: [string, number][] = []
  const timer = new Timer()

  function reset() {
    atWord = at = 0
    setCursorPosition()
    presses = []
    timer.reset()
    setCharacters({from: 0, to: untrack(text).length}, State.unreached)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return reset()

    const txt = text()
    if (e.key.length !== 1 || at >= txt.length) return

    if (txt[at] === e.key) {
      e.preventDefault()
      setCharacters(at, (old) => old === State.unreached_mistake ? State.mistake : State.correct)
      if (at === 0) timer.reset()
      at += 1
      if (e.key === ' ') atWord += 1
    } else {
      setCharacters(at, (_) => State.unreached_mistake)
    }

    const elapsed = timer.elapsed/1000
    presses.push([e.key.toLowerCase(), elapsed])
    const current = 60*atWord/elapsed

    setSpeed(current)
    if (at === txt.length) { // Completed this set
      const current = 60*(txt.split(' ').length) / elapsed
      if (myBest() < current) setMyBest(current)

      const next = getText()
      if (next instanceof Promise) {
        setText('')
        next.then((text) => {
          reset()
          setText(text)
        }).catch(setPageError)
      } else {
        reset()
        setText(next)
      }
    }

    setCursorPosition()
  }

  function setCursorPosition() {
    let bounds = divRef.children[at]?.getBoundingClientRect() as {left: number, top: number} | undefined
    if (!bounds) {
      const inbounds = divRef.children[divRef.children.length - 1]?.getBoundingClientRect()
      if (!inbounds) return divRef.getBoundingClientRect()
      bounds = {left: inbounds.left+inbounds.width, top: inbounds.top}
    }
    cursor.style.transform = `translate(${bounds.left}px, ${bounds.top}px)`
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', setCursorPosition)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('resize', setCursorPosition)
  })

  return <Show when={text() !== ''} fallback={<LoadingScreen pageString='Loading Typing Test' />}>
    <div class='flex flex-col items-center justify-center h-full p-6 motion-preset-fade object-scale-down'>
      <div
        class={'absolute transition-all z-50 top-0 left-0 bg-foreground will-change-transform ' + (characters[0] !== State.unreached? 'block': 'hidden')}
        style={{
          'height': `${fontHeight}px`,
          'width': '1.5px',
          'transform': `translate(50vw, 50vh)`,
        }}
        ref={cursor}
      />
      <h1 class='text-2xl font-bold mb-4 max-sm:mb-2'>Typing Test</h1>
      <div class='max-w-3xl text-muted-foreground/75 pb-2 sm:mt-[-2rem] flex flex-row w-full'>
        Typing speed:
        <span class='text-foreground/75 font-semibold motion-opacity-in motion-delay-250 px-1'> {characters[0] !== State.unreached? speed().toFixed(2): '?'} </span>
        WPM
        <div class='flex flex-row gap-4 font-semibold ml-auto'>
          <span class='text-green-500'>{myBest().toFixed(2)}</span>
        </div>
      </div>
      <div class='max-w-3xl select-none text-lg mb-4 motion-translate-y-in tracking-widest max-h-1/2 overflow-y-scroll' ref={divRef}>
        <For each={text() as unknown as string[]}>
          {(key, i) => (
            <span
              class={`font-semibold tracking-normal motion-delay-500 ${
                characters[i()] === State.correct ? 'text-green-500' :
                characters[i()] === State.mistake ? 'text-red-500 underline' :
                characters[i()] === State.unreached_mistake ? 'text-foreground/75' :
                'text-foreground/90'
              }`}
            >
              {key === ' '? <span class={(characters[i()] !== State.mistake? 'opacity-50': '')}> • </span>: key}
            </span>
          )}
        </For>
      </div>
      <p class='text-muted-foreground/75'>Press Escape to reset.</p>
      <p class={`text-muted-foreground/75 ${characters[0] !== State.unreached? 'motion-text-out-transparent': 'motion-text-in-transparent'}`}>Press any key to start typing!</p>
      <div class='flex mt-8 max-sm:hidden'>
        <Keyboard />
      </div>
    </div>
  </Show>
}

export default function() {
  const options = createMutable<Options>(optionsStore.get()!)
  createEffect(() => optionsStore.set({...options}))
  return TypingModel(options)
}

