'use strict'

import { For, onCleanup, onMount, createSignal, createEffect, Show, untrack, batch, on, Accessor, Setter } from 'solid-js'
import { createMutable, createStore, SetStoreFunction } from 'solid-js/store'

import { Settings, SettingsSignal } from './page_settings'
import Keyboard from './page_keyboard'

import { Timer } from '../utils/timer'
import { setPageError } from '../utils/navigation'
import LoadingScreen from '../pages/loading_screen'
import { GeneratorType, Options } from './types'
import { fetchFromCache, getText } from './networking'
import { applyFilters, OptionsStore } from './options'
import { LocalstorageStore } from '../utils/store'

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

class TypingText {
  at: number = 0
  atWord: number = 0
  presses: [string, number][] = []
  timer: Timer = new Timer()

  text: Accessor<string>
  setTextRaw: Setter<string>
  characters: State[]
  setCharacters: SetStoreFunction<State[]>
  speed: Accessor<number>
  setSpeed: Setter<number>

  constructor() {
    ;[this.text, this.setTextRaw] = createSignal<string>('')
    ;[this.characters, this.setCharacters] = createStore<State[]>(Array(this.text().length).fill(State.unreached))
    ;[this.speed, this.setSpeed] = createSignal<number>(0)
  }

  reset() {
    this.atWord = this.at = 0
    this.presses = []
    this.setCharacters({from: 0, to: untrack(this.text).length}, State.unreached)
  }
}

class TextContainer {
  text: TypingText = new TypingText()

  cursor: HTMLDivElement
  divRef: HTMLDivElement

  fontHeight: number = getFontHeight()

  textCacheStore: LocalstorageStore<string>

  constructor(public options: Options) {
    this.textCacheStore = undefined as any
    createEffect(() => this.generatorType = this.options.type)

    this.cursor = <div
      class={
        'absolute transition-transform z-50 top-0 left-0 backdrop-invert will-change-transform ' +
        (this.text.characters[0] !== State.unreached? 'block': 'hidden')
      }
      style={{
        'height': `1em`,
        'width': '1.1px',
        'transform': `translate(50vw, 50vh)`,
      }}
    /> as HTMLDivElement

    this.divRef = <div class='max-w-3xl select-none text-lg mb-4 motion-translate-y-in tracking-widest max-h-1/2 overflow-y-scroll font-mono'>
      <For each={this.text.text() as unknown as string[]}>
        {(key, i) => (
          <span
            class={`font-semibold motion-delay-500 tracking-wider ${
              this.text.characters[i()] === State.correct ? 'text-green-500' :
              this.text.characters[i()] === State.mistake ? 'text-red-500 underline' :
              this.text.characters[i()] === State.unreached_mistake ? 'text-foreground/75' :
              'text-foreground/90'
            }`}
          >
            {key === ' '? <span class={'break-words ' + (this.text.characters[i()] !== State.mistake? 'opacity-50': '')}>•</span>: key}
          </span>
        )}
      </For>
    </div> as HTMLDivElement
  }

  reset() {
    this.text.reset()
    this.setCursorPosition()
  }

  setCursorPosition() {
    if (!this.divRef || !this.cursor) return
    let bounds = this.divRef.children[this.text.at]?.getBoundingClientRect() as {left: number, top: number} | undefined
    if (!bounds) {
      const inbounds = this.divRef.children[this.divRef.children.length - 1]?.getBoundingClientRect()
      if (!inbounds) return this.divRef.getBoundingClientRect()
      bounds = {left: inbounds.left+inbounds.width, top: inbounds.top}
    }
    this.cursor.style.transform = `translate(${bounds.left}px, ${bounds.top}px)`
  }

  setText(text: string) {
    batch(() => {
      this.text.setTextRaw(text)
      this.reset()
    })
  }

  set generatorType(val: GeneratorType) {
    this.textCacheStore = new LocalstorageStore<string>('game.typing.cache.small.' + val)
    this.reset()
    /*Init Text n stuff*/
  }

  complete() {
    ;
  }

  handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') return this.reset()
    const t = untrack(this.text.text)
    if (e.key.length !== 1 || this.text.at >= t.length) return

    if (t[this.text.at] === e.key) {
      e.preventDefault()
      this.text.setCharacters(this.text.at, (old) => old === State.unreached_mistake? State.mistake: State.correct)
      if (e.key === ' ') this.text.atWord += 1
      if (this.text.at === 0) this.text.timer.reset()
      this.text.at += 1
    } else {
      this.text.setCharacters(this.text.at, _ => State.unreached_mistake)
    }

    const elapsed = this.text.timer.elapsed/1000
    this.text.presses.push([e.key.toLowerCase(), elapsed])
    const current = 60*this.text.atWord/elapsed

    this.text.setSpeed(current)
    if (this.text.at === t.length) { // Completed this set
      //const current = 60*(t.split(' ').length) / elapsed
      //if (myBest() < current) setMyBest(current)

      const next = applyFilters(getText(this.options.type, this.options.wordCount))
      if (next instanceof Promise) {
        this.setText('')
        next.then(words => this.setText(words)).catch(setPageError)
      } else {
        this.setText(next)
      }
    }

    this.setCursorPosition()
  }
}

function TypingModel({options, signal}: {options: Options, signal: SettingsSignal}) {
  const container = new TextContainer(options)
  const [myBest, setMyBest] = createSignal<number>(0)

  const handleKeyDown = container.handleKeyDown.bind(container)
  const setCursorPosition = container.setCursorPosition.bind(container)

  onMount(() => {
    fetchFromCache(options).then((v) => container.setText(v))
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', setCursorPosition)
  })

  onCleanup(() => {
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', setCursorPosition)
  })

  return <Show when={container.text.text() !== ''} fallback={<LoadingScreen pageString='Loading Typing Test' />}>
    {container.cursor}
    <div class='flex flex-col items-center justify-center h-full p-6 motion-preset-fade object-scale-down'>
      <h1 class='text-2xl font-bold mb-4 max-sm:mb-2'>Typing Test</h1>
      <div class='max-w-3xl text-muted-foreground/75 pb-2 sm:mt-[-2rem] flex flex-row w-full'>
        Typing speed:
        <span class='text-foreground/75 font-semibold motion-opacity-in motion-delay-250 px-1'>
          {container.text.characters[0] !== State.unreached? container.text.speed().toFixed(2): '?'}
        </span>
        WPM
        <div class='flex flex-row gap-4 font-semibold ml-auto'>
          <span class='text-green-500'>{myBest().toFixed(2)}</span>
        </div>
      </div>
      {container.divRef}
      <p class='text-muted-foreground/75'>Press Escape to reset.</p>
      <p class={`text-muted-foreground/75 ${container.text.characters[0] !== State.unreached? 'motion-text-out-transparent': 'motion-text-in-transparent'}`}>
        Press any key to start typing!
      </p>
      <div class='flex mt-8 max-sm:hidden'>
        <Keyboard />
      </div>
    </div>
  </Show>
}

export default function() {
  const options = createMutable<Options>(OptionsStore.get()!)
  createEffect(() => OptionsStore.set({...options}), OptionsStore.get()!, {render: true})

  const signal = createMutable<SettingsSignal>({
    skip: false,
    refilter: false
  })
  createEffect(on(() => signal.refilter, () => {
    if (signal.refilter) OptionsStore.set(options)
  }))

  return <>
    <nav class='flex flex-col p-2 ml-auto absolute align-middle items-end top-0 left-0 w-full'>
      <Settings options={options} signal={signal} />
    </nav>
    <TypingModel options={options} signal={signal} />
  </>
}

