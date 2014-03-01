//ISSUE HERE: DOESNT HANDLE CHANGE OF CHARITY VERY WELL - 
//SEEMS ID'S NEED TO BE SENT THROUGH AS STRINGS - TESTED AND SEEMS TO BE WORKING!

exports.post = function(request, response) {
    var mssql = request.service.mssql;
    var charitydonation = request.service.tables.getTable('userdonation');
    
    //the update query to be run
    var sqlinsert = "insert into userdonation (User_idUser,Charity_idCharity,CharityCurrent) values (?,?,1);"

    //get items to insert in request body
    var item = {
       User_idUser : request.body.User_idUser,
       Charity_idCharity : request.body.Charity_idCharity,
       CharityCurrent : 1
    };
    
    //values for update query
    var paramsinsert = [item.User_idUser, item.Charity_idCharity];
   
   
    //check for current charities user is supporting and set currentcharity to false
    charitydonation.where({User_idUser : item.User_idUser, CharityCurrent : item.CharityCurrent }).read({ 
		success: function(results) {
            console.log("first where");
			//if a record is returned
            if (results.length > 0) {
                console.log('current charity found');
                //if the users current charity is the same just leave it
                if(results[0].Charity_idCharity == item.Charity_idCharity){
                   console.log("charity already current charity of user");
                   response.send(statusCodes.OK, item);
                }else{
                    //set current charity to false for returned record
    				var sqlupdate = "update userdonation set CharityCurrent = 0 where User_idUser = ? and Charity_idCharity = ?;"
                    var paramsupdate = [results[0].User_idUser,results[0].Charity_idCharity]; 
                    
                    //update the returned record
                    mssql.query(sqlupdate, paramsupdate, {
                        success : function(results) {
            
                            console.log("current charity found and updated to not current");
                            
                             //check if a record already exists for this user and charity
                             charitydonation.where({User_idUser : item.User_idUser, Charity_idCharity : item.Charity_idCharity}).read({
                                success: function(result) {
                                    if(result.length > 0){
                                        console.log("record for this user and charity exists. Updating to current...");
                                        
                                        var sqlUpdate = 'update userdonation set CharityCurrent = 1 where User_idUser = ? and Charity_idCharity = ?;';
                                        var updateParams = [item.User_idUser, item.Charity_idCharity];
                                        
                                        //update the existing record to make current charity
                                        mssql.query(sqlUpdate, updateParams,{
                                            success : function(results){
                                                console.log('existing userdonation record found and made current');
                                                response.send(200, item);
                                            }
                                        }); 
                                    }else{
                                         //insert new user donation record with currently selected charity
                                        mssql.query(sqlinsert, paramsinsert, {
                                            success : function(results) {
                                               
                                                console.log("donation record insert completed")
                                                response.send(statusCodes.OK, item);
                                               
                                            }
                                        });  
                                    }
              
                                }
                             });
                             
                        }
                    });
                    
                    
                }
			}else{
                //check if a record already exists for this user and charity
                console.log(item.User_idUser + " " + item.Charity_idCharity);
                charitydonation.where({User_idUser : item.User_idUser, Charity_idCharity : item.Charity_idUser}).read({
                    success: function(results) {
                        //if(results.length > 0){
                            console.log('charity found but not current');
                            var sqlUpdate = 'update userdonation set CharityCurrent = 1 where User_idUser = ? and Charity_idCharity = ?;';
                            var updateParams = [item.User_idUser, item.Charity_idCharity];
                            
                            //update the existing charity to make current charity
                            mssql.query(sqlUpdate, updateParams,{
                                success : function(results){
                                    console.log('userdonation record found and made current');
                                    response.send(200, item);
                                }
                            }); 
                       // }else{
                             
                            //if a current charity wasn't found then run insert query and hope for the best
                            mssql.query(sqlinsert, paramsinsert, {
                                success : function(results) {
                                
                                    console.log("donation insert completed")
                                    response.send(statusCodes.OK, item);
                                    
                                }
                            }); 
                        
                       // }
                    }
                });
                 
               
                
            }
        }
    });  
    
   
   
    
   
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};