'use strict';

// Generator Types
export enum GeneratorType {
  // Randomly chooses from a word list
  RandomAlpha = 0,
  // Randomly chooses from word list (but words may contatin non alphabet characters eg 'tick-tock' with the '-')
  RandomAlphaNumeric = 1,
  // Randomly Generated sentences
  RandomSentence = 2,
  // Markov model to generate characters
  MarkovChar = 3,
  // Markov model to generate words
  MarkovWord = 4,
}

export enum FilterTypeAddPosition {
  Any = 0,
  Start = 1,
  End = 2,
  StartOrEnd = 3,
  StartAndEnd = 4,
}

// Filter Case Types
export enum FilterCaseTypeEnum {
  // Turn all to lower case
  AllLower = 0,
  // For psychotic people
  AllUpper = 1,
  // Keep the original case
  Keep = 2,
}
export interface FilterCaseTypePercentage {
  // If this is set, the case is added instead of being removed
  add?: FilterTypeAddPosition

  // chance that the character occurres in the start
  percentageStart: number
  // chance that the character occurres in the end
  percentageEnd: number
  // chance that the character occurres anywhere else
  percentageInside: number
}
export interface FilterCaseTypeMergedPercentage {
  // the percentage chance that the character occurres anywhere inside the word
  percentage: number
}
export interface FilterCaseType {
  // Weather this filter is enabled or not
  enabled: boolean
  // The filter value
  filter: FilterCaseTypeEnum | FilterCaseTypePercentage | FilterCaseTypeMergedPercentage
}

export enum FilterCharacterTypeEnum {
  // Dont filter anything
  None = 0,
  // Filter number only
  Numbers = 1 << 0,
  // Filter out special characters, eg -/,/./@// etc
  SpecialChars = 1 << 1,
}
export interface FilterCharacterTypeDiscard {
  // string containing all the characters to discard
  discard: string
  // percentage chance to discard a character
  percentage?: string
}
export interface FilterCharacterTypeReplace {
  // string containing all the characters to discard
  characters: string
  // string containing the replacement for the character that will be discarded
  // this should be the same length as that of the characters array
  // defaults to space otherwise
  replacement?: string
  // percentage chance to discard a character
  percentage?: string
}
export interface FilterCharacterTypeKeep {
  // string containing the list of characters to keep
  keep: string
}

export interface FilterCharacterTypeAddTemplate {
  // string containing the characters that should be added
  addable: string
  // the position filters for the corresponding characters
  positions: FilterTypeAddPosition[]
}
export interface FilterCharacterTypeAddPercentage extends FilterCharacterTypeAddTemplate {percentage: number}
export interface FilterCharacterTypeAddPercentages extends FilterCharacterTypeAddTemplate {percentages: number[]}
export type FilterCharacterTypeAdd = FilterCharacterTypeAddPercentage | FilterCharacterTypeAddPercentages

export interface FilterCharacterType {
  // Weather this filter is enabled or not
  enabled: boolean
  // The filter value
  filter: FilterCharacterTypeEnum | FilterCharacterTypeDiscard | FilterCharacterTypeKeep | FilterCharacterTypeAdd
}

export interface FilterFunctionTypeV1 {
  version: 1
  // The functions is expected to have the following inputs
  // @param words: string[] The words that are to be displayed
  // @return string
  functionString: string
}
export interface FilterFunctionType {
  // Weather this filter is enabled or not
  enabled: boolean
  // The filter value
  filter: FilterFunctionTypeV1
}

export enum CaseBehaviour {
  // Ignore and skip
  Ignore = 0,
  // Warn and skip (yellow colorize)
  Warn = 1,
  // Error and stop (red colorize)
  Error = 2,
}

export enum ErrorBehaviour {
  // Stop the cursor, dim the next character slightly
  Halt = 0,
  // Append the incorrect words so that the user will have to remove then all before progressing (using backspace)
  Append = 1,
}

export enum SpacebarBehaviour {
  // Behave same as if user entered wrong character
  Error = 0,
  // Dont error if at the first letter in the word
  NoErrorOnWordStart = 1 << 0,
  // Dont error if <not> at the first letter in the word
  NoErrorInMiddle = 1 << 1,
  // Skip the word entirely
  SkipWord = 1 << 2,

  // Note:
  //   NoErrorOnWordStart & NoErrorInMiddle can be used together
  //   they can also be used along with SkipWord. 
  //     If both are off SkipWord skips words anywhere
  //     If on is on, SkipWord Skips does no skip at that area, (eg if NoErrorOnWordStart is on with SkipWord, wont skip at start)
}

export interface Options {
  // The type of generator to use to generate text
  type: GeneratorType  
  // Number of words per lesson
  wordCount: number

  // Note: The filters are applied in the order listed here
  //   `filterCase` first,
  //   `filterCharacter` second (same order as in array)
  //   `filterFunction` third (same order as in array)

  // Filter for text cAsE
  filterCase: FilterCaseType
  // filter(s) for unwanted characters
  filterCharacter: FilterCharacterType[]
  // transform text using custom functions
  filterFunction: FilterFunctionType[]

  // What to do when user enters the same character but with wrong case
  caseBehaviour: CaseBehaviour
  // What to do when user inputs wrong key entirely
  errorBehaviour: ErrorBehaviour
  // What to do when user presses spacebar at the wrong position
  spacebarBehaviour: SpacebarBehaviour
}

export class GeneratorState {
  _state: number
  constructor(public id: GeneratorType) {
    this._state = +(localStorage.getItem('game.typing.state.' + id) ?? '-1')
  }

  get state() {
    return this._state
  }
  set state(state: number) {
    if (this._state === state) return
    this._state = state
    localStorage.setItem('game.typing.state.' + this.id, String(state))
  }
}

