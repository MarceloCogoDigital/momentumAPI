/*
 * This endpoint handles appuser custom logins
 * 
 */

var aud = "Custom";
var currentRequest;
var crypto = require('crypto');
var iterations = 1000;
var bytes = 32;
 
 /**
  * when appuser sends POST request to this endpoint, gets login process started
  */
exports.post = function(request, response) {    
    
    //gets instance of appuser table
    var appuser = request.service.tables.getTable('appuser');	
    
    //gets login creds from request
    var item = { emailAddress : request.body.emailAddress,
                 password : request.body.password
                };
    
    //queries appuser table for record with matching email          
    appuser.where({emailAddress : item.emailAddress}).read({ 
		success: function(results) {
			if (results.length === 0) {
				
                response.send(400, { Status : "FAIL", Error : "Incorrect email address"});
			}
			else {
                
                //store successful result from query 
				var returnedAppUser = results[0];
                //print result
                console.log(returnedAppUser);
				
                //hash password from request using salt in returned record then compare to currently
                //stored hashed password
                hash(item.password, returnedAppUser.salt, function(err, h) {
					var incoming = h;
                    
					if (slowEquals(incoming, returnedAppUser.password)) {							
						var userId = aud + ":" + returnedAppUser.emailAddress;
						response.send(200, {
							idUser: returnedAppUser.idUser,
							token:  zumoJwt(aud, userId, request.service.config.masterKey),
                            status: "SUCCESS",
                            email: returnedAppUser.emailAddress
						});
					}
					else {
                        console.error('incorrect username or password');
						response.send(400, { Status : "FAIL", Error: "Incorrect email or password."});
					}
				});
			}
		}
    });	
};

/**
 * creates random salt so hash is unique
 */
function createSalt() {
	return new Buffer(crypto.randomBytes(bytes)).toString('base64');
}
 
 /**
  * hashes the users password for storage
  */
function hash(text, salt, callback) {
	crypto.pbkdf2(text, salt, iterations, bytes, function(err, derivedKey){
		if (err) { callback(err); }
		else {
			var h = new Buffer(derivedKey).toString('base64');
			callback(null, h);
		}
	});
}
 
 /**
  * creates a JSON Web Token to return to the client
  */
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