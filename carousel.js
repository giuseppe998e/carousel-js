/**
 * Copyright (C) 2020 Giuseppe Eletto
 * 
 * "Carousel.js" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * "Carousel.js" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with "Carousel.js". If not, see <http://www.gnu.org/licenses/>.
 */

"use strict"

const Carousel = function(params) {
  // ---------------------------------------------
  // Private Constants
  // ---------------------------------------------
  const INSTANCE = {}

  const CAROUSEL = (() => {
    if (typeof params.container !== 'string') {
      throw 'The "container" option must be an ID or class name!'
    }

    return document.querySelector(params.container)
  })()

  const ITEMS = (() => {
    if (typeof params.items !== 'string') {
      throw 'The "items" option must be a class name!'
    }

    return CAROUSEL.querySelectorAll(params.items)
  })()

  const ITEM_CLASSNAME = (() => {
    if (typeof ITEMS === 'object' && ITEMS instanceof NodeList) {
      return ITEMS[0].className
    }

    return null
  })()

  const CONTROLS = (() => {
    if (typeof params.controls !== 'undefined') {
      if (typeof params.controls !== 'string') {
        throw 'Container controls found in DOM!'
      }
  
      return CAROUSEL.querySelector(params.controls)
    }
    
    return false
  })()

  const CONTROLS_CLASSNAME = (() => {
    if (typeof CONTROLS === 'object' && CONTROLS instanceof Element) {
      return CONTROLS.className
    }

    return null
  })()

  const CONTROLS_TEXT = (() => {
    if (typeof params.controlsText !== 'undefined') {
      if (!(params.controlsText instanceof Array)) {
        throw 'The "controlsText" option must be an array!'
      }
  
      return params.controlsText
    }
    
    return ['<<', '>>']
  })()

  const AUTOPLAY = (() => {
    if (typeof params.autoplay !== 'undefined') {
      if (typeof params.autoplay !== 'number') {
        throw 'The "autoplay" option must be a number!'
      }

      return params.autoplay
    }
    
    return false
  })()

  // ---------------------------------------------
  // Private Methods
  // ---------------------------------------------
  const setInitialState = () => {
    const itemsLength = ITEMS.length
    const middleItem = Math.floor((itemsLength - 1) / 2)

    ITEMS.forEach((item, index) => item.setAttribute('data-index', index))
    ITEMS[middleItem].classList.add(`${ITEM_CLASSNAME}-selected`)
    if (itemsLength == 1) {
      return false
    }

    ITEMS[modulo(middleItem - 1, itemsLength)].classList.add(`${ITEM_CLASSNAME}-previous`)
    ITEMS[modulo(middleItem + 1, itemsLength)].classList.add(`${ITEM_CLASSNAME}-next`)

    return true
  }
  
  const setState = (direction, [selected, previous, beforePrev, next, afterNext]) => {
    previous.classList.remove(`${ITEM_CLASSNAME}-previous`)
    selected.classList.remove(`${ITEM_CLASSNAME}-selected`)
    next.classList.remove(`${ITEM_CLASSNAME}-next`)

    if (direction == 'next') {
      selected.classList.add(`${ITEM_CLASSNAME}-previous`)
      next.classList.add(`${ITEM_CLASSNAME}-selected`)
      afterNext.classList.add(`${ITEM_CLASSNAME}-next`)
    }
    
    else if (direction == 'previous') {
      beforePrev.classList.add(`${ITEM_CLASSNAME}-previous`)
      previous.classList.add(`${ITEM_CLASSNAME}-selected`)
      selected.classList.add(`${ITEM_CLASSNAME}-next`)
    }
    
    else {
      console.log(`Carousel: setState() -> Direction unknown! (Value: ${direction})`)
    }
  }

  const getState = () => {
    const itemsLength = ITEMS.length

    const previous = CAROUSEL.querySelector(`.${ITEM_CLASSNAME}-previous`)
    const selected = CAROUSEL.querySelector(`.${ITEM_CLASSNAME}-selected`)
    const next = CAROUSEL.querySelector(`.${ITEM_CLASSNAME}-next`)

    let indexBeforePrevious = parseInt(previous.getAttribute('data-index'))
    indexBeforePrevious = modulo(indexBeforePrevious - 1, itemsLength)

    let indexAfterNext = parseInt(next.getAttribute('data-index'))
    indexAfterNext = modulo(indexAfterNext + 1, itemsLength)

    const beforePrev = CAROUSEL.querySelector(`.${ITEM_CLASSNAME}[data-index='${indexBeforePrevious}']`)
    const afterNext = CAROUSEL.querySelector(`.${ITEM_CLASSNAME}[data-index='${indexAfterNext}']`)

    return [selected, previous, beforePrev, next, afterNext]
  }

  const setAutoplay = () => {
    if (AUTOPLAY > 0) {
      setInterval(() => setState('next', getState()), AUTOPLAY)
    }
  }

  const initControls = () => {
    if (!CONTROLS) {
      return
    }

    const previousBtn = CONTROLS.appendChild(document.createElement('button'))
    const nextBtn = CONTROLS.appendChild(document.createElement('button'))

    previousBtn.className = `${CONTROLS_CLASSNAME}-previous`
    nextBtn.className = `${CONTROLS_CLASSNAME}-next`

    previousBtn.insertAdjacentHTML('beforeend', CONTROLS_TEXT[0])
    nextBtn.insertAdjacentHTML('beforeend', CONTROLS_TEXT[1])

    previousBtn.addEventListener('click', () => setState('previous', getState()), false)
    nextBtn.addEventListener('click', () => setState('next', getState()), false)
  }
  
  const setMouseListener = () => {
    let drag = false
    let clickX = 0

    // Mouse drag
    CAROUSEL.addEventListener('mousedown', e => {
      drag = false
      clickX = e.pageX
      e.preventDefault()
    }, false)

    CAROUSEL.addEventListener('mousemove', e => {
      drag = true
      e.preventDefault()
    }, false)

    CAROUSEL.addEventListener('mouseup', e => {
      if (!drag) return
      const distX = e.pageX - clickX

      if (distX < -30) {
        setState('next', getState())
      } else if (distX > 30) {
        setState('previous', getState())
      }

      e.preventDefault()
    }, false)

    // Mouse Wheel
    CAROUSEL.addEventListener('wheel', e => {
      setState(e.deltaY > 0 ? 'next' : 'previous', getState())
      e.preventDefault()
    }, false)
  }

  const setTouchListener = () => {
    let startX = 0

    // Touch Swipe
    CAROUSEL.addEventListener('touchstart', e => {
      startX = e.changedTouches[0].pageX
      e.preventDefault()
    }, false)

    CAROUSEL.addEventListener('touchmove', e => e.preventDefault())

    CAROUSEL.addEventListener('touchend', e => {
      const distX = e.changedTouches[0].pageX - startX
      setState(distX < 0 ? 'next' : 'previous', getState())
      e.preventDefault()
    }, false)
  }
  
  const modulo = (x, y) => { // Util
    // Fixed modulo operator for negative numbers
    return ((x % y) + y) % y
  }

  // ---------------------------------------------
  // Public Methods
  // ---------------------------------------------
  INSTANCE.previous = () => setState('previous', getState())

  INSTANCE.next = () => setState('next', getState())

  // ---------------------------------------------
  // Main Function
  // ---------------------------------------------
  if (setInitialState()){
    initControls()

    setMouseListener()
    setTouchListener()

    setAutoplay()
  }

  return INSTANCE;
}

