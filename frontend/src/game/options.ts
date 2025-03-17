'use strict'

import {
  CaseBehaviour,
  CompactOptions,
  ErrorBehaviour,
  FilterCaseTypeEnum,
  FilterCaseTypePossibilityAdd,
  FilterCaseTypePossibilityRemove,
  FilterCharacterTypeAdd,
  FilterCharacterTypeDiscard,
  FilterCharacterTypeEnum,
  FilterCharacterTypeKeep,
  FilterTypeAddPosition,
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

export function copactOptions(options: Options): CompactOptions {
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

export function applyFilters(options: Options, words: string[]) {
  // Case filter
  for (const filter of options.filterCase) {
    if (!filter.enabled) continue
    if (filter.filter === FilterCaseTypeEnum.AllLower || filter.filter === FilterCaseTypeEnum.AllUpper) {
      if(filter.filter === FilterCaseTypeEnum.AllLower) {
        for (let i = 0; i < words.length; i += 1) words[i] = words[i].toLowerCase()
      } else {
        for (let i = 0; i < words.length; i += 1) words[i] = words[i].toUpperCase()
      }
    } else {
      const possibility = filter.filter.possibility
      const transformChar = (filter.filter as FilterCaseTypePossibilityAdd).add !== undefined
        ?(s: string) => s[0].toUpperCase() === s[0]? s: Math.random() > possibility? s.toUpperCase(): s
        :(s: string) => s[0].toLowerCase() === s[0]? s: Math.random() > possibility? s.toLowerCase(): s

      const position = (filter.filter as FilterCaseTypePossibilityAdd).add ?? (filter.filter as FilterCaseTypePossibilityRemove).remove
      const transformWord =
        position === FilterTypeAddPosition.Any
        ?(s: string) => {
          let result = ''
          for (let i = 0; i < s.length; i++) {
            const char = s[i]
            result += transformChar(char)
          }
          return result
        }:

        position === FilterTypeAddPosition.Start
        ?(s: string) => transformChar(s[0]) + s.slice(1):

        position === FilterTypeAddPosition.End
        ?(s: string) => s + transformChar(s[s.length - 1]):

        position === FilterTypeAddPosition.StartAndEnd
        ?(s: string) => {
          const result = transformChar(s[0] + s[s.length - 1])
          return result[0] + s.slice(1, s.length - 1) + result[1]
        }:

        position === FilterTypeAddPosition.StartOrEnd
        ?(s: string) => transformChar(s[0]) + s.slice(1, s.length - 1) + transformChar(s[s.length - 1]):

        (() => {throw new Error('Invalid FilterTypeAddPosition')})()
      ;

      for (let i = 0; i < words.length; i += 1) words[i] = transformWord(words[i])
    }
  }

  // Special character filter
  const characterFilters: (FilterCharacterTypeDiscard | FilterCharacterTypeKeep | FilterCharacterTypeAdd)[] = []
  for (const filter of options.filterCharacter) {
    if (!filter.enabled || filter.filter === FilterCharacterTypeEnum.None) continue

    const numbers = '0123456789'
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let pushed = false
    if (filter.filter === FilterCharacterTypeEnum.Numbers || filter.filter === FilterCharacterTypeEnum.NumberAndSpecialChars) {
      pushed = true
      characterFilters.push({discard: numbers})
    }
    if (filter.filter === FilterCharacterTypeEnum.SpecialChars || filter.filter === FilterCharacterTypeEnum.NumberAndSpecialChars) {
      pushed = true
      characterFilters.push({keep: numbers + characters, replacement: ' '})
    }

    if (!pushed) characterFilters.push(filter.filter as any)
  }

  for (const filter of characterFilters) {
    const takeChance = filter.possibility !== undefined? () => {
      return Math.random() > filter.possibility!
    }: () => true

    const addChar =
      (filter as FilterCharacterTypeAdd).positions === FilterTypeAddPosition.Any
      ?(s: string) => {
        const idx = Math.trunc(Math.random() * (s.length+1))
        return s.substring(0, idx) + (filter as FilterCharacterTypeAdd).add
      }:

      (filter as FilterCharacterTypeAdd).positions === FilterTypeAddPosition.Start
      ?(s: string) => (filter as FilterCharacterTypeAdd).add + s:

      (filter as FilterCharacterTypeAdd).positions === FilterTypeAddPosition.Start
      ?(s: string) => s + (filter as FilterCharacterTypeAdd).add:

      (filter as FilterCharacterTypeAdd).positions === FilterTypeAddPosition.StartAndEnd
      ?(s: string) => (filter as FilterCharacterTypeAdd).add + s + (filter as FilterCharacterTypeAdd).add:

      (filter as FilterCharacterTypeAdd).positions === FilterTypeAddPosition.StartOrEnd
      ?(s: string) => Math.random() > .5? (filter as FilterCharacterTypeAdd).add + s: s + (filter as FilterCharacterTypeAdd).add:

      () => {throw new Error('Invalid FilterTypeAddPosition')}
    ;

    const transformWord: (s: string) => string =
      (filter as FilterCharacterTypeDiscard).discard !== undefined
      ?(s: string) => {
        let result = ''

        for (let i = 0; i < s.length; i++) {
          if (!(filter as FilterCharacterTypeDiscard).discard.includes(s[i]) || !takeChance()) {
            result += s[i]
          } else {
            if ((filter as FilterCharacterTypeDiscard).replacement !== undefined) result += (filter as FilterCharacterTypeDiscard).replacement
          }
        }
        return result
      }:

      (filter as FilterCharacterTypeKeep).keep !== undefined
      ?(s: string) => {
        let result = ''

        for (let i = 0; i < s.length; i++) {
          if ((filter as FilterCharacterTypeKeep).keep.includes(s[i]) || !takeChance()) {
            result += s[i]
          } else {
            if ((filter as FilterCharacterTypeKeep).replacement !== undefined) result += (filter as FilterCharacterTypeKeep).replacement
          }
        }
        return result
      }:

      (filter as FilterCharacterTypeAdd).add !== undefined
      ?(s: string) => {
        if (!takeChance()) return s
        return addChar(s)
      }:

      (() => {throw new Error('Invalid filter type selected')})()
    ;

    words = words.flatMap(w => transformWord(w).split(' ').filter(s => s))
  }

  // Rest of the filters
  ;
  return words.join(' ')
}
