import { cardToArray, getBoardName, getCSVHeaders } from './trello.js'
import { downloadCSVFile, getCSVContent } from './utils.js'

export async function downloadTrelloBoardCsv () {
  // set up data
  const cardArray = await cardToArray()

  // set up CSV file
  const boardName = await getBoardName()
  const csvHeaders = await getCSVHeaders()
  const csvContent = getCSVContent(cardArray, csvHeaders)

  // download CSV file
  downloadCSVFile(csvContent, boardName)
}
