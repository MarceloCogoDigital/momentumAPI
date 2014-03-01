/**
 * This api endpoint functions to allow users to register with our service using custom creds
 */
    
var aud = "Custom";
var currentRequest;
var crypto = require('crypto');
var iterations = 1000;
var bytes = 32;
 
/**
 * A POST request with an JSON (NS DICT in case of iOS) containing firstname, lastname, email, age,
 * gender, and password is required in the body of the request. If passes validation then is inserted
 * into appuser table and a JWC token is returned
 */
exports.post = function(request, response) {
    var mssql = request.service.mssql;
    currentRequest = request;    
    var appuser = currentRequest.service.tables.getTable('appuser');	

    //if body is empty send back bad request code
    if(!currentRequest.body){
        response.send(400, { Status : 'FAIL', Error: 'Body of request is empty idiot'});
    }else{
        //else parse JSON for appropriate values and create item object
        var item = {
                     password : currentRequest.body.password,
                     emailAddress : currentRequest.body.emailAddress,
                     birthday : currentRequest.body.birthday,
                     Gender_idGender : currentRequest.body.Gender_idGender,
                     firstName : currentRequest.body.firstName,
                     lastName : currentRequest.body.lastName                 
                    };
                    console.log('user item created');
    }
    
    //return bad request if password is too short    
    if (item.password.length < 7) {
        console.log('submitted password was too short')
        response.send(400, { Status : 'FAIL', Error: 'Invalid password (at least 7 chars required)'});
        return;
    }
	appuser.where({ emailAddress : item.emailAddress}).read({
		success: function(results) {
			if (results.length > 0) {
                console.log('submitted email already in appuser table');
                response.send(400, { Status : 'FAIL', Error: 'This email already exists'});
				return;
			}
			else {
                console.log("Creating appuser data");
				
                //generate salt for hashing and add to user item
                item.salt = createSalt();
				hash(item.password, item.salt, function(err, h) {
					item.password = h;    
                    
                    //insert item into appuser table
                    var params = [item.password,item.firstName,item.lastName,item.Gender_idGender,item.emailAddress,item.birthday, item.salt];
                    var sql = "INSERT INTO appuser (password, firstName, lastName, Gender_idGender, emailAddress, birthday, salt) VALUES (?, ?,?,?,?, ?, ?);"
                    mssql.query(sql, params, {
                        success: function(results) {   
                
                                                   
                            var userIdforToken = aud + ":" + item.emailAddress;          
                            //item.userId = userId; - not necessary
						    
                            // We don't want the salt or the password going back to the client
						    delete item.password;
						    delete item.salt;
                                                 
                            //get record idUser to send back to app
                            appuser.where({ emailAddress : item.emailAddress}).read({
		                      success: function(results) {
                                  if(results.length > 0){
                                      
                                      //add tokena and record id to send back to user
                                      item.idUser = results[0].idUser;
                                      item.token = zumoJwt(aud, item.userIdforToken, request.service.config.masterKey);
                                      
                                      console.log("Found newly inserted record");
                                      response.send(201, item);  
                                  }else{
                                      console.log("Couldn't find newly inserted record");
                                      response.send(500, "Couldn't find newly inserted record");
                                  }
                              }
                            });
                            
                            
                        }      
                        
                    })
				});
			}
		}
	});
};

exports.get = function(request, response) {
    response.send(statusCodes.OK, { message : 'Hello World!' });
};

//salting and hashing and tokening functions
function createSalt() {
	return new Buffer(crypto.randomBytes(bytes)).toString('base64');
}
 
function hash(text, salt, callback) {
	crypto.pbkdf2(text, salt, iterations, bytes, function(err, derivedKey){
		if (err) { callback(err); }
		else {
			var h = new Buffer(derivedKey).toString('base64');
			callback(null, h);
		}
	});
}
 
 function zumoJwt(aud, userId, masterKey) {
 
 	function base64(input) {
		return new Buffer(input, 'utf8').toString('base64');
	}
 
	function urlFriendly(b64) {
		return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(new RegExp("=", "g"), '');
	}
 
	function signature(input) {
		var key = crypto.createHash('sha256').update(masterKey + "JWTSig").digest('binary');
		var str = crypto.createHmac('sha256', key).update(input).digest('base64');
		return urlFriendly(str);
	}
	
 
	var s1 = '{"alg":"HS256","typ":"JWT","kid":0}';
	var j2 = {
		"exp": new Date().setUTCDate(new Date().getUTCDate() + 4000),
		"iss":"urn:microsoft:windows-azure:zumo",
		"ver":1,
		"aud":aud,
		"uid":userId 
	};
	var s2 = JSON.stringify(j2);
	var b1 = urlFriendly(base64(s1));
	var b2 = urlFriendly(base64(s2));
	var b3 = signature(b1 + "." + b2);
    console.log('jwt: ', [b1,b2,b3].join("."));
	return [b1,b2,b3].join(".");
}
 
function slowEquals(a, b) {
	var diff = a.length ^ b.length;
    for (var i = 0; i < a.length && i < b.length; i++) {
        diff |= (a[i] ^ b[i]);
	}
    return diff === 0;
}