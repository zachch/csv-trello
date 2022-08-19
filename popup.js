(function () {
  'use strict'
  chrome.tabs.executeScript(
    { file: 'lib/utils.js' },
    function () {
      chrome.tabs.executeScript({ file: 'lib/trello.js' },
        function () {
          chrome.tabs.executeScript({ file: 'csv.js' },
            function () {
              window.close()
              _gaq.push(['_trackEvent', 'BrowserAction Popup', 'Closed'])
            }
          )
        })
    }
  )
})()
