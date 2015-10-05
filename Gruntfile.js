'use strict';

module.exports = function(grunt) {
    
    // Configuración del proyecto
    grunt.initConfig({
	// incluye la configuración
	pkg: grunt.file.readJSON('package.json'),
	docco: {	   
	    src: ['*.js'],
	    options: {
		output: 'docs/'
	    }
	},
	shell: { 
	    options: {
		stderr: false
            },
	    // para probar el despliegue
	    puts: {
		command: 'curl -X PUT http://localhost:5000/one/101010/3/ABC-DEF'
	    }
	}
    });

    // Carga el plugin de grunt para hacer esto
    grunt.loadNpmTasks('grunt-docco');
    grunt.loadNpmTasks('grunt-shell');

    // Tarea por omisión: generar la documentación
    grunt.registerTask('default', ['docco']);

    // Otras tareas
    grunt.registerTask('put', ['shell:puts']);
};
