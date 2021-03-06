var request = require('supertest'), 
should = require('should'),
app = require('../index.js'),
one_chromosome = { "string": "101101101101",
		   "fitness": 0 },
great_chromosome = { "string": "whatever",
		     "fitness": 60 };

// Not really sure why I did this... 
describe( "Loads configuration correctly", function() {
    it('Should set repo correctly', function( done ) {
	app.config.should.have.property('repository', "https://github.com/JJ/cloudy-ga-server");
	done();
    });
});

// Check for solution, included in configuration
describe( "Loads termination correctly", function() {
    it('Should terminate when needed', function( done ) {
	app.is_solution(great_chromosome.string,great_chromosome.fitness).should.be.ok;
	done();
    });
});

// Checks the algorithm functionality 
describe( "Puts and returns chromosome", function() {
    it('Should grab experiment id', function(done) {
	request(app)
	    .put('/start/ABCD/with/3333')
	    .expect('Content-Type', /json/)
	    .expect(200,done);
    });
    it('should return correct type', function (done) {
	request(app)
	    .put('/experiment/0/one/'+one_chromosome.string+"/"+one_chromosome.fitness+ "/UUID")
	    .expect('Content-Type', /json/)
	    .expect(200,done);
    });

    it('should return incorrect type', function (done) {
	request(app)
	    .put('/experiment/1/one/'+one_chromosome.string+"/"+one_chromosome.fitness+ "/UUID")
	    .expect('Content-Type', /json/)
	    .expect(410,done);
    });
    it('should return chromosome', function (done) {
	request(app)
	    .get('/random')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.have.property('chromosome', one_chromosome.string);
		done();
	    });
    });
    it('should return all chromosomes', function (done) {
	request(app)
	    .get('/chromosomes')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		done();
	    });
    });
    it('should return IPs', function (done) {
	request(app)
	    .get('/IPs')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		done();
	    });
    });
    it('should return IP count', function (done) {
	request(app)
	    .get('/IPs/count')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		done();
	    });
    });
    it('should return worker count', function (done) {
	request(app)
	    .get('/workers/count')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.be.instanceof(Object);
		resultado.body.should.have.property('worker_count', 1);
		done();
	    });
    });
    
    it('should return sequence number', function (done) {
	request(app)
	    .get('/seq_number')
	    .expect('Content-Type', /json/)
	    .expect(200)
	    .end( function ( error, resultado ) {
		if ( error ) {
		    return done( error );
		}
		resultado.body.should.have.property("number",0);
		done();
	    });
    });
});
