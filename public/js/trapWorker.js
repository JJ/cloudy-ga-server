importScripts("nodeo.js");
importScripts("twix.js");

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {

    case 'start':
        init_worker(data.config);
        console.log( 'start' );
        break;
    case 'evolve':
        console.log( 'evolve' );
        do_ea();
        break;
        }
  
    }, false
);





function init_worker(config) {
    self.population_size = config.population_size;
    self.period = config.period;
    self.traps = config.traps;
    self.trap_len = config.trap_len;
    self.trap_b = config.trap_b;
    self.chromosome_size = traps * trap_len;
    self.experiment_id = null;

    self.trap_fitness = new trap.Trap({
        "l": trap_len,
        "a": 1,
        "b": trap_b,
        "z": trap_len - 1
    });

    self.eo = new Nodeo({
        population_size: self.population_size,
        chromosome_size: self.chromosome_size,
        fitness_func: self.trap_fitness
    });
    //Worker uuid
    self.uuid = config.worker_uuid;

    Twix.ajax({
            type:"PUT",
            url: "/start/"+uuid+"/with/"+population_size,
            success: function(data) {
                console.log( data.experiment_id  );
                if ( data.experiment_id !== "undefined"  ) {

                    self.experiment_id= data.experiment_id;
                    console.log(self.experiment_id);
                }

                postMessage({
                        status:'created'
                    });

                postMessage(data);
            },

            error: function(jgXHR) {
                if (jgXHR.status ==  404) {
                    /// UNABLE TO INITIALIZE
                    console.log("Error 404: not_created");
                    // TO DO: HANDLE
                    postMessage({
                            status:'not_created'
                        });

                }
            }
        });

}


function restart() {

    console.log("restarting");


    self.eo = new Nodeo({
        population_size: self.population_size,
        chromosome_size: self.chromosome_size,
        fitness_func: self.trap_fitness
    });

    postMessage(
        {
            status:'starting'

        });

    do_ea();
}



function do_ea() {
    eo.generation();
    //if ( eo.population[0].fitness == traps*trap_b ) {
    //    console.log('finished before');
    //}

    if ( (eo.generation_count % period === 0) ) {



        Twix.ajax({
            type:"GET",
            url: "/random",
            success: function(data) {
                if ( data.chromosome ) {
                    eo.incorporate( data.chromosome );
                }
            },

            error: function(jgXHR) {
                if (jgXHR.status ==  404) {
                    console.log("404 No Poulation Yet");
                    //There is no population
                    postMessage(
                        {
                            status:'no_work',
                            generation_count:eo.generation_count,
                            best:eo.population[0].string,
                            fitness:eo.population[0].fitness,'period':period,
                            pop_size: eo.population.length
                        });
                }
            }
        });

        if (self.experiment_id  !== "undefined" ) {

            Twix.ajax({
                type:"PUT",
                url:  "/experiment/" + self.experiment_id + "/one/" + eo.population[0].string + "/" + eo.population[0].fitness + "/" + uuid,
                success: function(data) {
                    postMessage(
                        {
                            status: 'working',
                            generation_count: eo.generation_count,
                            best: eo.population[0].string,
                            fitness: eo.population [0].fitness,
                            'period': self.period,
                            'ips': self.ips,
                            pop_size: eo.population.length,
                            current_expid: self.experiment_id
                        });
                },

                error: function(status, text, jgXHR) {
                    if ( status ==  410) {

                        var data = JSON.parse(jgXHR.responseText);

                        self.experiment_id = data.current_expid;

                        console.log(self.experiment_id );

                        postMessage({
                            status: 'experiment_not_found',
                            current_experiment_id:self.experiment_id
                        });
                        restart();

                    }
                }
            });

        }
        //Workers

        Twix.ajax({
            type:"GET",
            url: "/workers",
            success: function(data) {
                self.ips = Object.keys( data ).length;


                postMessage({
                    status:'working',
                    generation_count:eo.generation_count,
                    best:eo.population[0].string,
                    fitness:eo.population[0].fitness,
                    'period':period,
                    'ips':self.ips,
                    pop_size: eo.population.length
                });
            }
        });
    }

    if ( eo.population[0].fitness < traps*trap_b ) {

        setTimeout(do_ea, 5);

    }
    
    else{

        /// FOUND IT

        if (self.experiment_id  !== "undefined" ) {

            Twix.ajax({
                type:"PUT",
                url:  "/experiment/" + self.experiment_id + "/one/" + eo.population[0].string + "/" + eo.population[0].fitness + "/" + uuid,
                success: function(data) {
                    postMessage(
                        {
                            status: 'finished',
                            generation_count: eo.generation_count,
                            best: eo.population[0].string,
                            fitness: eo.population [0].fitness, 'period': period, 'ips': self.ips,
                            pop_size: eo.population.length,
                            current_expid: self.experiment_id
                        });
                    restart();
                },

                error: function(status, text, jgXHR) {
                    if (status ==  410) {
                        var data = JSON.parse(jgXHR.responseText);
                        self.experiment_id = data.current_expid;
                        console.log(self.experiment_id );
                        postMessage({
                            status: 'experiment_not_found',
                            current_experiment_id:self.experiment_id
                        });
                        restart();

                    }
                }
            });

        }



        //close();
    }
}



