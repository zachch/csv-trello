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
    return 'https://trello.com/1/boards/' +
           boardID +
           '?lists=open&cards=open&card_attachments=cover&card_stickers=true&'
           + 'card_pluginData=true&'
           + 'pluginData=true&'
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
  var pluginData = boardData.pluginData;

  return {

    data: function() {
      return {
        boardID: boardID,
        boardData: boardData,
        listData: listData,
        cardData: cardData,
        pluginData: pluginData
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

    // Plugin ID of Custom Fields plugin is 56d5e249a98895a9797bebb9
    customFieldPluginData: function(){
      var customFieldsData = null;
      pluginData.forEach(function(plugin){
        if(plugin.idPlugin === "56d5e249a98895a9797bebb9")
          customFieldsData = JSON.parse(plugin.value);
      });
      return customFieldsData;
    },

    customFieldPluginFieldsArray: function(){
      var pluginData = trelloHelper.customFieldPluginData();
      if(pluginData === null)
        return [];

      var fields = [];
      var fieldsArray = pluginData.fields;
      fields = fieldsArray.map(function(field){
        return field.n;
      });
      return fields.sort();
    },

    customFieldPluginLookUp: function(){
      var pluginData = trelloHelper.customFieldPluginData();
      if(pluginData === null)
        return {};

      var lookUp = {};
      var fieldsArray = pluginData.fields;
      fieldsArray.forEach(function(field){
        lookUp[field.n] = field.id;
      });
      return lookUp;
    },

    customFieldPluginColNames: function(){
      var fieldsArray = trelloHelper.customFieldPluginFieldsArray();
      fields = fieldsArray.map(function(field){
        return 'Custom Field: ' + field;
      });
      return fields;
    },

    getCustomFieldDataValue: function(card, customFieldName){
      var pluginData = card.pluginData;
      var customFieldId = trelloHelper.customFieldPluginLookUp()[customFieldName];
      var customFieldDataValue = ""

      pluginData.forEach(function(plugin){
        if(plugin.idPlugin !== "56d5e249a98895a9797bebb9")
          return;
        var fields = JSON.parse(plugin.value).fields;
        if(customFieldId in fields)
          customFieldDataValue = fields[customFieldId];
      });

      return customFieldDataValue;
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
      ].concat(trelloHelper.customFieldPluginColNames())
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
            case 'points':
              break;
            default:
              singleCard += '"'+cleanStr+'"';
          }
        }

        if(i + 1 < headers.length && header != 'points' && header != 'createdAt')
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

    getMemberLookUp: function getMemberLookUp(members){
      var lookUp = {};
      for(var index in members){
        lookUp[members[index].id] = members[index].initials;
      }
      return lookUp;
    },

    processMemberIds: function(membersInCard){
      var memberLookUp = trelloHelper.getMemberLookUp(memberData);
      return membersInCard.map(memberId => memberLookUp[memberId]).join(', ');
    }

  };

})();
