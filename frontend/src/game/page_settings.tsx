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
import { WordLength } from './history'
import { Options } from './types'

export function Settings({options}: {options: Options}): JSX.Element {
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
        minValue={10}
        maxValue={100}
        defaultValue={untrack(() => [options.wordCount])}
        getValueLabel={(params) => <strong class='mr-1'>{params.values}</strong> as any}
        onChange={([len]) => options.wordCount = len}
        class='space-y-3 '
      >
        <div class='flex w-full justify-between'>
          <SliderLabel>Word count</SliderLabel>
          <SliderValueLabel />
        </div>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
      </Slider>

      {/*
      <Switch class='flex items-center space-x-2' onChange={allow => hard.allowAny = allow} defaultChecked={untrack(() => hard.allowAny)}>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class='ml-auto text-md'>
          <Tooltip>
            <TooltipTrigger>
              Allow Any Word
            </TooltipTrigger>
            <TooltipContent>
              Allow any word to be used, even if not in the database.
            </TooltipContent>
          </Tooltip>
        </SwitchLabel>
      </Switch>

      <Switch class='flex items-center space-x-2' onChange={allow => soft.fastInvalidate = allow} defaultChecked={untrack(() => soft.fastInvalidate)}>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>

        <SwitchLabel class='ml-auto text-md'>
          <Tooltip>
            <TooltipTrigger>
              Fast Invalidate
            </TooltipTrigger>
            <TooltipContent>
              Fast invalidation of incorrect input (for words that are not in db).
            </TooltipContent>
          </Tooltip>
        </SwitchLabel>
      </Switch>

      <Tooltip>
        <TooltipTrigger>
          <Button class='bg-warning text-warning-foreground hover:bg-warning-foreground hover:text-warning transition-colors duration-300' onClick={() => soft.reveal = true}>
            Reveal
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Reveals and then skips the current word.
        </TooltipContent>
      </Tooltip>
      */}
    </PopoverContent>
  </Popover>
}

