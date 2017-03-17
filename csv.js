(function (){
  "use strict";

  // set up data
  var cardArray = trelloHelper.cardToArray();

  // set up CSV file
  var trelloData = trelloHelper.data();
  var csvHeaders = trelloHelper.getCSVHeaders(trelloData.cardData[0]);
  var csvContent = utils.getCSVContent(cardArray, csvHeaders);
  utils.downloadCSVFile(csvContent, 'trello');


})();
