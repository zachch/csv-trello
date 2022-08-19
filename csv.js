(function () {
  'use strict'

  // set up data
  const cardArray = trelloHelper.cardToArray()

  // set up CSV file
  const boardName = trelloHelper.boardName()
  const csvHeaders = trelloHelper.getCSVHeaders()
  const csvContent = utils.getCSVContent(cardArray, csvHeaders)
  utils.downloadCSVFile(csvContent, boardName)
})()
