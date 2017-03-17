var utils = {
  // JSON UTILITIES
  loadJSON: function loadJSON(path, success, error){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          if (success)
            success(JSON.parse(xhr.responseText));
        } else {
          if (error)
            error(xhr);
        }
      }
    }
    xhr.open("GET", path, false);
    xhr.send();
  },

  getCSVContent: function getCSVContent(contentArray, headerArray){
    var csvContent = "data:text/csv;charset=utf-8,";
    contentArray.unshift(headerArray);
    contentArray.forEach(function(card, index){
      csvContent += card; 
      csvContent += "\n";
    });
    return csvContent;
  },
  
  downloadCSVFile: function downloadCSVFile(csvContent, name){
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    var d = new Date();
    var timestamp = d.getTime();
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", name + '_'+timestamp+'.csv');
    document.body.appendChild(link); // Required for FF
    link.click();
  }

}
