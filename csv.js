(function (){
  "use strict";

  function getBoardID(){
    var pathname = window.location.pathname;
    var boardID = /\/b\/(\w*)(\/*)/.exec(pathname);
    if(!boardID){
      alert('Not a Trello board!');
      throw 'Cannot detect Trello board';
    }
    return boardID[1];
  }
})();
