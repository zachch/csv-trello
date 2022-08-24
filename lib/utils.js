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

function isIsoDateZ (date) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(date)
}

function jiraCompatibleIsoDate (isoDateString) {
  return isoDateString.replace(/Z$/, '-0000')
}

export function toCsvValue (content) {
  if (typeof content === 'undefined') {
    return ''
  }

  const s = cleanStringify(content)
  if (typeof content === 'number') {
    return s
  }
  if (isIsoDateZ(s)) {
    return '"' + jiraCompatibleIsoDate(s) + '"'
  }
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
  const s = '' + [content]
  if (s === '[object Object]') {
    return JSON.stringify(content)
  }
  return s
}
