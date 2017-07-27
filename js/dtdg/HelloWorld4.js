dojo.provide("dtdg.HelloWorld4");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.declare(
    "dtdg.HelloWorld4",
    [dijit._Widget,dijit._Templated],
    {
        //templatePath:dojo.moduleUrl("dtdg","templates/HelloWorld4.html"),
        foo:"",
        baz:[],
        bar:{},
        templateString:"<span class='hello_class' dojoAttachEvent='onmouseover:onMouseOver,onmouseout:onMouseOut'>This is dijit Event!</span>" ,
        onMouseOver:function(evt){
            dojo.addClass(this.domNode,'hello_class');
            console.log("applied hello_class...");
            console.log(evt);
        },
        onMouseOut:function(evt){
            dojo.removeClass(this.domNode,'hello_class');
            console.log("remove hello_class...");
            console.log(evt);
        },
        postMixInProperties:function(){
            console.log("postMixInProperties: foo=",this.foo);
            console.log("postMixInProperties: baz=",this.baz);
            console.log("postMixInProperties: bar=",this.bar);
        }
    }
);