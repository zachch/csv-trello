var trelloHelper = (function() {

  var getBoardID = function() {
    var pathname = window.location.pathname;
    var boardID = /\/b\/(\w*)(\/*)/.exec(pathname);
    if(!boardID){
      alert('Not a Trello board!');
      throw 'Cannot detect Trello board';
    }
    return boardID[1];
  };

  var cardFieldArray = function(){
    fields = ['badges','closed','dateLastActivity','desc','descData','due',
    'idAttachmentCover','idList','idBoard','idMembers','idShort',
    'labels','idLabels','name','pos','shortUrl','shortLink',
    'subscribed','url'
    ];
    return fields;
  };

  var getCardFields = function(all=true){
    var fields = [];
    if(all == true)
      fields = cardFieldArray();
    else
      fields = ['idList','name','url'];
    var fieldText = 'card_fields=';
    for(var i=0; i < fields.length ; i++){
      fieldText += '%2C' + fields[i];
      if(i + 1 < fields.length)
        fieldText += '%2C';
    }
    return fieldText;
  };

  var getAPIEndpoint = function(boardID){
    var url = 'https://trello.com/1/boards/' +
              boardID +
              '?lists=open&cards=open&card_attachments=true&card_stickers=true&'
              + 'card_customFieldItems=true&customFields=true&'
              + getCardFields()
              + '&card_checklists=none&members=all&member_fields=fullName%2C'
              + 'initials%2CmemberType%2Cusername%2CavatarHash%2Cbio%2CbioData%2C'
              + 'confirmed%2Cproducts%2Curl%2Cstatus&membersInvited=all&'
              + 'membersInvited_fields=fullName%2Cinitials%2CmemberType%2C'
              + 'username%2CavatarHash%2Cbio%2CbioData%2Cconfirmed%2Cproducts%2'
              + 'Curl&checklists=none&organization=true&'
              + 'organization_fields=name%2CdisplayName%2Cdesc%2CdescData%2C'
              + 'url%2Cwebsite%2Cprefs%2Cmemberships%2ClogoHash%2Cproducts&'
              + 'myPrefs=true&fields=name%2Cclosed%2CdateLastActivity%2C'
              + 'dateLastView%2CidOrganization%2Cprefs%2CshortLink%2CshortUrl%2C'
              + 'url%2Cdesc%2CdescData%2Cinvitations%2Cinvited%2ClabelNames%2C'
              + 'memberships%2Cpinned%2CpowerUps%2Csubscribed'
    return url;
  };


  var getBoardData = function(boardID) {
    var boardData = [];
    utils.loadJSON(
      getAPIEndpoint(boardID),
      function(data) {
        boardData = data;
      },
      function(xhr) {
        alert('Error in receiving list and card data.'+xhr);
        throw 'Failed to receive data from Trello';
      }
    );
    return boardData;
  };

  var boardID = getBoardID();
  var boardData = getBoardData(boardID);
  var listData = boardData.lists;
  var cardData = boardData.cards;
  var memberData = boardData.members;
  var customFieldsData = boardData.customFields;

  return {

    data: function() {
      return {
        boardID: boardID,
        boardData: boardData,
        listData: listData,
        cardData: cardData,
        customFieldsData: customFieldsData
      }
    },

    cardToArray: function cardToArray(){
      var cards = cardData;
      var cardArray = [];
      cards.forEach(function(card){
        var singleCard = trelloHelper.cardToString(card);
        cardArray.push(singleCard);
      });
      return cardArray;
    },

    customFieldColNames: function(){
      fields = customFieldsData.map(function(field){
        return 'Custom Field: ' + field.name;
      });
      return fields;
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
    getCustomFieldDataValue: function(card, customFieldName){
      if(!('customFieldItems' in card))
        return
      var customFieldDataValue = ""
      var customFieldId = trelloHelper.getCustomFieldIdFromName(customFieldName);

      card.customFieldItems.forEach(function(cardCustomField){
        if(cardCustomField.idCustomField !== customFieldId)
          return;
        customFieldDataValue = trelloHelper.getCustomFieldValue(cardCustomField);
      });
      return customFieldDataValue;
    },

    getCustomFieldIdFromName: function(customFieldName){
      for(let i=0; i < customFieldsData.length; i++){
        if(customFieldName === customFieldsData[i].name)
          return customFieldsData[i].id;
      }
    },

    getCustomFieldValue: function(cardCustomField){
      var type = trelloHelper.getCustomFieldTypeFromId(cardCustomField.idCustomField);
      if(type === 'list')
        return trelloHelper.getListCustomFieldValueFromId(cardCustomField.idCustomField, cardCustomField.idValue);
      else
        return trelloHelper.getValuesFromHash(cardCustomField.value);
    },

    getCustomFieldTypeFromId: function(idCustomField){
      // TODO - use a lookup here instead?
      // { 'idofcustomfield': {customfieldhash} }
      for(let i=0; i < customFieldsData.length; i++){
        var customField = customFieldsData[i];
        if(customField.id === idCustomField)
          return customField.type;
      }
    },

    getListCustomFieldValueFromId: function(idCustomField, idValue){
      // TODO - use a lookup here instead?
      // { 'idofcustomfield': {customfieldhash} }
      for(let i=0; i < customFieldsData.length; i++){
        var customField = customFieldsData[i];
        if(customField.id === idCustomField)
          return trelloHelper.getOptionValueFromIdvalue(customField.options, idValue);
      }
      return 'idValue not found';
    },

    getOptionValueFromIdvalue: function(options, idValue){
      for(let j=0; j < options.length; j++){
        var option = options[j];
        if(option.id === idValue)
          return trelloHelper.getValuesFromHash(option.value, ',');
      }
    },

    // TODO - move this into the utils lib
    getValuesFromHash: function(hash,separator){
      var keys = Object.keys(hash);
      var values =  keys.map(function(v) { return hash[v]; });
      return values.join(separator);
    },

    columnFullOrder: function(){
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
        'attachments'
      ].concat(trelloHelper.customFieldColNames())
    },

    cardToString: function processCard(card){
      var singleCard = '';
      var headers = trelloHelper.columnFullOrder();
      for(var i=0; i < headers.length; i++){
        var header = headers[i];
        var content = card[header];
        var cleanStr =  (''+[content]).replace(/"/g,"'");
        if(header.match(/^Custom\sField:/)){
          var customFieldDataName = header.match(/^Custom\sField:\s*(.*)\s*$/)[1];
          var customFieldDataValue = trelloHelper.getCustomFieldDataValue(card, customFieldDataName);
          singleCard += '"'+customFieldDataValue+'"';
        } else {
          switch (header) {
            case 'id':
              var idCard = cleanStr;
              var createdAt = new Date(1000*parseInt(idCard.substring(0,8),16));
              singleCard += '"'+cleanStr+'"'+',"'+createdAt+'"';
              break;
            case 'createdAt':
              break;
            case 'idList':
              var listLookUp = trelloHelper.getListLookUp(listData);
              singleCard += '"'+listLookUp[content]+'"';
              break;
            case 'idMembers':
              singleCard += '"'+trelloHelper.processMemberIds(content)+'"';
              singleCard += ',';
              singleCard += '"'+trelloHelper.processMemberIds(content, 'fullName')+'"';
              break;
            case 'name':
              var name = cleanStr;
              var pointReg = /[\(](\x3f|\d*\.?\d+)([\)])\s?/m;
              var parsed = name.match(pointReg);
              var points = parsed ? parsed[1] : '';
              var cleanName = name.replace(pointReg, '');
              singleCard += '"'+cleanName+'"'+',"'+points+'"';
              break;
            case 'labels':
              var labels = [];
              content.forEach( function (label){
                if (label.name)
                  labels.push(label.name);
                else
                  labels.push(label.color);
              });
              singleCard += '"'+labels.join(',')+'"';
              break;
            case 'badges':
              singleCard += '"'+trelloHelper.getVotesFromBadges(content)+'"';
              break;
            case 'attachments':
              singleCard += '"'+trelloHelper.getAttachmentURLs(content)+'"';
              break;
            case 'points', 'membersFullName':
              break;
            default:
              singleCard += '"'+cleanStr+'"';
          }
        }

        if(i + 1 < headers.length && header != 'points'
            && header != 'createdAt' && header != 'membersFullName')
          singleCard += ',';
      }
      return singleCard;
    },

    getCSVHeaders: function() {
      return trelloHelper.columnFullOrder().join(',');
    },

    getListLookUp: function getListLookUp(lists){
      var listLookUp = {};
      for(var key in lists){
        listLookUp[lists[key].id] = lists[key].name;
      }
      return listLookUp;
    },

    getAttachmentURLs: function(attachments){
      return attachments.map(attachment => attachment.url).join(', ');
    },

    // Sample data of a badge
    // "badges": { "votes": 2, "attachmentsByType": { "trello": { "board": 0, "card": 0 } }
    getVotesFromBadges: function(badges){
      var votes = badges.votes
			if(votes === 0){ return ""; }
			return "Votes: " + votes;
    },

    getMemberLookUp: function getMemberLookUp(members, type='initials'){
      var lookUp = {};
      for(var index in members){
        lookUp[members[index].id] = members[index][type];
      }
      return lookUp;
    },

    processMemberIds: function(membersInCard, type='initials'){
      var memberLookUp = trelloHelper.getMemberLookUp(memberData, type);
      return membersInCard.map(memberId => memberLookUp[memberId]).join(', ');
    }

  };

})();
