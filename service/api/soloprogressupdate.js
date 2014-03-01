/**
 * Handles progress updates. This version leaves the cascading updates up to a SQL trigger as opposed
 * to handling it all here
 */

exports.post = function(request, response) {
   
    var mssql = request.service.mssql;
    var challengeprogress = request.service.tables.getTable('solochallengeprogress');
    
    //the update query to be run
    var sql = "update solochallengeprogress set steps=?,walkD=?,runD=?,cycleD=?,challengeComplete=?,sChallengeAmountraised= ? where User_idUser=? AND soloChallenge_idsoloChallenge = ?;"

     //get updates in request body
    var item = {
       User_idUser : request.body.User_idUser,
       soloChallenge_idsoloChallenge : request.body.soloChallenge_idsoloChallenge,
       steps : request.body.steps,
       walkD : request.body.walkD,
       runD : request.body.runD,
       cycleD : request.body.cycleD,
       challengeComplete : request.body.challengeComplete,
       sChallengeAmountRaised : request.body.sChallengeAmountRaised
    };
    
    console.log(" "+ item.User_idUser + " " + item.soloChallenge_idsoloChallenge + " " + item.steps + " " + item.walkD + " "+ item.runD + " " + item.cycleD + " " + item.challengeComplete + " " + item.sChallengeAmountRaised);
    
    //values for update query
    var params = [item.steps,item.walkD,item.runD,item.cycleD,item.challengeComplete, item.sChallengeAmountRaised, item.User_idUser, item.soloChallenge_idsoloChallenge];
    
    //run update query and hope for the best
    mssql.query(sql, params, {
        success : function(results) {
            if(results.length = 1){
                console.log("Update completed")
                response.send(statusCodes.OK, item);
            }
            else{
                console.log("progress update failed");
                response.send(500, "progress update failed");
            }
        }
    });  
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};