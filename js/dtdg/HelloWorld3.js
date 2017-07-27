dojo.provide("dtdg.HelloWorld3");
dojo.require("dijit._widget");
dojo.require("dijit._Templated");
dojo.declare(
    "dtdg.HelloWorld3",
    [dijit._Widget,dijit._Templated],
    {
        //templatePath:dojo.moduleUrl("dtdg","templates/HelloWorld3.html")
        greeting:"",
        templateString:"<div class='hello_class'>${greeting}</div>",
        postMixInProperties: function(){
            this.greeting = "Hello World!";
        }
    }
);