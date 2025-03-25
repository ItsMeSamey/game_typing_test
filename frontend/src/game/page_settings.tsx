'use strict'

import { createSignal, JSX, Show } from 'solid-js'
import { IconSettings } from '~/components/icons'
import { Popover, PopoverTrigger, PopoverContent } from '~/registry/ui/popover'
import { Slider, SliderFill, SliderLabel, SliderThumb, SliderTrack, SliderValueLabel } from '~/registry/ui/slider'

import ModeToggleGroup from '../components/mode_toggle_group'
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '~/registry/ui/switch'
import { untrack } from 'solid-js/web'
import { Button } from '~/registry/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/registry/ui/tooltip'
import { FilterCaseTypeEnum, FilterCharacterTypeEnum, Options } from './types'

export interface SettingsSignal {
  skip: boolean
  refilter: boolean
}

export function Settings({options, signal}: {options: Options, signal: SettingsSignal}): JSX.Element {
  function easySetFilterCase(enabled: boolean) {
    const lastIdx = options.filterCase.length - 1
    if (enabled) {
      if (options.filterCase.length === 0 || options.filterCase[lastIdx].filter !== FilterCaseTypeEnum.AllLower) {
        options.filterCase.push({
          enabled: true,
          filter: FilterCaseTypeEnum.AllLower,
        })
      } else {
        options.filterCase[lastIdx].enabled = true
      }
    } else if (options.filterCase.length && options.filterCase[lastIdx].filter === FilterCaseTypeEnum.AllLower) {
      options.filterCase[lastIdx].enabled = false
    }
    signal.refilter = true
  }
  function easySetFilterCharacter(enabled: boolean, filter: FilterCharacterTypeEnum.Numbers | FilterCharacterTypeEnum.SpecialChars) {
    const lastIdx = options.filterCase.length - 1
    if (options.filterCharacter.length === 0 || typeof options.filterCharacter[lastIdx].filter !== 'number') {
      if (enabled) options.filterCharacter.push({enabled, filter})
    } else if (options.filterCharacter[lastIdx].filter === filter || options.filterCharacter[lastIdx].filter === FilterCharacterTypeEnum.None) {
      options.filterCharacter[lastIdx].enabled = enabled
      options.filterCharacter[lastIdx].filter = filter
    } else if (options.filterCharacter[lastIdx].filter === FilterCharacterTypeEnum.NumberAndSpecialChars) {
      if (options.filterCharacter[lastIdx].enabled === false) {
        options.filterCharacter[lastIdx].enabled = enabled
        options.filterCharacter[lastIdx].filter = filter
      } else if (!enabled) {
        options.filterCharacter[lastIdx].filter ^= filter
      }
    } else {
      if (options.filterCharacter[lastIdx].enabled === true) {
        options.filterCharacter[lastIdx].filter |= filter
      } else {
        options.filterCharacter[lastIdx].enabled = true
        options.filterCharacter[lastIdx].filter = filter
      }
    }
    signal.refilter = true
  }

  const [open, setOpen] = createSignal(false)

  const emptydiv = <div class='w-full -mt-1 mb-1'/>

  const button = <div
    class='p-2 cursor-pointer hover:bg-muted/50 transition-all duration-300 rounded active:bg-muted-foreground/40 motion-rotate-in-45'
    onClick={() => setOpen(x => !x)}
  >
    <IconSettings class='size-5' />
  </div>

  return <Popover anchorRef={() => emptydiv as any} open={open()} onOpenChange={setOpen}>
    <PopoverTrigger>
      {emptydiv}
      <Show when={!open()}>
        <div onClick={e => e.stopPropagation()} class='motion-preset-slide-up-right'>
          {button}
        </div>
      </Show>
    </PopoverTrigger>
    <PopoverContent class='border-muted absolute overflow-visible motion-preset-slide-down-left space-y-5'>
      <Show when={open()}>
        <div class='flex flex-row items-end w-full h-full'>
          <ModeToggleGroup class='border border-muted rounded-lg' />
          <div class='w-full' />
          <div class='motion-preset-slide-down-left motion-delay-75'>
            {button}
          </div>
        </div>
      </Show>

      <Slider
        minValue={2}
        maxValue={200}
        defaultValue={untrack(() => options.wordCount)}
        getValueLabel={(params) => <strong class='mr-1'>
          {params.values[0] !== params.values[1]? `${params.values[0]} ~ ${params.values[1]}`: params.values[0]}
        </strong> as any}
        onChange={(val) => options.wordCount = val as [number, number]}
        class='space-y-3 '
      >
        <div class='flex w-full justify-between'>
          <SliderLabel>Word count</SliderLabel>
          <SliderValueLabel />
        </div>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
          <SliderThumb />
        </SliderTrack>
      </Slider>

      <Switch
        class='flex items-center space-x-2'
        onChange={allow => easySetFilterCase(allow)}
        defaultChecked={
          options.filterCase.length !== 0 &&
          options.filterCase.at(-1)!.filter === FilterCaseTypeEnum.AllLower &&
          options.filterCase.at(-1)!.enabled
        }
      >
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class='ml-auto text-md'>
          <Tooltip>
            <TooltipTrigger>
              Normalize Case
            </TooltipTrigger>
            <TooltipContent>
              Lower case all the words
            </TooltipContent>
          </Tooltip>
        </SwitchLabel>
      </Switch>

      <Switch
        class='flex items-center space-x-2'
        onChange={allow => easySetFilterCharacter(allow, FilterCharacterTypeEnum.Numbers)}
        defaultChecked={
          options.filterCharacter.length !== 0 &&
          typeof options.filterCharacter.at(-1)!.filter === 'number' &&
          options.filterCharacter.at(-1)!.enabled &&
          ((options.filterCharacter.at(-1)!.filter as FilterCharacterTypeEnum) & FilterCharacterTypeEnum.Numbers) === FilterCharacterTypeEnum.Numbers
        }
      >
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class='ml-auto text-md'>
          <Tooltip>
            <TooltipTrigger>
              Filter Numbers
            </TooltipTrigger>
            <TooltipContent>
              Filter out all numbers in the text
            </TooltipContent>
          </Tooltip>
        </SwitchLabel>
      </Switch>

      <Switch
        class='flex items-center space-x-2'
        onChange={allow => easySetFilterCharacter(allow, FilterCharacterTypeEnum.SpecialChars)}
        defaultChecked={
          options.filterCharacter.length !== 0 &&
          typeof options.filterCharacter.at(-1)!.filter === 'number' &&
          options.filterCharacter.at(-1)!.enabled &&
          ((options.filterCharacter.at(-1)!.filter as FilterCharacterTypeEnum) & FilterCharacterTypeEnum.SpecialChars) === FilterCharacterTypeEnum.SpecialChars
        }
      >
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class='ml-auto text-md'>
          <Tooltip>
            <TooltipTrigger>
              Filter Special
            </TooltipTrigger>
            <TooltipContent>
              Filter out all special characters in the text
            </TooltipContent>
          </Tooltip>
        </SwitchLabel>
      </Switch>

      <Tooltip>
        <TooltipTrigger>
          <Button class='bg-warning text-warning-foreground hover:bg-warning-foreground hover:text-warning transition-colors duration-300' onClick={() => signal.skip = true}>
            Skip
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Skip the text that is currently being shown
        </TooltipContent>
      </Tooltip>
    </PopoverContent>
  </Popover>
}

