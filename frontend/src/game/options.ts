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
import { MessageType } from './options_worker'

export const DefaultOptions = {
  type: GeneratorType.MarkovWord,
  wordCount: 16,

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
    w: options.wordCount,
    c: options.caseBehaviour,
    e: options.errorBehaviour,
    s: options.spacebarBehaviour,
  }
}

export function decompactOptions(compactOptions: CompactOptions): Options {
  return {
    type: compactOptions.t,
    wordCount: compactOptions.w,

    filterCase: DefaultOptions.filterCase,
    filterCharacter: DefaultOptions.filterCharacter,
    filterFunction: DefaultOptions.filterFunction,

    caseBehaviour: compactOptions.c,
    errorBehaviour: compactOptions.e,
    spacebarBehaviour: compactOptions.s,
  }
}

export const OptionsStore = new LocalstorageStore<Options>('game.typing.options', DefaultOptions, JSON.parse, (op: Options) => {
  worker.postMessage({t: MessageType.SetOptions, v: op})
  return JSON.stringify(op)
})

let worker: AsyncWorker = undefined as any
export function startWorker() {
  if (worker) return
  worker = new AsyncWorker(new URL('./options_worker.ts', import.meta.url))
  worker.postMessage({t: MessageType.SetOptions, v: OptionsStore.get()!})
}
export function stopWorker() {
  if (!worker) return
  worker.terminate()
  worker = undefined as any
}

export async function applyFilters(words: string[]): Promise<string> {
  const result = await worker.postMessage({t: MessageType.ProcessWords, v: words})
  return result.v.join(' ')
}

