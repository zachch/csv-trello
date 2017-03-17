(function (){
  chrome.browserAction.onClicked.addListener(function(tab) {
    "use strict";
    chrome.tabs.executeScript(
      { file: 'lib/utils.js' },
      function(){
        chrome.tabs.executeScript({ file: 'lib/trello.js'},
          function(){chrome.tabs.executeScript({
            file: 'csv.js'
          });
        });
      }
    );
  });
})();
