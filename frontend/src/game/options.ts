'use strict'

import {
  AsyncWorker,
  CaseBehaviour,
  CompactOptions,
  ErrorBehaviour,
  FilterCaseTypeEnum,
  FilterCharacterTypeEnum,
  GeneratorType,
  Options,
  SpacebarBehaviour
} from './types'
import { LocalstorageStore } from '../utils/store'
import { applyFiltersSync, MessageType } from './options_worker'

export const DefaultOptions: Options = {
  type: GeneratorType.MarkovWord,
  wordCount: [16, 32],

  filterCase: [{
    enabled: true,
    filter: FilterCaseTypeEnum.AllLower,
  }],
  filterCharacter: [
    {
      enabled: true,
      filter: FilterCharacterTypeEnum.Numbers | FilterCharacterTypeEnum.SpecialChars,
    },
  ],
  filterFunction: [],

  caseBehaviour: CaseBehaviour.Warn,
  errorBehaviour: ErrorBehaviour.Halt,
  spacebarBehaviour: SpacebarBehaviour.NoErrorOnWordStart,
}

export function compactOptions(options: Options): CompactOptions {
  return {
    t: options.type,
    w: options.wordCount[0],
    W: options.wordCount[1],
    c: options.caseBehaviour,
    e: options.errorBehaviour,
    s: options.spacebarBehaviour,
  }
}

export function decompactOptions(compactOptions: CompactOptions): Options {
  return {
    type: compactOptions.t,
    wordCount: [compactOptions.w, compactOptions.W],

    filterCase: DefaultOptions.filterCase,
    filterCharacter: DefaultOptions.filterCharacter,
    filterFunction: DefaultOptions.filterFunction,

    caseBehaviour: compactOptions.c,
    errorBehaviour: compactOptions.e,
    spacebarBehaviour: compactOptions.s,
  }
}

// undefined implies that the worker is 
let worker: AsyncWorker | undefined = undefined
export const OptionsStore = new LocalstorageStore<Options>('game.typing.options', DefaultOptions, JSON.parse, (op: Options) => {
  if (op.filterFunction.filter(x => x.enabled).length === 0) {
    if (worker) stopWorker()
  } else {
    if (!worker) startWorker()
    worker!.postMessage({t: MessageType.SetOptions, v: op})
  }
  return JSON.stringify(op)
})

export function startWorker() {
  if (worker) return
  worker = new AsyncWorker(new URL('./options_worker.ts', import.meta.url))
  worker.postMessage({t: MessageType.SetOptions, v: OptionsStore.get()!})
}
export function stopWorker() {
  if (!worker) return
  worker.stop()
  worker = undefined as any
}

export function applyFilters(words: string[] | Promise<string[]>): string | Promise<string> {
  if (worker) return (async() => worker.postMessage({t: MessageType.ProcessWords, v: await words}))()
  if (words instanceof Promise) return (async() => applyFiltersSync(OptionsStore.get()!, await words))()
  return applyFiltersSync(OptionsStore.get()!, words)
}

