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

  window.onunload = function onPopupClose () {
    globalThis._gaq = globalThis._gaq || []
    globalThis._gaq.push(['_trackEvent', 'BrowserAction Popup', 'Closed'])
  }

  await importModuleAndExecute('await downloadTrelloBoardCsv()')
  window.close()
})()
