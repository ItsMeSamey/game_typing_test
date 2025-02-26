import { JSX, onCleanup, onMount } from "solid-js"


export function Keyboard(): JSX.Element {
  let keyboardRef: SVGSVGElement = undefined as any
  
  function elementByCode(code: string) {
    return keyboardRef.querySelector(`[data-key='${code}']`)
  }
  function handleKeyDown(e: KeyboardEvent) {
    const children = elementByCode(e.code)?.children
    if (!children) return
    children[0].setAttribute('class', 'fill-muted-foreground')
    for (let i = 1; i < children.length; i++) {
      children[i].setAttribute('class', 'fill-background')
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    const children = elementByCode(e.code)?.children
    if (!children) return
    children[0].setAttribute('class', 'fill-muted')
    for (let i = 1; i < children.length; i++) {
      children[i].setAttribute('class', 'fill-foreground')
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
  })

  return (
    <svg class='text-xs tracking-tight motion-preset-slide-down motion-delay-100 motion-ease-out' x='15' y='15' width='598.5' height='198' overflow='visible' ref={keyboardRef}>
      <svg x='0' y='0' width='38' height='38' data-key='Backquote'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>`</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>~</text>
      </svg>
      <svg x='40' y='0' width='38' height='38' data-key='Digit1'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>1</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>!</text>
      </svg>
      <svg x='80' y='0' width='38' height='38' data-key='Digit2'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>2</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>@</text>
      </svg>
      <svg x='120' y='0' width='38' height='38' data-key='Digit3'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>3</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>#</text>
      </svg>
      <svg x='160' y='0' width='38' height='38' data-key='Digit4'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>4</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>$</text>
      </svg>
      <svg x='200' y='0' width='38' height='38' data-key='Digit5'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>5</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>%</text>
      </svg>
      <svg x='240' y='0' width='38' height='38' data-key='Digit6'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>6</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>^</text>
      </svg>
      <svg x='280' y='0' width='38' height='38' data-key='Digit7'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>7</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>&amp;</text>
      </svg>
      <svg x='320' y='0' width='38' height='38' data-key='Digit8'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>8</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>*</text>
      </svg>
      <svg x='360' y='0' width='38' height='38' data-key='Digit9'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>9</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>(</text>
      </svg>
      <svg x='400' y='0' width='38' height='38' data-key='Digit0'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>0</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>)</text>
      </svg>
      <svg x='440' y='0' width='38' height='38' data-key='Minus'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>-</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>_</text>
      </svg>
      <svg x='480' y='0' width='38' height='38' data-key='Equal'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>=</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>+</text>
      </svg>
      <svg x='520' y='0' width='78' height='38' data-key='Backspace'>
        <rect class='fill-muted' x='0' y='0' width='78' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Backspace</text>
      </svg>
      <svg x='0' y='40' width='58' height='38' data-key='Tab'>
        <rect class='fill-muted' x='0' y='0' width='58' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Tab</text>
      </svg>
      <svg x='60' y='40' width='38' height='38' data-key='KeyQ'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>Q</text>
      </svg>
      <svg x='100' y='40' width='38' height='38' data-key='KeyW'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>W</text>
      </svg>
      <svg x='140' y='40' width='38' height='38' data-key='KeyE'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>E</text>
      </svg>
      <svg x='180' y='40' width='38' height='38' data-key='KeyR'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>R</text>
      </svg>
      <svg x='220' y='40' width='38' height='38' data-key='KeyT'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>T</text>
      </svg>
      <svg x='260' y='40' width='38' height='38' data-key='KeyY'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>Y</text>
      </svg>
      <svg x='300' y='40' width='38' height='38' data-key='KeyU'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>U</text>
      </svg>
      <svg x='340' y='40' width='38' height='38' data-key='KeyI'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>I</text>
      </svg>
      <svg x='380' y='40' width='38' height='38' data-key='KeyO'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>O</text>
      </svg>
      <svg x='420' y='40' width='38' height='38' data-key='KeyP'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>P</text>
      </svg>
      <svg x='460' y='40' width='38' height='38' data-key='BracketLeft'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>[</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>{'{'}</text>
      </svg>
      <svg x='500' y='40' width='38' height='38' data-key='BracketRight'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>]</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>{'}'}</text>
      </svg>
      <svg x='540' y='40' width='58' height='38' data-key='Backslash'>
        <rect class='fill-muted' x='0' y='0' width='58' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>\</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>|</text>
      </svg>
      <svg x='0' y='80' width='68' height='38' data-key='CapsLock'>
        <rect class='fill-muted' x='0' y='0' width='68' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Caps Lock</text>
      </svg>
      <svg x='70' y='80' width='38' height='38' data-key='KeyA'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>A</text>
      </svg>
      <svg x='110' y='80' width='38' height='38' data-key='KeyS'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>S</text>
      </svg>
      <svg x='150' y='80' width='38' height='38' data-key='KeyD'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>D</text>
      </svg>
      <svg x='190' y='80' width='38' height='38' data-key='KeyF'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <circle class='fill-foreground' cx='19' cy='33' r='3'></circle>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>F</text>
      </svg>
      <svg x='230' y='80' width='38' height='38' data-key='KeyG'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>G</text>
      </svg>
      <svg x='270' y='80' width='38' height='38' data-key='KeyH'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>H</text>
      </svg>
      <svg x='310' y='80' width='38' height='38' data-key='KeyJ'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <circle class='fill-foreground' cx='19' cy='33' r='3'></circle>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>J</text>
      </svg>
      <svg x='350' y='80' width='38' height='38' data-key='KeyK'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>K</text>
      </svg>
      <svg x='390' y='80' width='38' height='38' data-key='KeyL'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>L</text>
      </svg>
      <svg x='430' y='80' width='38' height='38' data-key='Semicolon'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>;</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>:</text>
      </svg>
      <svg x='470' y='80' width='38' height='38' data-key='Quote'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>'</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>'</text>
      </svg>
      <svg x='510' y='80' width='88' height='38' data-key='Enter'>
        <rect class='fill-muted' x='0' y='0' width='88' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Enter</text>
      </svg>
      <svg x='0' y='120' width='88' height='38' data-key='ShiftLeft'>
        <rect class='fill-muted' x='0' y='0' width='88' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Shift</text>
      </svg>
      <svg x='90' y='120' width='38' height='38' data-key='KeyZ'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>Z</text>
      </svg>
      <svg x='130' y='120' width='38' height='38' data-key='KeyX'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>X</text>
      </svg>
      <svg x='170' y='120' width='38' height='38' data-key='KeyC'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>C</text>
      </svg>
      <svg x='210' y='120' width='38' height='38' data-key='KeyV'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>V</text>
      </svg>
      <svg x='250' y='120' width='38' height='38' data-key='KeyB'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>B</text>
      </svg>
      <svg x='290' y='120' width='38' height='38' data-key='KeyN'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>N</text>
      </svg>
      <svg x='330' y='120' width='38' height='38' data-key='KeyM'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>M</text>
      </svg>
      <svg x='370' y='120' width='38' height='38' data-key='Comma'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>,</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>&lt;</text>
      </svg>
      <svg x='410' y='120' width='38' height='38' data-key='Period'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>.</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>&gt;</text>
      </svg>
      <svg x='450' y='120' width='38' height='38' data-key='Slash'>
        <rect class='fill-muted' x='0' y='0' width='38' height='38'></rect>
        <text class='fill-foreground' x='10' y='27' text-anchor='middle' dominant-baseline='middle' direction='ltr'>/</text>
        <text class='fill-foreground' x='10' y='12' text-anchor='middle' dominant-baseline='middle' direction='ltr'>?</text>
      </svg>
      <svg x='490' y='120' width='108' height='38' data-key='ShiftRight'>
        <rect class='fill-muted' x='0' y='0' width='108' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Shift</text>
      </svg>
      <svg x='0' y='160' width='58' height='38' data-key='ControlLeft'>
        <rect class='fill-muted' x='0' y='0' width='58' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Ctrl</text>
      </svg>
      <svg x='60' y='160' width='58' height='38' data-key='AltLeft'>
        <rect class='fill-muted' x='0' y='0' width='58' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Alt</text>
      </svg>
      <svg x='120' y='160' width='358' height='38' data-key='Space'>
        <rect class='fill-muted' x='0' y='0' width='358' height='38'></rect>
      </svg>
      <svg x='480' y='160' width='58' height='38' data-key='AltRight'>
        <rect class='fill-muted' x='0' y='0' width='58' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Alt</text>
      </svg>
      <svg x='540' y='160' width='58' height='38' data-key='ControlRight'>
        <rect class='fill-muted' x='0' y='0' width='58' height='38'></rect>
        <text class='fill-foreground' x='10' y='20' text-anchor='start' dominant-baseline='middle' direction='ltr'>Ctrl</text>
      </svg>
    </svg>
  )
}

