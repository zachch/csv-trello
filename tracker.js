globalThis._gaq = globalThis._gaq || []
globalThis._gaq.push(['_setAccount', 'UA-178666574-1'])
globalThis._gaq.push(['_trackEvent', 'BrowserAction Button', 'Click', chrome.runtime.getManifest().version]);

(function () {
  const ga = document.createElement('script')
  ga.type = 'text/javascript'
  ga.async = true
  ga.src = 'https://ssl.google-analytics.com/ga.js'
  const s = document.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(ga, s)
})()
