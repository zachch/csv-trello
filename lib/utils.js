// eslint-disable-next-line no-var
var utils = {
  // JSON UTILITIES
  loadJSON (path, success, error) {
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          if (success) { success(JSON.parse(xhr.responseText)) }
        } else {
          if (error) { error(xhr) }
        }
      }
    }
    xhr.open('GET', path, false)
    xhr.send()
  },

  getCSVContent (contentArray, headerArray) {
    const rows = [headerArray, ...contentArray, '']
    return 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'))
  },

  downloadCSVFile (csvContent, name) {
    const timestamp = new Date().getTime()
    const link = document.createElement('a')
    link.setAttribute('href', csvContent)
    link.setAttribute('download', name + ' - ' + timestamp + '.csv')
    document.body.appendChild(link) // Required for FF
    link.click()
  },

  getValuesFromHash: function (hash, separator) {
    return Object.values(hash)
      .join(separator)
  },

  stringify: function stringify (content) {
    return '' + [content]
  },

  cleanStringify: function cleanStringify (content) {
    return utils.stringify(content)
      .replace(/"/g, "'")
  },

  toCsvValue: function toCsvValue (content) {
    const s = utils.cleanStringify(content)
    return '"' + s + '"'
  }

}
