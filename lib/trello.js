import { cleanStringify, getValuesFromHash, loadJSON, stringify, toCsvValue } from './utils.js'

const CUSTOM_FIELD_PREFIX = 'Custom Field: '

function getBoardID (pathname) {
  const boardID = /\/b\/(\w*)(\/*)/.exec(pathname)
  if (!boardID) {
    globalThis.alert('Not a Trello board!')
    throw new Error('Cannot detect Trello board')
  }
  return boardID[1]
}

function getCardFields (all = true) {
  return all
    ? [
        'badges',
        'closed',
        'dateLastActivity',
        'desc',
        'descData',
        'due',
        'idAttachmentCover',
        'idList',
        'idBoard',
        'idMembers',
        'idShort',
        'labels',
        'idLabels',
        'name',
        'pos',
        'shortUrl',
        'shortLink',
        'subscribed',
        'url'
      ]
    : ['idList', 'name', 'url']
}

function getAPIEndpoint (boardID) {
  const baseUrl = `https://trello.com/1/boards/${encodeURIComponent(boardID)}`

  const membersInvitedFields = ['fullName', 'initials', 'memberType', 'username', 'avatarHash', 'bio', 'bioData', 'confirmed', 'products', 'url']
  const memberFields = [...membersInvitedFields, 'status']
  const organizationFields = ['name', 'displayName', 'desc', 'descData', 'url', 'website', 'prefs', 'memberships', 'logoHash', 'products']
  const cardFields = getCardFields()
  const fields = [
    'name', 'closed', 'dateLastActivity', 'dateLastView', 'idOrganization', 'prefs', 'shortLink', 'shortUrl', 'url',
    'desc', 'descData', 'invitations', 'invited', 'labelNames', 'memberships', 'pinned', 'powerUps', 'subscribed'
  ]

  const queryParams = {
    lists: 'open',
    cards: 'open',
    card_attachments: true,
    card_stickers: true,
    card_customFieldItems: true,
    customFields: true,
    card_fields: cardFields,
    card_checklists: 'all',
    members: 'all',
    member_fields: memberFields,
    membersInvited: 'all',
    membersInvited_fields: membersInvitedFields,
    checklists: 'all',
    organization: true,
    organization_fields: organizationFields,
    myPrefs: true,
    fields
  }
  const queryString = Object.entries(queryParams)
    .map(
      paramEntry => paramEntry
        .map(stringify)
        .map(encodeURIComponent)
        .join('=')
    )
    .join('&')

  return [baseUrl, queryString].join('?')
}

function getBoardData (boardID) {
  let boardData = []
  loadJSON(
    getAPIEndpoint(boardID),
    data => {
      boardData = data
    },
    xhr => {
      globalThis.alert('Error in receiving list and card data.' + xhr)
      throw new Error('Failed to receive data from Trello')
    }
  )
  return boardData
}

function cardToCsvLines (card) {
  card = {
    ...card,
    'Issue Id': card['Issue Id'] ?? issueId++
  }
  const cardLine = cardToString(card)
  return [
    cardLine
  ]
}

function columnFullOrder () {
  return [
    'id',
    'createdAt',
    'closed',
    'dateLastActivity',
    'idList',
    'name',
    'points',
    'desc',
    'idMembers',
    'membersFullName',
    'labels',
    'due',
    'shortUrl',
    'url',
    'pos',
    'idBoard',
    'idShort',
    'shortLink',
    'subscribed',
    'badges',
    'idLabels',
    'stickers',
    'descData',
    'idAttachementCover',
    'attachments',
    ...customFieldColNames()
  ]
}

function getListLookUp (lists) {
  const listLookUp = {}
  for (const key in lists) {
    listLookUp[lists[key].id] = lists[key].name
  }
  return listLookUp
}

const boardID = getBoardID(window.location.pathname)
const boardData = getBoardData(boardID)
const listLookUp = getListLookUp(boardData.lists)

let issueId = 0 // global counter for the "Issue ID" field

export function getBoardName () { return boardData.name }

export function cardToArray () {
  return boardData.cards.flatMap(cardToCsvLines)
}

export function getCSVHeaders () {
  return columnFullOrder().join(',')
}

/**
 * Sample data of a badge
 * "badges": { "votes": 2, "attachmentsByType": { "trello": { "board": 0, "card": 0 } }
 * @param badges
 * @returns {string}
 */
function getVotesFromBadges (badges) {
  if (!(badges?.votes)) {
    return ''
  }
  return 'Votes: ' + badges.votes
}

function getMemberLookUp (members, type = 'initials') {
  const lookUp = {}
  for (const index in members) {
    lookUp[members[index].id] = members[index][type]
  }
  return lookUp
}

function processMemberIds (membersInCard = [], type) {
  const memberLookUp = getMemberLookUp(boardData.members, type)
  return membersInCard
    .map(memberId => memberLookUp[memberId])
    .join(', ')
}

function getAttachmentURLs (attachments = []) {
  return attachments
    .map(attachment => attachment.url)
    .join(', ')
}

function cardToString (card) {
  const defaultContentHandler = (content) => [content]
  const contentHandlers = {
    id: (content) => {
      const idCard = cleanStringify(content)
      const createdAt = new Date(1000 * parseInt(idCard.substring(0, 8), 16))
      return [idCard, createdAt]
    },
    createdAt: () => [],
    idList: (content) => [listLookUp[content]],
    idMembers: (content) => [
      processMemberIds(content, 'initials'),
      processMemberIds(content, 'fullName')
    ],
    name: (content) => {
      const name = cleanStringify(content)
      const pointReg = /[(](\x3f|\d*\.?\d+)([)])\s?/m
      const parsed = name.match(pointReg)
      const points = parsed ? parsed[1] : ''
      const cleanName = name.replace(pointReg, '')
      return [cleanName, points]
    },
    points: () => [],
    membersFullName: () => [],
    labels: (content) => {
      const labels = [...content].map(label => label.name || label.color)
      return [labels.join(',')]
    },
    badges: (content) => [getVotesFromBadges(content)],
    attachments: (content) => [getAttachmentURLs(content)]
  }

  const headers = columnFullOrder()
  return headers
    .flatMap(header => {
      if (header.startsWith(CUSTOM_FIELD_PREFIX)) {
        const customFieldDataName = header.replace(CUSTOM_FIELD_PREFIX, '').trim()
        const customFieldDataValue = getCustomFieldDataValue(card, customFieldDataName)
        return [customFieldDataValue]
      }

      const handler = contentHandlers[header] ?? defaultContentHandler
      const content = card[header]
      return handler(content)
    })
    .map(toCsvValue)
    .join(',')
}

function getOptionValueFromIdValue (options, idValue) {
  const option = options.find(option => option.id === idValue)
  if (!option) {
    return undefined
  }
  return getValuesFromHash(option.value, ',')
}

function getListCustomFieldValueFromId (idCustomField, idValue) {
  const customField = boardData.customFields.find(customField => customField.id === idCustomField)
  if (!customField) {
    return 'idValue not found'
  }
  return getOptionValueFromIdValue(customField.options, idValue)
}

function getCustomFieldTypeFromId (idCustomField) {
  const customField = boardData.customFields.find(customField => customField.id === idCustomField)
  return customField?.type
}

function getCustomFieldValue (cardCustomField) {
  const type = getCustomFieldTypeFromId(cardCustomField.idCustomField)
  if (type === 'list') {
    return getListCustomFieldValueFromId(cardCustomField.idCustomField, cardCustomField.idValue)
  }
  return getValuesFromHash(cardCustomField.value)
}

function getCustomFieldIdFromName (customFieldName) {
  const customField = boardData.customFields.find(customField => customField.name === customFieldName)
  return customField?.id
}

function getCustomFieldDataValue (card, customFieldName) {
  if (!('customFieldItems' in card)) {
    return undefined
  }
  const customFieldId = getCustomFieldIdFromName(customFieldName)
  const cardCustomField = card.customFieldItems.find(cardCustomField => cardCustomField.idCustomField === customFieldId)
  if (!cardCustomField) {
    return ''
  }
  return getCustomFieldValue(cardCustomField)
}

function customFieldColNames () {
  return boardData.customFields.map(field => CUSTOM_FIELD_PREFIX + field.name)
}
