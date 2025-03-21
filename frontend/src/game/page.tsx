'use strict'

import { For, onCleanup, onMount, createSignal, createEffect, Show, untrack, batch } from 'solid-js'
import { createMutable, createStore } from 'solid-js/store'

import { Timer } from '../utils/timer'
import { setPageError } from '../utils/navigation'
import LoadingScreen from '../pages/loading_screen'
import Keyboard from './page_keyboard'
import { Options } from './types'
import { fetchFromCache, getText } from './networking'
import { applyFilters, OptionsStore } from './options'

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

function TypingModel(options: Options) {
  const [text, setTextRaw] = createSignal<string>('')
  const [characters, setCharacters] = createStore<State[]>(Array(text().length).fill(State.unreached))
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
    presses = []
    setCharacters({from: 0, to: untrack(text).length}, State.unreached)
    setCursorPosition()
  }
  function setText(val: any) {
    batch(function() {
      setTextRaw(val)
      reset()
    })
    localStorage.setItem('game.typing.current.' + options.type, untrack(text))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return reset()
    const t = untrack(text)
    if (e.key.length !== 1 || at >= t.length) return

    if (t[at] === e.key) {
      e.preventDefault()
      setCharacters(at, (old) => old === State.unreached_mistake? State.mistake: State.correct)
      if (e.key === ' ') atWord += 1
      if (at === 0) timer.reset()
      at += 1
    } else {
      setCharacters(at, _ => State.unreached_mistake)
    }

    const elapsed = timer.elapsed/1000
    presses.push([e.key.toLowerCase(), elapsed])
    const current = 60*atWord/elapsed

    setSpeed(current)
    if (at === t.length) { // Completed this set
      const current = 60*(t.split(' ').length) / elapsed
      if (myBest() < current) setMyBest(current)

      const next = getText(options.type, options.wordCount)
      if (next instanceof Promise) {
        setText('')
        next.then(words => setText(applyFilters(words))).catch(setPageError)
      } else {
        setText(applyFilters(next))
      }
    }

    setCursorPosition()
  }

  function setCursorPosition() {
    if (!divRef || !cursor) return
    let bounds = divRef.children[at]?.getBoundingClientRect() as {left: number, top: number} | undefined
    if (!bounds) {
      const inbounds = divRef.children[divRef.children.length - 1]?.getBoundingClientRect()
      if (!inbounds) return divRef.getBoundingClientRect()
      bounds = {left: inbounds.left+inbounds.width, top: inbounds.top}
    }
    cursor.style.transform = `translate(${bounds.left}px, ${bounds.top}px)`
  }

  onMount(() => {
    fetchFromCache(options).then((v) => setText(v))
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', setCursorPosition)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('resize', setCursorPosition)
  })

  return <Show when={text() !== ''} fallback={<LoadingScreen pageString='Loading Typing Test' />}>
    <div
      class={'absolute transition-transform z-50 top-0 left-0 backdrop-invert will-change-transform ' + (characters[0] !== State.unreached? 'block': 'hidden')}
      style={{
        'height': `${fontHeight}px`,
        'width': '1.1px',
        'transform': `translate(50vw, 50vh)`,
      }}
      ref={cursor}
    />
    <div class='flex flex-col items-center justify-center h-full p-6 motion-preset-fade object-scale-down'>
      <h1 class='text-2xl font-bold mb-4 max-sm:mb-2'>Typing Test</h1>
      <div class='max-w-3xl text-muted-foreground/75 pb-2 sm:mt-[-2rem] flex flex-row w-full'>
        Typing speed:
        <span class='text-foreground/75 font-semibold motion-opacity-in motion-delay-250 px-1'> {characters[0] !== State.unreached? speed().toFixed(2): '?'} </span>
        WPM
        <div class='flex flex-row gap-4 font-semibold ml-auto'>
          <span class='text-green-500'>{myBest().toFixed(2)}</span>
        </div>
      </div>
      <div
        class='max-w-3xl select-none text-lg mb-4 motion-translate-y-in tracking-widest max-h-1/2 overflow-y-scroll font-mono'
        ref={divRef}
      >
        <For each={text() as unknown as string[]}>
          {(key, i) => (
            <span
              class={`font-semibold motion-delay-500 tracking-wider ${
                characters[i()] === State.correct ? 'text-green-500' :
                characters[i()] === State.mistake ? 'text-red-500 underline' :
                characters[i()] === State.unreached_mistake ? 'text-foreground/75' :
                'text-foreground/90'
              }`}
            >
              {key === ' '? <span class={'break-words ' + (characters[i()] !== State.mistake? 'opacity-50': '')}>•</span>: key}
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
  const options = createMutable<Options>(OptionsStore.get()!)
  createEffect(() => OptionsStore.set({...options}))
  return TypingModel(options)
}

