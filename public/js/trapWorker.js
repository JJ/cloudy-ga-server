importScripts("nodeo.js");
importScripts("twix.min.js");

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
    var xmlhttp = new XMLHttpRequest();
    // PUTs worker info
    xmlhttp.open("PUT", "/start/"+uuid+"/with/"+population_size, true);
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {

            if (xmlhttp.status == 200 /*|| xmlhttp.status == 304*/)
            {
                var data = JSON.parse(xmlhttp.responseText);
                console.log( data.experiment_id  );
                if ( data.experiment_id !== "undefined"  ) {

                    self.experiment_id= data.experiment_id;
                    console.log(self.experiment_id);
                }

                postMessage(
                    {
                        status:'created'
                    });

            }
            else if (xmlhttp2.readyState == 4 &&  xmlhttp.status == 404)
            {
                /// UNABLE TO INITIALIZE
                console.log("Error 404: not_created");
                // TO DO: HANDLE
                postMessage(
                    {
                        status:'not_created'
                    });

            }

        }
    };
    xmlhttp.send();
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



        Twix.get("/random", function( data ) {

            //ips_data.labels.push(generation_count);
            //ips_data.datasets[0].data.push( Object.keys( data ).length );
            //ips_chart.Line(ips_data);

        });


        // gets a random chromosome from the pool
        var xmlhttp = new XMLHttpRequest();
        var url = "/random";
        xmlhttp.open("GET", url, true);
        xmlhttp.onreadystatechange = function() {


           if (xmlhttp.readyState == 4 ) {

                if (xmlhttp.status == 200 /*|| xmlhttp.status == 304*/)
                {
                    var data = JSON.parse(xmlhttp.responseText);
                    if ( data.chromosome ) {
                        eo.incorporate( data.chromosome );
                       }
                
                }
                else if ( xmlhttp.status == 404)
                    {   console.log("404");
                        //There is no population
                        postMessage( 
                        { 
                        status:'no_work',     
                        generation_count:eo.generation_count, 
                        best:eo.population[0].string, 
                        fitness:eo.population[0].fitness,'period':period,
                        pop_size: eo.population.length
                        });
                        console.log("AFTER 404");
                        //No more work
                        //return;      

                    }

            }
        };
        xmlhttp.send();


        if (self.experiment_id  !== "undefined" ) {
            var xmlhttp2 = new XMLHttpRequest();
            // And puts another one in the pool
            xmlhttp2.open("PUT", "/experiment/" + self.experiment_id + "/one/" + eo.population[0].string + "/" + eo.population[0].fitness + "/" + uuid, true);
            xmlhttp2.onreadystatechange = function () {
                if (xmlhttp2.readyState == 4 && xmlhttp2.status == 200) {

                    postMessage(
                        {
                            status: 'working',
                            generation_count: eo.generation_count,
                            best: eo.population[0].string,
                            fitness: eo.population[0].fitness, 'period': period, 'ips': ips,
                            pop_size: eo.population.length,
                            current_expid: self.experiment_id
                        });
                }
                else if (xmlhttp2.readyState == 4 && xmlhttp2.status == 410) {
                    var data = JSON.parse(xmlhttp2.responseText);
                    self.experiment_id = data.current_expid;

                    postMessage({
                            status: 'experiment_not_found',
                            current_experiment_id:self.experiment_id
                        });
                    restart();


                }


            };
            xmlhttp2.send();
        }
        //Workers
        var xmlhttp3 = new XMLHttpRequest();
        var url = "/workers";
        var ips = "";
        xmlhttp3.onreadystatechange = function() {
            if (xmlhttp3.readyState == 4 && xmlhttp3.status == 200) {
                var data = JSON.parse(xmlhttp3.responseText);
                ips = Object.keys( data ).length;


                postMessage({
                    status:'working',
                    generation_count:eo.generation_count, 
                    best:eo.population[0].string, 
                    fitness:eo.population[0].fitness,
                    'period':period,
                    'ips':ips,
                    pop_size: eo.population.length
                    });


                }


            };
        xmlhttp3.open("GET", url, true);
        xmlhttp3.send();


       
    }

    if ( eo.population[0].fitness < traps*trap_b ) {

        setTimeout(do_ea, 5);

    }
    
    else{

        /// FOUND IT

        if (self.experiment_id  !== "undefined" ) {

            var xmlhttp2 = new XMLHttpRequest();
            ///experiment/:expid/one/:chromosome/:fitness/:uuid
            xmlhttp2.open("PUT", "/experiment/" + self.experiment_id + "/one/" + eo.population[0].string + "/" + eo.population[0].fitness + "/" + uuid, true);
            xmlhttp2.onreadystatechange = function () {
                if (xmlhttp2.readyState == 4 && xmlhttp2.status == 200) {
                    postMessage(
                        {
                            status:'finished',
                            generation_count: eo.generation_count,
                            best: eo.population[0].string,
                            fitness: eo.population[0].fitness, 'period': period, 'ips': ips,
                            pop_size: eo.population.length,
                            current_expid: self.experiment_id
                        });


                }
                else if (xmlhttp2.readyState == 4 && xmlhttp2.status == 410) {
                    var data = JSON.parse(xmlhttp2.responseText);
                    self.experiment_id = data.current_expid;

                    postMessage(
                        {
                           status: 'experiment_not_found',
                           current_experiment_id:self.experiment_id

                        });


                }
                // Restart either way
                restart();
                console.log('finished after');
            };

            xmlhttp2.send();
        }



        //close();
    }
}



