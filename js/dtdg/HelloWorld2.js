dojo.provide("dtdg.HelloWorld2");
dojo.require("dijit._widget");
dojo.require("dijit._Templated");
dojo.declare(
    "dtdg.HelloWorld2",
    [dijit._Widget,dijit._Templated],
    {
        greeting:"",
        templatePath:dojo.moduleUrl("dtdg","templates/HelloWorld2.html"),
        postMixInProperties: function(){
            this.greeting = "Hello World!";
        }
    }
);