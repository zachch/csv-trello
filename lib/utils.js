export function getCSVContent (contentArray, headerArray) {
  const rows = [headerArray, ...contentArray, '']
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'))
}

export function downloadCSVFile (csvContent, name) {
  const timestamp = new Date().getTime()
  const link = document.createElement('a')
  link.setAttribute('href', csvContent)
  link.setAttribute('download', name + ' - ' + timestamp + '.csv')
  document.body.appendChild(link) // Required for FF
  link.click()
}

export function getValuesFromHash (hash, separator) {
  return Object.values(hash)
    .join(separator)
}

export function toCsvValue (content) {
  if (typeof content === 'undefined') {
    return ''
  }
  const s = cleanStringify(content)
  return '"' + s + '"'
}

export function cleanStringify (content) {
  return stringify(content)
    .replace(/"/g, "'")
}

export function stringify (content) {
  if (typeof content === 'undefined') {
    return ''
  }
  return '' + [content]
}
