exports.post = function(request, response) {

    var charity = request.service.tables.getTable('charity');	
    var sql = 'SELECT * FROM charity';
    var mssql = request.service.mssql; 
    
    //these are the names of the charities the user has 
    var receivedNames = request.body.charitynames;          
              
    mssql.query(sql, {
        success: function(results) {
            if (results.length > 0) {
               
               //create a new array to hold the charities
               //that are not on the phone
               var array = new Array();
                
               //for all charity records 
               for(var i = 0;  i < results.length; i++){
                    //var to signify whether a user has a charity
                    var containsCharity = false;
                    for(var j = 0; j < receivedNames.length; j++){
                        //if the user has the charity then assign to true
                        if(results[i].charityName == receivedNames[j]){
                            containsCharity = true;
                        }
                    }
                    //add charity to that user doesn't have to
                    //send back to user
                    if(!containsCharity){
                        array.push(results[i]);
                    }
               }
               
               response.send(200,array);
            
            } else {
                //console.log('No charities found.');
                request.respond(200, 'No charities found');
            }
        }
    });
  
};

exports.get = function(request, response) {

};