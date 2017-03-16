(function (){
  "use strict";

  function getBoardID(){
    var pathname = window.location.pathname;
    var regex = /\/b\/(\w*)(\/*)/;
    var boardID = regex.exec(pathname);
    if(!boardID){
      alert('Not a Trello board!');
      return;
    }
    return boardID[1];
  }

})();
