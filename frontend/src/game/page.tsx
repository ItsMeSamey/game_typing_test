'use strict'

import { For, onCleanup, onMount, createEffect, Show, batch, on } from 'solid-js'
import { createMutable  } from 'solid-js/store'

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
  mistake,
  warning,
  correct,
  corrected_mistake,
  unreached,
  unreached_mistake,
  unreached_warning,
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

interface TypingTextState {
  text: string,
  characters: ([string, State, number] | [string, State.unreached])[],
  speed: number,
}

class TypingText {
  at: number = 0
  atWord: number = 0
  presses: [string, number][] = []
  timer: Timer = new Timer()

  state: TypingTextState

  constructor(public options: Options, mock: boolean = false) {
    this.state = {
      text: '',
      characters: [],
      speed: 0,
    }
    if (!mock) this.state = createMutable<TypingTextState>(this.state)
  }

  reset() {
    this.atWord = this.at = 0
    this.presses = []
    this.state.characters = this.state.text.split('').map(c => [c, State.unreached])
  }

  handleKeyDown(key: string) {
    if (key.length !== 1 || this.at >= this.state.text.length) return
    if (this.presses.length === 0) this.timer.reset()
    this.presses.push([key.toLowerCase(), this.timer.elapsed/1000])

    if (this.presses.length === 0) this.timer.reset()
    if (!this.processKey(key)) return

    const elapsed = this.timer.elapsed/1000
    this.presses.push([key.toLowerCase(), elapsed])

    this.state.speed = 60*this.atWord/elapsed
  }

  processKey(key: string): boolean {
    if (this.state.text[this.at] === key) {
      //TODO: implement options parsing
      this.state.characters[this.at][1] = this.state.characters[this.at][1] === State.unreached_mistake? State.mistake: State.correct
      if (key === ' ') this.atWord += 1
      this.at += 1
    } else {
      this.state.characters[this.at][1] = State.unreached_mistake
    }
    return true
  }
}

class TextContainer {
  text: TypingText

  cursor: HTMLDivElement
  divRef: HTMLDivElement

  fontHeight: number = getFontHeight()

  textCacheStore: LocalstorageStore<string>

  constructor(options: Options) {
    this.textCacheStore = undefined as any
    this.text = new TypingText(options)
    createEffect(() => this.generatorType = this.text.options.type)

    this.cursor = <div
      class={
        'absolute transition-transform z-50 top-0 left-0 backdrop-invert will-change-transform ' +
        (this.text.state.text && this.text.state.characters[0][1] !== State.unreached? 'block': 'hidden')
      }
      style={{
        'height': `1em`,
        'width': '1.1px',
        'transform': `translate(50vw, 50vh)`,
      }}
    /> as HTMLDivElement

    this.divRef = <div class='max-w-3xl select-none text-lg mb-4 motion-translate-y-in tracking-widest max-h-1/2 overflow-y-scroll font-mono'>
      <For each={this.text.state.characters}>
        {e => (
          <span
            class={`font-semibold motion-delay-500 tracking-wider ${
              e[1] === State.correct ? 'text-green-500' :
              e[1] === State.mistake ? 'text-red-500 underline' :
              e[1] === State.unreached_mistake ? 'text-foreground/75' :
              'text-foreground/90'
            }`}
          >
            {e[0] === ' '? <span class={'break-words ' + (e[1] !== State.mistake? 'opacity-50': '')}>•</span>: e[0]}
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
      this.text.state.text = text
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
    this.text.handleKeyDown(e.key)

    if (this.text.at === this.text.state.text.length) { // Completed this set
      const next = applyFilters(getText(this.text.options.type, this.text.options.wordCount))
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

  return <Show when={container.text.state.text} fallback={<LoadingScreen pageString='Loading Typing Test' />}>
    {container.cursor}
    <div class='flex flex-col items-center justify-center h-full p-6 motion-preset-fade object-scale-down'>
      <h1 class='text-2xl font-bold mb-4 max-sm:mb-2'>Typing Test</h1>
      <div class='max-w-3xl text-muted-foreground/75 pb-2 sm:mt-[-2rem] flex flex-row w-full'>
        Typing speed:
        <span class='text-foreground/75 font-semibold motion-opacity-in motion-delay-250 px-1'>
          {container.text.state.text && container.text.state.characters[0][1] !== State.unreached? container.text.state.speed.toFixed(2): '?'}
        </span>
        WPM
        <div class='flex flex-row gap-4 font-semibold ml-auto'>
          <span class='text-green-500'>{container.text.state.speed.toFixed(2)}</span>
        </div>
      </div>
      {container.divRef}
      <p class='text-muted-foreground/75'>Press Escape to reset.</p>
      <p class={`text-muted-foreground/75 ${container.text.state.text && container.text.state.characters[0][1] !== State.unreached? 'motion-text-out-transparent': 'motion-text-in-transparent'}`}>
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

