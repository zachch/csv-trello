(function (){
  chrome.browserAction.onClicked.addListener(function(tab) {
    "use strict";
    chrome.tabs.executeScript({
      file: 'csv.js'
    });
  });
})();
