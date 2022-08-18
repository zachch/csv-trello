import { cleanStringify, getValuesFromHash, loadJSON, toCsvValue } from './utils.js'

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
  const fields = all
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
  return 'card_fields=' + encodeURIComponent(fields.join(','))
}

function getAPIEndpoint (boardID) {
  return 'https://trello.com/1/boards/' +
    boardID +
    '?lists=open&cards=open&card_attachments=true&card_stickers=true&' +
    'card_customFieldItems=true&customFields=true&' +
    getCardFields() +
    '&card_checklists=all&members=all&member_fields=fullName%2C' +
    'initials%2CmemberType%2Cusername%2CavatarHash%2Cbio%2CbioData%2C' +
    'confirmed%2Cproducts%2Curl%2Cstatus&membersInvited=all&' +
    'membersInvited_fields=fullName%2Cinitials%2CmemberType%2C' +
    'username%2CavatarHash%2Cbio%2CbioData%2Cconfirmed%2Cproducts%2' +
    'Curl&checklists=all&organization=true&' +
    'organization_fields=name%2CdisplayName%2Cdesc%2CdescData%2C' +
    'url%2Cwebsite%2Cprefs%2Cmemberships%2ClogoHash%2Cproducts&' +
    'myPrefs=true&fields=name%2Cclosed%2CdateLastActivity%2C' +
    'dateLastView%2CidOrganization%2Cprefs%2CshortLink%2CshortUrl%2C' +
    'url%2Cdesc%2CdescData%2Cinvitations%2Cinvited%2ClabelNames%2C' +
    'memberships%2Cpinned%2CpowerUps%2Csubscribed'
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
