'use strict';
/*
 'use strict' is not required but helpful for turning syntactical errors into true errors in the program flow
 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
 */

/*
 Modules make it possible to import JavaScript files into your application.  Modules are imported
 using 'require' statements that give you a reference to the module.

 It is a good idea to list the modules that your application depends on in the package.json in the project root
 */
var util = require('util');
//var hfc  = require("/anodesdk/Nov03/fabric-sdk-node");
//var hfc  = require("/root/gopath/src/fabric-sdk-node");
var hfc  = require(__dirname+"/../../..");

/*
 Once you 'require' a module you can reference the things that it exports.  These are defined in module.exports.

 For a controller in a127 (which this is) you should export the functions referenced in your Swagger document by name.

 Either:
 - The HTTP Verb of the corresponding operation (get, put, post, delete, etc)
 - Or the operationId associated with the operation in your Swagger document

 In the starter/skeleton project the 'get' operation on the '/hello' path has an operationId named 'hello'.  Here,
 we specify that in the exports of this module that 'hello' maps to the function named 'hello'
 */
module.exports = {
	proposal : proposal
};

/*
 Functions in a127 controllers used for operations should take two parameters:

 Param 1: a handle to the request object
 Param 2: a handle to the response object
 */
function proposal(req, res) {
	console.log("**** start proposal ****");

	var name = req.swagger.params.name.value;
	if (!name) {
		writeError(res, null, "User name is missing");
		return;
	}

	var password = req.swagger.params.password.value;
	if (!password) {
		writeError(res, null, "User password is missing");
		return

	}

	console.log(" -- have user name of " + name);

	//
	// Create and configure the chain
	//
	var chain = hfc.getChain("testChain", true);
	chain.setKeyValueStore(hfc.newKeyValueStore({path:"/tmp/keyValStore"}));
	chain.setMemberServicesUrl("grpc://localhost:7155");
	console.log(" -- chain is setup");

    chain.enroll(name, password)
    .then(
        function(admin) {
        	console.log("Successfully enrolled user 'admin'");
        	return admin.endorse(["grpc://localhost:7151"]);
        },
        function(err) {
        	writeError(res, err, " problem with the admin enroll");
        }
    )
    .then(
        function(admin) {
        	console.log("Successfully endorsed");
        	writeResponse(res, 200, "User " + name + " was endorsed successfully");
        },
        function(err) {
        	writeError(res, err, " problem with the endorse");
        }
    )

}

function writeError(res, err, default_error_msg) {
	console.log(" *** " + default_error_msg + "::" + err);
	var error_msg = err.description;
	if (!error_msg) {
		error_msg = default_error_msg;
	}
	writeResponse(res, 500, error_msg);

}

/**
 * Utility method to handle the message returned to the REST caller
 */
function writeResponse(res, code, msg) {
	res.status(code).json({
		message : msg
	});
}
