'use strict'

import {
  CaseBehaviour,
  CompactOptions,
  ErrorBehaviour,
  FilterCaseTypeEnum,
  FilterCharacterTypeEnum,
  GeneratorType,
  Options,
  SpacebarBehaviour
} from './interfaces'
import { LocalstorageStore } from '../utils/store'

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

export const OptionsStore = new LocalstorageStore<Options>('game.typing.options', DefaultOptions, JSON.parse, JSON.stringify)

