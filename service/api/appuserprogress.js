/**
 * Handles appuser progress updates and applies correct updates to appropriate tables. This 
 * approach places the logic in the api as opposed to solo progress challenge which just
 * updates the table and lets a sql after update trigger do the work
 */
exports.post = function(request, response) {
   var challengeProgress = request.service.tables.getTable('solochallengeprogress');
   var sql = 'SELECT User_idUser, soloChallenge_idsoloChallenge';
   var mssql = request.service.mssql; 
   var appUser;
   
   //get updates in request body
   var item = {
       User_idUser : request.body.User_idUser,
       soloChallenge_idsoloChallenge : request.body.idsoloChallenge,
       steps : request.body.steps,
       walkD : request.body.walkD,
       runD : request.body.runD,
       cycleD : request.body.cycleD,
       challengeComplete : request.body.challengeComplete,
       sChallengeType_idsChallengeType : request.body.sChallengeType_idsChallengeType,
       sChallengeAmountRaised : request.body.amountRaised
   };
     
     //query challengeprogress table to find users progress record
     challengeProgress.where({ User_idUser: item.User_idUser, 
              soloChallenge_idsoloChallenge : item.soloChallenge_idsoloChallenge }).read({
        success: function(results) {
            if (results.length === 0) {
                //solochallengeprogress record could not be found
                response.send(400, "Userid or challenge id incorrect. Could not locate progress");
            }
            else {
                
                //update progress (updates all progress fields. Based on the assumption that the
                //app user has the most up to date progress values)
                var paramProgress = [item.steps,item.walkD,item.runD,item.cycleD,item.sChallengeAmountRaised,item.User_idUser,item.soloChallenge_idsoloChallenge];
                var sqlprogress = "UPDATE solochallengeprogress SET steps=?, walkD=?, runD=?,cycleD=?,sChallengeAmountRaised=? WHERE User_idUser=? AND soloChallenge_idsoloChallenge=?";
                mssql.query(sqlprogress, paramProgress, {
                    success: function(results) {
                        if (results.length = 1) {
                            console.log("challengeprogress record updated. Updating appuser total...");
                            
                            //update userTotals 
                            var sqlsel = "SELECT * FROM appuser WHERE idUser =?";
                            mssql.query(sqlsel, item.User_idUser, {
                                success : function(results) {
                                    
                                    //add progress to appuser totals
                                    if(results.length = 1){
                                       //assign to variable for later use
                                       appUser = results[0];
                                        
                                        if(item.steps != 0){
                                            results[0].totalSteps += item.steps;
                                        }
                                        if(item.walkD != 0){
                                            results[0].totalWalkDist += item.walkD;
                                        }
                                        if(item.runD != 0){
                                            results[0].totalRunDist += item.runD;
                                        }
                                        if(item.cycleD != 0){
                                            results[0].totalCycleDist += item.CycleD;
                                        }
                                        if(item.sChallengeAmountRaised != 0){
                                            results[0].totalAmountRaised += item.sChallengeAmountRaised;
                                        }
                                        
                                        //update database appuser record with new values
                                        var sqlappuserUD = "UPDATE appuser SET totalSteps=?,totalWalkDist=?,totalRunDist=?,totalCycleDist=?,totalAmountRaised=? WHERE idUser=?";
                                        var paramsappuserUD = [results[0].totalSteps,results[0].totalWalkDist,results[0].totalRunDist,results[0].totalCycleDist,results[0].totalAmountRaised];
                                        
                                        mssql.query(sqlappuserUD, paramsappuserUD, {
                                            success : function(results) {
                                                if(results.length = 1){
                                                    console.log("Appuser record updated. Checking challenge completion status...")
                                                }
                                                else{
                                                    console.log("Found more than one appuser record. BAD");
                                                    response.send(400, "User total update completed with some errors ");
                                                }
                                            }
                                        });
                                    }else{
                                        console.log("Could not find user record for update");
                                        response.send(400,"Progress update complete, but could not update totals for appuser record");
                                    }
                                }
                            }); 
                        }else{
                            console.log("Challengeprogress update returned unexpected result");
                            response.send(400, "Update succeeded with some errors" );
                        }
                    }
                });
            }

        }
    });
  
    //if challenge has been marked as complete, update appropriate tables
    if(item.challengeComplete == "false"){
        response.send(200, "Update completed successfully");
        console.log("Update completed successfully");    
    }else{
        console.log("Challenge complete: updating associated tables");
        var paramsAppUser = [item.User_idUser];
        var sql = "SELECT * FROM UserCharity WHERE User_idUser =  AND CharityCurrent = true";
        mssql.query(sql, paramsAppUser, {
            success: function(results) {
                if (results.length = 1) {
                    results[0].userCharityAmount += appUser.totalAmountRaised;
                }else{
                    console.log("More than one UserCharity record returned form query. BAD");
                }
            }
        });    
    }
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};