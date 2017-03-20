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
  
  var getCardFields = function(all=true){
    var fields = [];
    if(all == true)
      fields = ['badges','closed','dateLastActivity','desc','descData','due',
        'idAttachmentCover','idList','idBoard','idMembers','idShort',
        'labels','idLabels','name','pos','shortUrl','shortLink',
        'subscribed','url'
      ];
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

  return {

    data: function() {
      return {
        boardID: boardID,
        boardData: boardData,
        listData: listData,
        cardData: cardData
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

    cardToString: function processCard(card){
      var singleCard = '';
      var index = 0;
      for(var key in card){
        var cleanStr =  (''+[card[key]]).replace(/"/g,"'");
        // TODO - Member
        switch (key) {
          case 'idList':
            var listLookUp = trelloHelper.getListLookUp(listData);
            singleCard += '"'+listLookUp[card[key]]+'"';
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
            card[key].forEach( function (label){
              if (label.name)
                labels.push(label.name);
              else
                labels.push(label.color);
            });
            singleCard += '"'+labels.join(',')+'"';
            break;
          default:
            singleCard += '"'+cleanStr+'"';
        }

        if(index + 1 < Object.keys(card).length)
          singleCard += ',';
        index++;
      }
      return singleCard;
    },

    getCSVHeaders: function(card) {
      var headers = '';
      var index = 0;
      for(var key in card){
        headers += '"'+key+'"'; 
        if(key == 'name')
          headers += ',"points"'; 
        if(index + 1 < Object.keys(card).length)
          headers += ',';
        index++;
      }
      return headers;
    },

    getListLookUp: function getListLookUp(lists){
      var listLookUp = {};
      for(var key in lists){
        listLookUp[lists[key].id] = lists[key].name;
      }
      return listLookUp;
    }
  };

})();