dojo.provide("dlwg.unit");
dojo.require("dijit._widget");
dojo.require("dijit._Templated");
dojo.require("dojo.dnd.Moveable");
dojo.require("dojo.dnd.move");
dojo.declare(
    "dlwg.unit",
    [dijit._Widget,dijit._Templated],
    {
        templatePath:dojo.moduleUrl("dlwg","templates/unit.html"),
        _input:{},
        _output:{},
        _put_size:"",
        theme:"",
        name:"",
        own_id:"",
        img_src:"",
        link_id:"",
        size:{},
        location:{},
        l_type:"",
        init:function(){
            switch(this.l_type){
                case 0:
                    _put_size = 5;
                    var inputPositionX = 0;
                    var inputPositionY = (this.size.h+_put_size)/2;
                    var outputPositionX = (this.size.w+_put_size)/2;
                    var outputPositionY= (this.size.h+_put_size)/2;
                    var inputX = (this.location.x+_put_size);
                    var inputY = (this.location.y+this.size.h/2);
                    var outputX = (this.location.x+this.size.w);
                    var outputY = (this.location.y+this.size.h/2);
                    this._input = {
                        Position:
                        {
                            x: inputPositionX ,
                            y: inputPositionY
                        },
                        link:
                        {
                            x: inputX,
                            y: inputY
                        }
                    };
                    this._output = {
                        Position:
                        {
                            x: outputPositionX ,
                            y: outputPositionY
                        },
                        link:
                        {
                            x: outputX,
                            y: outputY
                        }
                    };
                    break;
                default:
                    break;
            }
        },
        /*constructor:function(name,ownId,imgSrc,size,location,type,domNode){
            this.name = name;
            this.own_id = ownId;
            this.img_src = imgSrc;
            this.size = size;
            this.location = location;
            this.l_type = type;
            this.domNode = domNode;
            //init();
            switch(this.l_type){
                case 0:
                    _put_size = 5;
                    var inputPositionX = 0;
                    var inputPositionY = (this.size.h+_put_size)/2;
                    var outputPositionX = (this.size.w+_put_size)/2;
                    var outputPositionY= (this.size.h+_put_size)/2;
                    var inputX = (this.location.x+_put_size);
                    var inputY = (this.location.y+this.size.h/2);
                    var outputX = (this.location.x+this.size.w);
                    var outputY = (this.location.y+this.size.h/2);
                    this._input = {
                        Position:
                        {
                            x: inputPositionX ,
                            y: inputPositionY
                        },
                        link:
                        {
                            x: inputX,
                            y: inputY
                        }
                    };
                    this._output = {
                        Position:
                        {
                            x: outputPositionX ,
                            y: outputPositionY
                        },
                        link:
                        {
                            x: outputX,
                            y: outputY
                        }
                    };
                    break;
                default:
                    break;
            }
        },*/
       postMixInProperties: function(){
           switch(this.l_type){
               case 0:
                   _put_size = 5;
                   var inputPositionX = 0;
                   var inputPositionY = (this.size.h+_put_size)/2;
                   var outputPositionX = (this.size.w+_put_size)/2;
                   var outputPositionY= (this.size.h+_put_size)/2;
                   var inputX = (this.location.x+_put_size);
                   var inputY = (this.location.y+this.size.h/2);
                   var outputX = (this.location.x+this.size.w);
                   var outputY = (this.location.y+this.size.h/2);
                   this._input = {
                       Position:
                       {
                           x: inputPositionX ,
                           y: inputPositionY
                       },
                       link:
                       {
                           x: inputX,
                           y: inputY
                       }
                   };
                   this._output = {
                       Position:
                       {
                           x: outputPositionX ,
                           y: outputPositionY
                       },
                       link:
                       {
                           x: outputX,
                           y: outputY
                       }
                   };
                   break;
               default:
                   break;
           }
        },

        outputOnMouseUp:function(evt){
            bool = true;
            evt=evt||window.event;
            StartX=evt.clientX;
            StartY=evt.clientY;
            idOutput=this.h_id;
            console.log("applied hello_class...");
            console.log(evt);
        },
        inputOnMouseUp:function(evt){
            bool = false;
            evt=evt||window.event;
            EndX=evt.clientX;
            EndY=evt.clientY;
            idInput=this.h_id;
            console.log("applied hello_class...");
            Line = new line({x:StartX,y:StartY,id:idOutput},{x:EndX,y:EndY,id:idInput});
            Lines.push(Line);
            console.log(evt);
        },
        onMoving:function(mover,shift){

        },
        parseString:function(){

        }
    }
);