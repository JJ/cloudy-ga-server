// Checks whether the chromosome is the solution. This function should be set to whatever the user wants. 

module.exports = exports = function( fitness ) {
    if ( !fitness ) {
	return false;
    }
    if ( fitness < 2304 ) { // HIFF with 256 bits
	return false;
    } else {
	return true;
    }
};
