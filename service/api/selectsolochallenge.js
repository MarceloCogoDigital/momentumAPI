exports.post = function(request, response) {
    var mssql = request.service.mssql;
    var challengeprogress = request.service.tables.getTable('solochallengeprogress');
    
    //the insert query to be run
    var sql = "insert into solochallengeprogress (User_idUser,soloChallenge_idsoloChallenge) values (?,?);"

     //get insert in request body
    var item = {
       User_idUser : request.body.User_idUser,
       soloChallenge_idsoloChallenge : request.body.soloChallenge_idsoloChallenge,
    };
    
    //testing
    console.log("selectsolochallenge User_idUser: " + item.User_idUser + " challengeID: " + item.soloChallenge_idsoloChallenge);
    
    //values for update query
    var params = [item.User_idUser, item.soloChallenge_idsoloChallenge ];
    
    //check table for progress record already existing
    challengeprogress.where({User_idUser : item.User_idUser, soloChallenge_idsoloChallenge : item.soloChallenge_idsoloChallenge }).read({ 
		success: function(results) {
            if(results.length > 0){
               console.log("challengeprogress record already exists");
               response.send(400, item);
            }else{
                 //run update query and hope for the best
                mssql.query(sql, params, {
                    success : function(results) {
                        
                        console.log("challengeprogress insert completed")
                        response.send(statusCodes.OK, item);
                       
                        
                    }
                });
            }
        }
    });
    
   
    
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};
