import _markdown from '../vendor/markdown.js'
import { cleanStringify, getValuesFromHash, stringify, toCsvValue } from './utils.js'

const { markdownToAtlassianWikiMarkup } = _markdown
const CUSTOM_FIELD_PREFIX = 'Custom Field: '

export function getBoardID (pathname) {
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

export async function getBoardData (boardID) {
  const url = getAPIEndpoint(boardID)
  const response = await fetch(url)
  return response.json()
}

function sortBy (property) {
  return function (a, b) {
    return a[property] < b[property] ? -1 : 1
  }
}

function getChecklistItemAsMarkdown (checklistItem) {
  if (checklistItem.state === 'complete') {
    return `* ~~${checklistItem.name}~~`
  }
  return `* ${checklistItem.name}`
}

function getChecklistsAsMarkdown (boardDataChecklists, card) {
  const checklists = boardDataChecklists.filter(checklist => checklist.idCard === card.id)
  const byPos = sortBy('pos')
  return checklists
    .sort(byPos)
    .map(checklist => `### ${checklist.name}

${
      checklist.checkItems
      .sort(byPos)
      .map(getChecklistItemAsMarkdown)
      .join('\n')
}`)
    .join('\n\n')
}

function getCardToCsvLines (
  config,
  boardDataLists,
  boardDataMembers,
  boardDataCustomFields,
  boardDataChecklists
) {
  return function cardToCsvLines (card) {
    const cardLine = cardToString(
      config,
      boardDataLists,
      boardDataMembers,
      boardDataCustomFields,
      boardDataChecklists,
      card
    )
    return [
      cardLine
    ]
  }
}

function columnFullOrder (boardDataCustomFields) {
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
    'idAttachmentCover',
    'attachments',
    ...customFieldColNames(boardDataCustomFields)
  ]
}

function getListLookUp (lists) {
  const listLookUp = {}
  for (const key in lists) {
    listLookUp[lists[key].id] = lists[key].name
  }
  return listLookUp
}

export function cardToArray (
  config,
  boardDataLists,
  boardDataMembers,
  boardDataCustomFields,
  boardDataChecklists,
  boardDataCards
) {
  const cardToCsvLines = getCardToCsvLines(
    config,
    boardDataLists,
    boardDataMembers,
    boardDataCustomFields,
    boardDataChecklists
  )
  return boardDataCards.flatMap(cardToCsvLines)
}

export function getCSVHeaders (boardDataCustomFields) {
  return columnFullOrder(boardDataCustomFields).join(',')
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

function processMemberIds (boardDataMembers, membersInCard = [], type) {
  const memberLookUp = getMemberLookUp(boardDataMembers, type)
  return membersInCard
    .map(memberId => memberLookUp[memberId])
    .join(', ')
}

function getAttachmentURLs (attachments = []) {
  return attachments
    .map(attachment => attachment.url)
    .join(', ')
}

function jiraCompatibleLabel (label) {
  if (!label) {
    return ''
  }
  return label.replace(/\s+/g, '-')
}

function cardToString (
  config,
  boardDataLists,
  boardDataMembers,
  boardDataCustomFields,
  boardDataChecklists,
  card
) {
  const defaultContentHandler = (content) => [content]
  const listLookUp = getListLookUp(boardDataLists)
  const contentHandlers = {
    id: (content) => {
      const idCard = cleanStringify(content)
      const createdAt = new Date(1000 * parseInt(idCard.substring(0, 8), 16))
      return [idCard, createdAt.toISOString()]
    },
    createdAt: () => [],
    idList: (content) => [listLookUp[content]],
    idMembers: (content) => [
      processMemberIds(boardDataMembers, content, 'initials'),
      processMemberIds(boardDataMembers, content, 'fullName')
    ],
    name: (content) => {
      const name = cleanStringify(content)
      const pointReg = /[(](\x3f|\d*\.?\d+)([)])\s?/m
      const parsed = name.match(pointReg)
      const points = parsed ? parsed[1] : ''
      const cleanName = name.replace(pointReg, '')
      return [cleanName, points]
    },
    desc: (content) => {
      const shouldAppendChecklists = config['desc-append-checklists']
      const shouldAppendLink = config['desc-append-card-link'] && card?.url

      const descSegments = [
        stringify(content).trim(),
        shouldAppendChecklists ? getChecklistsAsMarkdown(boardDataChecklists, card) : undefined,
        shouldAppendLink ? `_Imported from ${card.url}._` : undefined
      ]
      const description = descSegments.filter(Boolean).join('\n\n---\n\n')

      if (config['desc-jira-compatible']) {
        return markdownToAtlassianWikiMarkup(description).trim()
      }
      return description
    },
    points: () => [],
    membersFullName: () => [],
    labels: (content) => {
      const labels = [...content].map(label => label.name || label.color)
      const shouldAppendListName = config['labels-append-list-name']
      return [
        [
          shouldAppendListName ? listLookUp[card.idList] : undefined,
          ...labels
        ]
          .filter(Boolean)
          .map(label => label.trim())
          .map(config['labels-jira-compatible'] ? jiraCompatibleLabel : a => a)
          .join(config['labels-jira-compatible'] ? ' ' : ',')
      ]
    },
    badges: (content) => [getVotesFromBadges(content)],
    attachments: (content) => [getAttachmentURLs(content)]
  }

  const headers = columnFullOrder(boardDataCustomFields)
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

function getListCustomFieldValueFromId (boardDataCustomFields, idCustomField, idValue) {
  const customField = boardDataCustomFields.find(customField => customField.id === idCustomField)
  if (!customField) {
    return 'idValue not found'
  }
  return getOptionValueFromIdValue(customField.options, idValue)
}

function getCustomFieldTypeFromId (boardDataCustomFields, idCustomField) {
  const customField = boardDataCustomFields.find(customField => customField.id === idCustomField)
  return customField?.type
}

function getCustomFieldValue (boardDataCustomFields, cardCustomField) {
  const type = getCustomFieldTypeFromId(boardDataCustomFields, cardCustomField.idCustomField)
  if (type === 'list') {
    return getListCustomFieldValueFromId(boardDataCustomFields, cardCustomField.idCustomField, cardCustomField.idValue)
  }
  return getValuesFromHash(cardCustomField.value)
}

function getCustomFieldIdFromName (boardDataCustomFields, customFieldName) {
  const customField = boardDataCustomFields.find(customField => customField.name === customFieldName)
  return customField?.id
}

function getCustomFieldDataValue (boardDataCustomFields, card, customFieldName) {
  if (!('customFieldItems' in card)) {
    return undefined
  }
  const customFieldId = getCustomFieldIdFromName(boardDataCustomFields, customFieldName)
  const cardCustomField = card.customFieldItems.find(cardCustomField => cardCustomField.idCustomField === customFieldId)
  if (!cardCustomField) {
    return ''
  }
  return getCustomFieldValue(boardDataCustomFields, cardCustomField)
}

function customFieldColNames (boardDataCustomFields) {
  return boardDataCustomFields.map(field => CUSTOM_FIELD_PREFIX + field.name)
}
