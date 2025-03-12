'use strict'

import { For, onCleanup, onMount, createSignal, createEffect, Show, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Timer } from '../utils/timer'
import { Page, setPageError } from '../utils/navigation'
import { showServerError } from '../utils/toast'
import LoadingScreen from '../pages/loading_screen'
import Keyboard from './keyboard'

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

function TypingModel() {
  const [text, setTextRaw] = createSignal<string>('Hola Amigo')
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
    if (at === txt.length) {
      const current = 60*(txt.split(' ').length)/elapsed
      if (myBest() < current) setMyBest(current)
      setNextText().catch(setPageError)
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
      <div class='max-w-3xl select-none text-lg mb-4 motion-translate-y-in tracking-widest' ref={divRef}>
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
  return TypingModel()
}

