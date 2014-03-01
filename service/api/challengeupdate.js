exports.post = function(request, response) {

    //gets instance of appuser table
    var challenge = request.service.tables.getTable('solochallenge');	
    var sql = 'SELECT * FROM solochallenge';
    var mssql = request.service.mssql; 
    
    //these are the PK's of the challenges the user has 
    var receivedIDs = request.body.challengeID;  
    
    //query to get list of all challenges                
    mssql.query(sql, {
        success: function(results) {
            if (results.length > 0) {
              
               //create a new array to hold the challenges
               //that are not on the phone
               var array = new Array();
                
               //for all challenge records 
               for(var i = 0;  i < results.length; i++){
                    //var to signify whether a user has a challenge
                    var containsChallenge = false;
                    
                    for(var j = 0; j < receivedIDs.length; j++){
                        //if the user has the challenge then assign to true
                        if(results[i].idsoloChallenge == receivedIDs[j]){
                            containsChallenge = true;
                        }
                    }
                    //add challenge so that user doesn't have to
                    //send back to user
                    if(!containsChallenge){ 
                      array.push(results[i]); 
                    }
                     
               }
              
            //get milestones attached to challenges
            
            var mileStr;
            var sqlMile = 'select * from solomilestone;';
            
            //console.log("ARRAY: " + array[0].idsoloChallenge);
            mssql.query(sqlMile,{
                success : function(result){
                    //get appropriate milestones and add to array to return
                    for(var i = 0; i < array.length; i++){
                        var milestones = new Array();
                        
                        for(var j = 0; j < result.length; j++){
                            if(array[i].idsoloChallenge == result[j].soloChallenge_idsoloChallenge){
                                milestones.push(result[j]);
                            }
                        }
                        
                        mileStr =  JSON.stringify(milestones);
                        var test = JSON.parse(mileStr);
                        console.log("STRINGED ARRAY: "+ mileStr);
                        array[i].milestones = test;
                        
                    }
                    
                    
                    //console.log("WORK 0: " + milestones[0]);
                    //results[i].milestones = mileStr;
                    //TypeError: Converting circular structure to JSON
                    response.send(200,array);

                }
            });
            
            } else {
                console.log('No challenges found.');
                request.respond(200, 'No challenges found');
            }
        }
    });
};

exports.get = function(request, response) {
    
};