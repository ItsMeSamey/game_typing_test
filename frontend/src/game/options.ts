'use strict'

import {
  CaseBehaviour,
  ErrorBehaviour,
  FilterCaseTypeEnum,
  FilterCaseTypePossibilityAdd,
  FilterCaseTypePossibilityRemove,
  FilterCharacterTypeEnum,
  FilterTypeAddPosition,
  GeneratorType,
  Options,
  SpacebarBehaviour
} from './interfaces'
import { LocalstorageStore } from '../utils/store'

export const OptionsStore = new LocalstorageStore<Options>('game.typing.options', {
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
}, JSON.parse, JSON.stringify)

//export function BehaviourOptions(options: Options) {
//  ;
//}

export function takeChance(possibility: number) {
  return Math.random() > possibility
}

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
        ?(s: string) => s[0].toUpperCase() === s[0]? s: takeChance(possibility)? s.toUpperCase(): s
        :(s: string) => s[0].toLowerCase() === s[0]? s: takeChance(possibility)? s.toLowerCase(): s

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

  return words.join(' ')
}

