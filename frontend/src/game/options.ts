'use strict'

import { CaseBehaviour, ErrorBehaviour, FilterCaseTypeEnum, FilterCharacterTypeEnum, GeneratorType, Options, SpacebarBehaviour } from './interfaces'
import { LocalstorageStore } from '../utils/store'

export const OptionsStore = new LocalstorageStore<Options>('game.typing.options', {
  type: GeneratorType.MarkovWord,
  wordCount: 16,

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
  filterFunction: [],

  caseBehaviour: CaseBehaviour.Warn,
  errorBehaviour: ErrorBehaviour.Halt,
  spacebarBehaviour: SpacebarBehaviour.NoErrorOnWordStart,
}, JSON.parse, JSON.stringify)

//export function BehaviourOptions(options: Options) {
//  ;
//}

export function applyFilters(options: Options, words: string[]) {

  return words.join(' ')
}

