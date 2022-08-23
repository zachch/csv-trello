(async function () {
  'use strict'

  /** source code for executeModule function */
  const declareExecuteModule = async function executeModule (srcText) {
    const script = document.createElement('script')
    script.type = 'module'
    script.innerHTML = srcText
    const scriptOnload = new Promise(resolve => {
      script.onload = resolve
    })

    document.head.appendChild(script)
    await scriptOnload
  }.toString()

  /**
   * Wraps source code in an async immediately-invoked function expression (IIFE).
   * @param srcText source code to wrap
   * @returns {string} wrapped source code
   */
  function asyncIife (srcText) {
    return `(async function () {
      ${srcText}
    })()`
  }

  /**
   * Executes some source code in the tab's context, including first importing the function downloadTrelloBoardCsv from lib/trello.js.
   * @param srcText source code to execute in the tab's context
   * @returns {Promise<void>} when the script has loaded in the tab's context
   */
  async function importModuleAndExecute (srcText) {
    return new Promise(resolve => {
      chrome.tabs.executeScript({
        code: asyncIife(`
${declareExecuteModule}
await executeModule(\`
  import { downloadTrelloBoardCsv } from "${chrome.runtime.getURL('lib/csv.js')}"
  ${srcText.replace(/`/g, '\\`')}
\`)
`)
      }, resolve)
    })
  }

  function getAllCheckboxes () {
    return Array.from(document.querySelectorAll('input[type="checkbox"]'))
  }

  function getConfig () {
    const checkboxes = getAllCheckboxes()
    return Object.fromEntries(checkboxes.map(checkbox => [checkbox.id, checkbox.checked]))
  }

  /**
   * Wraps a function, delaying its actual execution until you have not called it for delay milliseconds.
   * @param fn the function to debounce
   * @param delay milliseconds to wait before actually calling the inner function
   * @returns {(function(): void)|*} a function you can call as often you like, but that will only call the inner function after delay milliseconds of silence
   */
  function debounce (fn, delay = 100) {
    let timeout
    return function () {
      clearTimeout(timeout)
      timeout = setTimeout(fn, delay)
    }
  }

  /**
   * Saves current state of checkboxes to localStorage.
   */
  function saveConfig () {
    const config = getConfig()
    globalThis.localStorage.setItem('config', JSON.stringify(config))
  }

  /**
   * Loads any config from localStorage and applies it to the checkboxes.
   */
  function loadConfig () {
    try {
      const configJson = globalThis.localStorage.getItem('config')
      const config = JSON.parse(configJson)
      if (config) {
        const checkboxes = getAllCheckboxes()
        checkboxes.forEach(checkbox => {
          if (typeof config[checkbox.id] !== 'undefined') {
            checkbox.checked = config[checkbox.id]
          }
        })
      }
    } catch (error) {
      console.warn('Error loading config:', error)
    }
  }

  /**
   * Registers click listener to an element, toggling defined checkboxes when the element is clicked.
   * @param clickElementId id for the element to click to toggle checkboxes
   * @param checkboxSelector selector for the checkboxes to toggle
   */
  function onElementClickedClickCheckboxes (clickElementId, checkboxSelector) {
    const clickElement = document.getElementById(clickElementId)
    const checkboxes = document.querySelectorAll(checkboxSelector)
    clickElement.addEventListener(
      'click',
      () => checkboxes.forEach(checkbox => checkbox.click())
    )
  }

  /**
   * Tracks an event via Google Analytics.
   * @param event
   */
  function trackEvent (...event) {
    globalThis._gaq = globalThis._gaq || []
    globalThis._gaq.push(['_trackEvent', ...event])
  }

  // Execution starts here when the popup opens.
  window.addEventListener('unload', () => trackEvent('BrowserAction Popup', 'Closed'))

  loadConfig()
  const debouncedSaveConfig = debounce(saveConfig)
  getAllCheckboxes().forEach(checkbox => checkbox.addEventListener('change', debouncedSaveConfig))

  onElementClickedClickCheckboxes('toggle-all', 'input[type="checkbox"]')
  onElementClickedClickCheckboxes('desc', 'input[type="checkbox"][id^="desc-"]')

  document.getElementById('export-button').addEventListener('click', async function () {
    const config = getConfig()
    const configJson = JSON.stringify(config)
    await importModuleAndExecute(`await downloadTrelloBoardCsv(${configJson})`)
  })

  // pre-load module, execute nothing
  await importModuleAndExecute('')
})()
