import { getBoardID, getBoardData, cardToArray, getCSVHeaders } from './trello.js'
import { downloadCSVFile, getCSVContent } from './utils.js'

export async function downloadTrelloBoardCsv (config) {
  // set up data
  const boardID = getBoardID(window.location.pathname)
  const boardData = await getBoardData(boardID)
  const cardArray = cardToArray(
    config,
    boardData.lists,
    boardData.members,
    boardData.customFields,
    boardData.checklists,
    boardData.cards
  )

  // set up CSV file
  const csvHeaders = getCSVHeaders(boardData.customFields)
  const csvContent = getCSVContent(cardArray, csvHeaders)

  // download CSV file
  downloadCSVFile(csvContent, boardData.name)
}
