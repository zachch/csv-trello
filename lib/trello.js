var trelloHelper = (function () {

  function getBoardID() {
    const pathname = window.location.pathname;
    const boardID = /\/b\/(\w*)(\/*)/.exec(pathname);
    if (!boardID) {
      alert('Not a Trello board!');
      throw 'Cannot detect Trello board';
    }
    return boardID[1];
  }

  function cardFieldArray() {
    return [
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
    ];
  }

  function getCardFields(all = true) {
    const fields = all
      ? cardFieldArray()
      : ['idList', 'name', 'url'];
    return 'card_fields=' + encodeURIComponent(fields.join(','));
  }

  function getAPIEndpoint(boardID) {
    return 'https://trello.com/1/boards/' +
      boardID +
      '?lists=open&cards=open&card_attachments=true&card_stickers=true&'
      + 'card_customFieldItems=true&customFields=true&'
      + getCardFields()
      + '&card_checklists=all&members=all&member_fields=fullName%2C'
      + 'initials%2CmemberType%2Cusername%2CavatarHash%2Cbio%2CbioData%2C'
      + 'confirmed%2Cproducts%2Curl%2Cstatus&membersInvited=all&'
      + 'membersInvited_fields=fullName%2Cinitials%2CmemberType%2C'
      + 'username%2CavatarHash%2Cbio%2CbioData%2Cconfirmed%2Cproducts%2'
      + 'Curl&checklists=all&organization=true&'
      + 'organization_fields=name%2CdisplayName%2Cdesc%2CdescData%2C'
      + 'url%2Cwebsite%2Cprefs%2Cmemberships%2ClogoHash%2Cproducts&'
      + 'myPrefs=true&fields=name%2Cclosed%2CdateLastActivity%2C'
      + 'dateLastView%2CidOrganization%2Cprefs%2CshortLink%2CshortUrl%2C'
      + 'url%2Cdesc%2CdescData%2Cinvitations%2Cinvited%2ClabelNames%2C'
      + 'memberships%2Cpinned%2CpowerUps%2Csubscribed';
  }


  function getBoardData(boardID) {
    let boardData = [];
    utils.loadJSON(
      getAPIEndpoint(boardID),
      data => {
        boardData = data;
      },
      xhr => {
        alert('Error in receiving list and card data.' + xhr);
        throw 'Failed to receive data from Trello';
      }
    );
    return boardData;
  }

  const boardID = getBoardID();
  const boardData = getBoardData(boardID);
  const listData = boardData.lists;
  const cardData = boardData.cards;
  const checklistData = boardData.checklists;
  const memberData = boardData.members;
  const customFieldsData = boardData.customFields;
  let issueId = 0; // global counter for the "Issue ID" field

  return {
    boardName() {
      return boardData.name;
    },

    cardToArray() {
      return cardData.flatMap(trelloHelper.cardToCsvLines);
    },

    customFieldColNames() {
      return customFieldsData.map(field => 'Custom Field: ' + field.name);
    },

    // Arguments
    // card: Card data
    // customFieldName: Name of the custom field to get value from
    // Return value: Custom Field Data
    //
    // Structure of CustomFields data in board
    //
    // customFields": Array[5][
    //  {
    //    "id": "5ac8dc7adb0ee1467bb8a04d",
    //    "idModel": "58cfb09f06dc6b1d6738cdd8",
    //    "modelType": "board",
    //    "fieldGroup": "6ec3b308a9ace59dad22145b84b09cb0aeb515a89e40f366efa795718517335f",
    //    "name": "Testing",
    //    "pos": 8192,
    //    "type": "text"
    //  },
    //  {
    //    "id": "5a986718d6afbd6de1d306af",
    //    "idModel": "58cfb09f06dc6b1d6738cdd8",
    //    "modelType": "board",
    //    "fieldGroup": "6a6641fde71b2eb9843ad63f232385d592648bae0330c38fdc71ad322f7c338d",
    //    "name": "Points",
    //    "pos": 16384,
    //    "type": "number"
    //  },
    //  {
    //    "id": "5a986718d6afbd6de1d306b1",
    //    "idModel": "58cfb09f06dc6b1d6738cdd8",
    //    "modelType": "board",
    //    "fieldGroup": "32e07b2bfb57633e77f8d8ce19d227a98965b1147d6732b76dd7a6a4521efdf6",
    //    "name": "Date",
    //    "pos": 32768,
    //    "type": "date"
    //  },
    //  {
    //    "id": "5a986718d6afbd6de1d306b3",
    //    "idModel": "58cfb09f06dc6b1d6738cdd8",
    //    "modelType": "board",
    //    "fieldGroup": "0228f149d51015841bbffacafeb69a80ce39651b132947c5cb9edc26e9f4a5ae",
    //    "name": "Dropdown list",
    //    "pos": 49152,
    //    "options": Array[3][
    //      {
    //        "id": "5a986718d6afbd6de1d306b4",
    //        "idCustomField": "5a986718d6afbd6de1d306b3",
    //        "value": { "text": "First option" },
    //        "color": "none",
    //        "pos": 16384
    //      },
    //      {
    //        "id": "5a986718d6afbd6de1d306b5",
    //        "idCustomField": "5a986718d6afbd6de1d306b3",
    //        "value": { "text": "Second option" },
    //        "color": "none",
    //        "pos": 32768
    //      },
    //      {
    //        "id": "5a986718d6afbd6de1d306b6",
    //        "idCustomField": "5a986718d6afbd6de1d306b3",
    //        "value": { "text": "Third option" },
    //        "color": "none",
    //        "pos": 49152
    //      }
    //    ],
    //    "type": "list"
    //  },
    //  {
    //    "id": "5a986718d6afbd6de1d306b8",
    //    "idModel": "58cfb09f06dc6b1d6738cdd8",
    //    "modelType": "board",
    //    "fieldGroup": "6e9d0922e8f0dd377abb8b9a00ab2e6a2a91beb88ff97420c1f32f53e1b81243",
    //    "name": "Checkbox",
    //    "pos": 65536,
    //    "type": "checkbox"
    //  }
    //
    // Structure of Card customFieldItems array
    //
    // customFieldItems": Array[5][
    //  {
    //    "id": "5ac8dd12ba34a94a7b140c85",
    //    "value": { "number": "45" },
    //    "idCustomField": "5a986718d6afbd6de1d306af",
    //    "idModel": "58cfb0d0bba6621d9907afef",
    //    "modelType": "card"
    //  },
    //  {
    //    "id": "5ac99edcbd4ef2040522e92a",
    //    "value": { "date": "2018-04-09T04:00:00.000Z" },
    //    "idCustomField": "5a986718d6afbd6de1d306b1",
    //    "idModel": "58cfb0d0bba6621d9907afef",
    //    "modelType": "card"
    //  },
    //  {
    //    "id": "5ac99edefd8d530f5102fe48",
    //    "idValue": "5a986718d6afbd6de1d306b4",
    //    "idCustomField": "5a986718d6afbd6de1d306b3",
    //    "idModel": "58cfb0d0bba6621d9907afef",
    //    "modelType": "card"
    //  },
    //  {
    //    "id": "5ac99ee049349651cc0e7bce",
    //    "value": { "checked": "true" },
    //    "idCustomField": "5a986718d6afbd6de1d306b8",
    //    "idModel": "58cfb0d0bba6621d9907afef",
    //    "modelType": "card"
    //  },
    //  {
    //    "id": "5ac99ee3f76fefa74b6cacbb",
    //    "value": { "text": "123" },
    //    "idCustomField": "5a986718d6afbd6de1d306ba",
    //    "idModel": "58cfb0d0bba6621d9907afef",
    //    "modelType": "card"
    //  },
    //
    //
    getCustomFieldDataValue(card, customFieldName) {
      if (!('customFieldItems' in card)) {
        return undefined
      }
      const customFieldId = trelloHelper.getCustomFieldIdFromName(customFieldName);
      const cardCustomField = card.customFieldItems.find(cardCustomField => cardCustomField.idCustomField === customFieldId);
      if (!cardCustomField) {
        return ''
      }
      return trelloHelper.getCustomFieldValue(cardCustomField);
    },

    getCustomFieldIdFromName(customFieldName) {
      const customField = customFieldsData.find(customField => customField.name === customFieldName);
      return customField?.id;
    },

    getCustomFieldValue(cardCustomField) {
      const type = trelloHelper.getCustomFieldTypeFromId(cardCustomField.idCustomField);
      if (type === 'list') {
        return trelloHelper.getListCustomFieldValueFromId(cardCustomField.idCustomField, cardCustomField.idValue);
      }
      return utils.getValuesFromHash(cardCustomField.value);
    },

    getCustomFieldTypeFromId(idCustomField) {
      const customField = customFieldsData.find(customField => customField.id === idCustomField);
      return customField?.type;
    },

    getListCustomFieldValueFromId(idCustomField, idValue) {
      const customField = customFieldsData.find(customField => customField.id === idCustomField);
      if (!customField) {
        return 'idValue not found';
      }
      return trelloHelper.getOptionValueFromIdValue(customField.options, idValue);
    },

    getOptionValueFromIdValue(options, idValue) {
      const option = options.find(option => option.id === idValue);
      if (!option) {
        return undefined;
      }
      return utils.getValuesFromHash(option.value, ',');
    },

    columnFullOrder() {
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
        ...trelloHelper.customFieldColNames(),
      ]
    },


    cardToCsvLines(card) {
      card = {
        ...card,
        'Issue Id': card['Issue Id'] ?? issueId++,
      };
      const cardLine = trelloHelper.cardToString(card);
      return [
        cardLine,
      ]
    },

    cardToString(card) {
      const values = [];
      const headers = trelloHelper.columnFullOrder();

      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        const content = card[header];
        if (header.match(/^Custom\sField:/)) {
          const customFieldDataName = header.match(/^Custom\sField:\s*(.*)\s*$/)[1];
          const customFieldDataValue = trelloHelper.getCustomFieldDataValue(card, customFieldDataName);
          values.push(customFieldDataValue);
        } else {
          switch (header) {
            case 'id':
              const idCard = utils.cleanStringify(content);
              const createdAt = new Date(1000 * parseInt(idCard.substring(0, 8), 16));
              values.push(idCard);
              values.push(createdAt);
              break;
            case 'createdAt':
              break;
            case 'idList':
              const listLookUp = trelloHelper.getListLookUp(listData);
              values.push(listLookUp[content]);
              break;
            case 'idMembers':
              values.push(trelloHelper.processMemberIds(content));
              values.push(trelloHelper.processMemberIds(content, 'fullName'));
              break;
            case 'name':
              const name = utils.cleanStringify(content);
              const pointReg = /[(](\x3f|\d*\.?\d+)([)])\s?/m;
              const parsed = name.match(pointReg);
              const points = parsed ? parsed[1] : '';
              const cleanName = name.replace(pointReg, '');
              values.push(cleanName);
              values.push(points);
              break;
            case 'labels':
              const labels = (content ?? []).map(label => label.name || label.color);
              values.push(labels.join(','));
              break;
            case 'badges':
              values.push(trelloHelper.getVotesFromBadges(content));
              break;
            case 'attachments':
              values.push(trelloHelper.getAttachmentURLs(content));
              break;
            case 'points':
              break;
            case 'membersFullName':
              break;
            case 'Issue Id':
              values.push(content);
              break;
            case 'Parent Id':
              values.push(content);
              break;
            default:
              values.push(content);
              break;
          }
        }
      }
      return values
        .map(utils.toCsvValue)
        .join(',')
    },

    getCSVHeaders() {
      return trelloHelper.columnFullOrder()
        .join(',');
    },

    getListLookUp(lists) {
      const listLookUp = {};
      for (const key in lists) {
        listLookUp[lists[key].id] = lists[key].name;
      }
      return listLookUp;
    },

    getAttachmentURLs(attachments = []) {
      return attachments
        .map(attachment => attachment.url)
        .join(', ');
    },

    /**
     * Sample data of a badge
     * "badges": { "votes": 2, "attachmentsByType": { "trello": { "board": 0, "card": 0 } }
     * @param badges
     * @returns {string}
     */
    getVotesFromBadges(badges) {
      if (!(badges?.votes)) {
        return "";
      }
      return "Votes: " + badges.votes;
    },

    getMemberLookUp(members, type = 'initials') {
      const lookUp = {};
      for (const index in members) {
        lookUp[members[index].id] = members[index][type];
      }
      return lookUp;
    },

    processMemberIds(membersInCard = [], type = 'initials') {
      const memberLookUp = trelloHelper.getMemberLookUp(memberData, type);
      return membersInCard
        .map(memberId => memberLookUp[memberId])
        .join(', ');
    }
  };

})();
