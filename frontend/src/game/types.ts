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

type FilterWrapper<T> = {
  // Weather this filter is enabled or not
  enabled: boolean
  // The filter value
  filter: T
} |
// When using this filter as a saperator for easy settings and user filters
{ 
  enabled: false
  filter: undefined
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
}
export interface FilterCaseTypePossibilityAdd {
  // If this is set, the case is added instead of being removed
  add: FilterTypeAddPosition

  // the porobability that the character occurres anywhere inside the word
  possibility: number
}
export interface FilterCaseTypePossibilityRemove {
  // If this is set, the case is added instead of being removed
  remove: FilterTypeAddPosition

  // the porobability that the character occurres anywhere inside the word
  possibility: number
}
export type FilterCaseType = FilterWrapper<FilterCaseTypeEnum | FilterCaseTypePossibilityAdd | FilterCaseTypePossibilityRemove>

export enum FilterCharacterTypeEnum {
  // Dont filter anything
  None = 0,
  // Filter number only
  // replaces with a nothing
  Numbers = 1 << 0,
  // Filter out special characters, eg -/,/./@// etc
  // replaces all special characters with a space
  SpecialChars = 1 << 1,
  // Filter out both numbers and special characters
  NumberAndSpecialChars = Numbers | SpecialChars,
}
export interface FilterCharacterTypeDiscard {
  // string containing all the characters to discard
  discard: string
  // string containing the replacement for the character that will be discarded
  // this should be the same length as that of the characters array
  // Defaults concatenate otherwise
  replacement?: string
  // porobability to discard a character
  possibility?: number
}
export interface FilterCharacterTypeKeep {
  // string containing the list of characters to keep
  keep: string
  // string containing the replacement for the character that will be discarded
  // this should be the same length as that of the characters array
  // Defaults concatenate otherwise
  replacement?: string
  // porobability to discard a character
  possibility?: number
}
export interface FilterCharacterTypeAdd {
  // string containing the characters that should be added
  add: string
  // the porobability that the character occurres anywhere inside the word
  // defaults to 1 (100%)
  possibility?: number
  // the position filters for the corresponding characters
  positions: FilterTypeAddPosition
}
export type FilterCharacterType = FilterWrapper<FilterCharacterTypeEnum | FilterCharacterTypeDiscard | FilterCharacterTypeKeep | FilterCharacterTypeAdd>

export interface FilterFunctionTypeV1 {
  version: 1
  // The functions is expected to have the following inputs
  // @param words: string[] The words that are to be displayed
  // @return string
  functionString: string
}
export type FilterFunctionType = FilterWrapper<FilterFunctionTypeV1>

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
  wordCount: [number, number]

  // Note: The filters are applied in the order listed here
  //   `filterCase` first,
  //   `filterCharacter` second (same order as in array)
  //   `filterFunction` third (same order as in array)

  // Filter for text cAsE
  filterCase: FilterCaseType[]
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

export interface CompactOptions {
  // The type of generator to use to generate text
  t: GeneratorType
  // Minimum number of words per lesson
  w: number
  // Maximum number of words per lesson
  W: number

  // What to do when user enters the same character but with wrong case
  c: CaseBehaviour
  // What to do when user inputs wrong key entirely
  e: ErrorBehaviour
  // What to do when user presses spacebar at the wrong position
  s: SpacebarBehaviour
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

export class AsyncWorker {
  worker: Worker
  pendingRequests: {
    symbol: Symbol
    resolve: (value: any) => void
    reject: (reason?: any) => void
  }[] = []

  // undefined means not stopping,
  // true means stopping (this state can be recovered by setting this to true),
  // false means stopped (this state can not be recovered)
  stopping: boolean | undefined = undefined

  constructor(scriptURL: string | URL, options?: WorkerOptions) {
    this.worker = new Worker(scriptURL, options);
    this.worker.onmessage = (event: MessageEvent) => this.pendingRequests.shift()!.resolve(event.data)
    this.worker.onerror = (event: ErrorEvent) => this.pendingRequests.shift()!.reject(event)
  }

  async postMessage(message: any, timeout: number = 1000): Promise<any> {
    if (this.stopping !== undefined) throw new Error('Worker is stop' + (this.stopping === true? 'ping': 'ped'))
    const symbol = Symbol()
    let done = false

    const complete = () => {
      if (done) return
      done = true
      if (this.stopping === true && this.pendingRequests.length === 0) this.abort()
    }

    return new Promise((res, rej) => {
      this.pendingRequests.push({
        symbol,
        resolve(value: any) {
          complete()
          res(value)
        },
        reject(reason?: any) {
          complete()
          rej(reason)
        }
      })

      setTimeout(() => {
        if (done) return
        this.pendingRequests = this.pendingRequests.filter(x => x.symbol !== symbol)

        complete()
        rej(new Error('Timeout'))
      }, timeout)
       
      this.worker.postMessage(message)
    });
  }

  // Stop the worker gracefully
  stop(): void {
    this.stopping = true
  }

  // Kill this worker, throwing all pending promises
  abort(): void {
    this.worker.terminate()
    for (const handles of this.pendingRequests) handles.reject(new Error('Worker terminated'))
    this.pendingRequests = []
    this.stopping = false
  }
}

