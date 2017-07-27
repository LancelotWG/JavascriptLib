dojo.provide("dijit.form.ScriptPane_DOM");
dojo.require("dijit._Widget");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit.form.ComboBox");

dojo.declare(
    "dijit.form.ScriptPane_DOM",
    [dijit._Widget, dijit._TemplatedMixin],
    {
        // summary:
        //        Implements the base functionality for ComboBox/FilteringSelect
        // description:
        //        All widgets that mix in dijit.form.ComboBoxMixin must extend dijit.form._FormValueWidget

        // item: Object
        //        This is the item returned by the dojo.data.store implementation that
        //        provides the data for this cobobox, it's the currently selected item.
        item: null,

        // pageSize: Integer
        //        Argument to data provider.
        //        Specifies number of search results per page (before hitting "next" button)
        pageSize: Infinity,

        // store: Object
        //        Reference to data provider object used by this ComboBox
        store: null,

        // fetchProperties: Object
        //        Mixin to the dojo.data store's fetch.
        //        For example, to set the sort order of the ComboBox menu, pass:
        //        {sort:{attribute:"name",descending:true}}
        fetchProperties:{},

        // query: Object
        //        A query that can be passed to 'store' to initially filter the items,
        //        before doing further filtering based on `searchAttr` and the key.
        //        Any reference to the `searchAttr` is ignored.
        query: {},

        // autoComplete: Boolean
        //        If you type in a partial string, and then tab out of the `<input>` box,
        //        automatically copy the first entry displayed in the drop down list to
        //        the `<input>` field
        autoComplete: false,

        // highlightMatch: String
        //         One of: "first", "all" or "none".
        //        If the ComboBox opens with the serach results and the searched
        //        string can be found it will be highlighted.
        //        This value is not considered when labelType!="text" to not
        //        screw up any mark up the label might contain.
        highlightMatch: "first",
        
        // searchDelay: Integer
        //        Delay in milliseconds between when user types something and we start
        //        searching based on that value
        searchDelay: 100,

        // searchAttr: String
        //        Searches pattern match against this field
        searchAttr: "name",

        // labelAttr: String
        //        Optional.  The text that actually appears in the drop down.
        //        If not specified, the searchAttr text is used instead.
        labelAttr: "",

        // labelType: String
        //        "html" or "text"
        labelType: "text",

        // queryExpr: String
        //        dojo.data query expression pattern.
        //        `${0}` will be substituted for the user text.
        //        `*` is used for wildcards.
        //        `${0}*` means "starts with", `*${0}*` means "contains", `${0}` means "is"
        queryExpr: "${0}*",

        // ignoreCase: Boolean
        //        Set true if the ComboBox should ignore case when matching possible items
        ignoreCase: true,

        // hasDownArrow: Boolean
        //        Set this textbox to have a down arrow button.
        //        Defaults to true.
        hasDownArrow:false,

        templateString: '<div style="height:100px;font-size=small;border:1px solid #7594bc;width:100%" contentEditable="true" autocomplete="off" dojoAttachEvent="onkeypress:_onKeyPress, onfocus:compositionend, onpaste:_onPaste"\ dojoAttachPoint="textbox,focusNode" waiRole="textbox" waiState="haspopup-true,autocomplete-list" type="text"> </div>',

        baseClass:"dijitComboBox",
        
        keyWords:['and', 'or', 'if', 'else', 'return', 'switch', 'case'],
        noliterWords:['(',')', '=', '>', '<', decodeURI('%C2%A0'),':', '{', '}', '$'],
        entityStore: null,
        subStoreMap: {}, 
        leftString: '',

        _getCaretPos: function(/*DomNode*/ element){
            var range = window.getSelection().getRangeAt(0).cloneRange();  
            range.setStart(element, 0);  
            return range.toString().length;
        },

        _setCaretPos: function(/*DomNode*/ element, /*Number*/ location){
//            location = parseInt(location);
//            dijit.selectInputText(element, location, location);            
            var selecttion = window.getSelection();
            selecttion.removeAllRanges();
            var range = document.createRange();
            if (element.nodeType == 1)
            {
                element = element.childNodes[0] || element;               
            }
            if (location > element.textContent.length)
            {
                range.selectNodeContents(element);
                range.collapse(false);
            }
            else
            {
                range.setStart(element, location);
                range.setEnd(element, location);
            }
            selecttion.addRange(range);
            //this.domNode.focus();
        },

        _setDisabledAttr: function(/*Boolean*/ value){
            // summary:
            //        Call this from superclass as part of _setDisabledAttr() method.
            //        Superclass _must_ define _setDisabledAttr().
            // description:
            //        Additional code to set disabled state of combobox node
                //dijit.setWaiState(this.comboNode, "disabled", value);
        },    
        
        _onKeyPress: function(/*Event*/ evt){
            // summary: handles keyboard events
            var key = evt.charOrCode;
            //except for cutting/pasting case - ctrl + x/v
            if(evt.altKey || (evt.ctrlKey && (key != 'x' && key != 'v')) || evt.key == dojo.keys.SHIFT){
                return; // throw out weird key combinations and spurious events
            }
            var doSearch = false, processDom = true;
            var pw = this._popupWidget;
            var dk = dojo.keys;
            if(this._isShowingNow){
                pw.handleKey(evt);
            }
            switch(key){
                case dk.PAGE_DOWN:
                case dk.DOWN_ARROW:
                    if(!this._isShowingNow||this._prev_key_esc){
                        this._arrowPressed();
                        //doSearch=true;                        
                    }else{
                        //this._announceOption(pw.getHighlightedOption());
                        processDom = false;
                        dojo.stopEvent(evt);
                    }                    
                    this._prev_key_backspace = false;
                    this._prev_key_esc = false;
                    break;

                case dk.PAGE_UP:
                case dk.UP_ARROW:
                    if(this._isShowingNow){
                        //this._announceOption(pw.getHighlightedOption());
                        processDom = false;
                        dojo.stopEvent(evt);
                    }                    
                    this._prev_key_backspace = false;
                    this._prev_key_esc = false;
                    break;

                case dk.ENTER:
                    // prevent submitting form if user presses enter. Also
                    // prevent accepting the value if either Next or Previous
                    // are selected
                    var highlighted;
                    if(this._isShowingNow && 
                        (highlighted = pw.getHighlightedOption())
                    ){
                        // only stop event on prev/next
                        if(highlighted == pw.nextButton){
                            this._nextSearch(1);
                            dojo.stopEvent(evt);
                            break;
                        }else if(highlighted == pw.previousButton){
                            this._nextSearch(-1);
                            dojo.stopEvent(evt);
                            break;
                        }
                        else
                        {
                            this._announceOption(pw.getHighlightedOption());
                            this._hideResultList();
                            dojo.stopEvent(evt);
                        }
                        processDom = false;                        
                    }else{
                        // Update 'value' (ex: KY) according to currently displayed text
                        //this._setDisplayedValueAttr(this.attr('displayedValue'), true);
                    }
                    // default case:
                    // prevent submit, but allow event to bubble
                    //evt.preventDefault();
                    // fall through
                    this._hideResultList();
                    break;
                case dk.TAB:
                    var newvalue = this.attr('displayedValue');
                    // #4617: 
                    //        if the user had More Choices selected fall into the
                    //        _onBlur handler
                    if(pw && (
                        newvalue == pw._messages["previousMessage"] ||
                        newvalue == pw._messages["nextMessage"])
                    ){
                        break;
                    }
                    if(this._isShowingNow){
                        this._prev_key_backspace = false;
                        this._prev_key_esc = false;
                        if(pw.getHighlightedOption()){
                            //pw.attr('value', { target: pw.getHighlightedOption() });
                        }
                        this._lastQuery = null; // in case results come back later
                        this._hideResultList();
                        processDom = false;
                    }
                    break;

                case ' ':
                    this._prev_key_backspace = false;
                    this._prev_key_esc = false;
                    if(this._isShowingNow && pw.getHighlightedOption()){
                        dojo.stopEvent(evt);
                        this._announceOption(pw.getHighlightedOption());
                        this._hideResultList();
                        processDom = false;
                    }else{
                        this._hideResultList();
                        doSearch = true;
                    }
                    this.leftString = '';
                    break;

                case dk.ESCAPE:
                    this._prev_key_backspace = false;
                    this._prev_key_esc = true;
                    if(this._isShowingNow){
                        dojo.stopEvent(evt);
                        this._hideResultList();
                        processDom = false;
                    }else{
                        this.inherited(arguments);
                    }
                    break;

                case dk.DELETE:
                case dk.BACKSPACE:
                    this._prev_key_esc = false;
                    this._prev_key_backspace = true;
                    if (dojo.trim(this.focusNode.textContent).length > 1)
                    {
                        doSearch = true;
                    }
                    else
                    {
                        this._hideResultList();
                    }
                    break;

                case dk.RIGHT_ARROW: // fall through
                case dk.LEFT_ARROW: 
                    this._prev_key_backspace = false;
                    this._prev_key_esc = false;
                    break;
                case '.':                    
                    var searchKey = this.focusNode.textContent;                    
                    if (this.subStoreMap[searchKey])
                    {
                        this.set('store', this.subStoreMap[searchKey]);
                        doSearch = true;     
                    } 
                    else
                    {
                        if (searchKey.length > 1)
                        {
                            this.set('store', this.getLazyLoadSubStore(searchKey));
                            doSearch = true;   
                        }                           
                    }
                default: // non char keys (F1-F12 etc..)  shouldn't open list
                    this._prev_key_backspace = false;
                    this._prev_key_esc = false;
                    doSearch = typeof key == 'string';
            }
            if(this.searchTimer){
                clearTimeout(this.searchTimer);
            }
            if(doSearch){
                // need to wait a tad before start search so that the event
                // bubbles through DOM and we have value visible
                setTimeout(dojo.hitch(this, "_startSearchFromInput"),10);
            }
            if (processDom)
            {
                setTimeout(dojo.hitch(this, "_processDomStruct", key),1);
            }
        },
        
        getLazyLoadSubStore: function(key)
        {
            return this.store;
        },

        _autoCompleteText: function(/*String*/ text){
            // summary:
            //         Fill in the textbox with the first item from the drop down
            //         list, and highlight the characters that were
            //         auto-completed. For example, if user typed "CA" and the
            //         drop down list appeared, the textbox would be changed to
            //         "California" and "ifornia" would be highlighted.

            var fn = this.focusNode;
            if (fn.nodeType == 3 && fn.parentNode.tagName == 'DIV')
            {
                fn = dojo.create('SPAN', {}, fn, 'after');
            }
            // IE7: clear selection so next highlight works all the time
            //dijit.selectInputText(fn, fn.textContent.length);
            // does text autoComplete the value in the textbox?
            var caseFilter = this.ignoreCase? 'toLowerCase' : 'substr';
//            if(text[caseFilter](0).indexOf(this.focusNode.textContent[caseFilter](0)) == 0){
//                var cpos = this._getCaretPos(fn);
//                // only try to extend if we added the last character at the end of the input
//                if((cpos+1) > fn.textContent.length){
//                    // only add to input node as we would overwrite Capitalisation of chars
//                    // actually, that is ok
//                    fn.textContent = text;//.substr(cpos);
//                    // visually highlight the autocompleted characters
//                    dijit.selectInputText(fn, cpos);
//                }
//            }
//            else
            {
                // text does not autoComplete; replace the whole value and highlight
                if (dojo.trim(this.leftString))
                {
                    fn.textContent = this.leftString + text;
                }
                else if (this.leftString)
                {
                    this.focusNode = dojo.create('SPAN', {innerHTML: text}, fn, 'after');                    
                }
                else
                {
                    fn.textContent = text;
                }
                this.leftString = '';
                this._setCaretPos(fn, fn.textContent.length);
            }
        },

        _openResultList: function(/*Object*/ results, /*Object*/ dataObject){
            if(    this.disabled || 
                this.readOnly || 
                (dataObject.query[this.searchAttr] != this._lastQuery)
            ){
                return;
            }
            this._popupWidget.clearResultList();
            if(!results.length){
                this._hideResultList();
                return;
            }

            // Fill in the textbox with the first item from the drop down list,
            // and highlight the characters that were auto-completed. For
            // example, if user typed "CA" and the drop down list appeared, the
            // textbox would be changed to "California" and "ifornia" would be
            // highlighted.

            var zerothvalue = new String(this.store.getValue(results[0], this.searchAttr));
            if(zerothvalue && this.autoComplete && !this._prev_key_backspace &&
                (dataObject.query[this.searchAttr] != "*")){
                // when the user clicks the arrow button to show the full list,
                // startSearch looks for "*".
                // it does not make sense to autocomplete
                // if they are just previewing the options available.
                this._autoCompleteText(zerothvalue);
            }
            dataObject._maxOptions = this._maxOptions;
            this._popupWidget.createOptions(
                results, 
                dataObject, 
                dojo.hitch(this, "_getMenuLabelFromItem")
            );

            // show our list (only if we have content, else nothing)
            this._showResultList();

            // #4091:
            //        tell the screen reader that the paging callback finished by
            //        shouting the next choice
            if(dataObject.direction){
                if(1 == dataObject.direction){
                    this._popupWidget.highlightFirstOption();
                }else if(-1 == dataObject.direction){
                    this._popupWidget.highlightLastOption();
                }
                this._announceOption(this._popupWidget.getHighlightedOption());
            }
        },

        _showResultList: function(){
            this._hideResultList();
            var items = this._popupWidget.getItems(),
                visibleCount = Math.min(items.length,this.maxListLength);
            this._arrowPressed();
            // hide the tooltip
//            this.displayMessage("");
            
            // Position the list and if it's too big to fit on the screen then
            // size it to the maximum possible height
            // Our dear friend IE doesnt take max-height so we need to
            // calculate that on our own every time

            // TODO: want to redo this, see 
            //        http://trac.dojotoolkit.org/ticket/3272
            //    and
            //        http://trac.dojotoolkit.org/ticket/4108


            // natural size of the list has changed, so erase old
            // width/height settings, which were hardcoded in a previous
            // call to this function (via dojo.marginBox() call)
            dojo.style(this._popupWidget.domNode, {width: "", height: ""});

            var best = this.open();
            // #3212:
            //        only set auto scroll bars if necessary prevents issues with
            //        scroll bars appearing when they shouldn't when node is made
            //        wider (fractional pixels cause this)
            var popupbox = dojo.marginBox(this._popupWidget.domNode);
            this._popupWidget.domNode.style.overflow = 
                ((best.h==popupbox.h)&&(best.w==popupbox.w)) ? "hidden" : "auto";
            // #4134:
            //        borrow TextArea scrollbar test so content isn't covered by
            //        scrollbar and horizontal scrollbar doesn't appear
            var newwidth = best.w;
            if(best.h < this._popupWidget.domNode.scrollHeight){
                newwidth += 16;
            }
            dojo.marginBox(this._popupWidget.domNode, {
                h: best.h,
                w: Math.max(newwidth, this.domNode.offsetWidth)
            });
            if (this.focusNode)
            {
                var refNode = this.focusNode;
                if (this.focusNode.nodeType == 3)
                {
                    refNode = this.focusNode.parentNode;                    
                }
                var pos = dojo.position(refNode);
                var left = pos.x + this._getCaretPos(this.focusNode) * 8;
                var posout = dojo.position(this.domNode, true);
                if (left > posout.x + posout.w - best.w)
                {
                    left = posout.x + posout.w - best.w;
                }
                dojo.style(this._popupWidget.domNode.parentNode, {position:'absolute', left: left + "px", top: (pos.h + pos.y + 5) + "px"});
                dojo.style(this._popupWidget.domNode, {width: "", height: ""});
            }
//            dijit.setWaiState(this.comboNode, "expanded", "true");
        },

        _hideResultList: function(){
            if(this._isShowingNow){
                dijit.popup.close(this._popupWidget);
                this._arrowIdle();
                this._isShowingNow=false;
//                dijit.setWaiState(this.comboNode, "expanded", "false");
//                dijit.removeWaiState(this.focusNode,"activedescendant");
            }
        },

        _setBlurValue: function(){
            // if the user clicks away from the textbox OR tabs away, set the
            // value to the textbox value
            // #4617: 
            //        if value is now more choices or previous choices, revert
            //        the value
            var newvalue=this.attr('displayedValue');
            var pw = this._popupWidget;
            if(pw && (
                newvalue == pw._messages["previousMessage"] ||
                newvalue == pw._messages["nextMessage"]
                )
            ){
                this._setValueAttr(this._lastValueReported, true);
            }else{
                // Update 'value' (ex: KY) according to currently displayed text
                this.attr('displayedValue', newvalue);
            }
        },

        _onBlur: function(){
            // summary: called magically when focus has shifted away from this widget and it's dropdown
            this._hideResultList();
            this._arrowIdle();
            this.inherited(arguments);
        },

        _announceOption: function(/*Node*/ node){
            // summary:
            //        a11y code that puts the highlighted option in the textbox
            //        This way screen readers will know what is happening in the
            //        menu

            if(node == null){
                return;
            }
            // pull the text value from the item attached to the DOM node
            var newValue;
            if( node == this._popupWidget.nextButton ||
                node == this._popupWidget.previousButton){
                newValue = node.innerHTML;
            }else{
                newValue = this.store.getValue(node.item, this.searchAttr);
            }
            // get the text that the user manually entered (cut off autocompleted text)
            this.focusNode.textContent = this.focusNode.textContent.substring(0, this._getCaretPos(this.focusNode));
            //set up ARIA activedescendant
//            dijit.setWaiState(this.focusNode, "activedescendant", dojo.attr(node, "id")); 
            // autocomplete the rest of the option to announce change
            this._autoCompleteText(newValue);
            this.set('store', this.entityStore); 
        },

        _selectOption: function(/*Event*/ evt){
            var tgt = null;
            if(!evt){
                evt ={ target: this._popupWidget.getHighlightedOption()};
            }
                // what if nothing is highlighted yet?
            if(!evt.target){
                // handle autocompletion where the the user has hit ENTER or TAB
                this.attr('displayedValue', this.attr('displayedValue'));
                return;
            // otherwise the user has accepted the autocompleted value
            }else{
                tgt = evt.target;
            }
            if(!evt.noHide){
                this._hideResultList();
                this._setCaretPos(this.focusNode, this.store.getValue(tgt.item, this.searchAttr).length);
            }
            this._doSelect(tgt);
        },

        _doSelect: function(tgt){
            this.item = tgt.item;
            this.attr('value', this.store.getValue(tgt.item, this.searchAttr));
        },

        _onArrowMouseDown: function(evt){
            // summary: callback when arrow is clicked
            if(this.disabled || this.readOnly){
                return;
            }
            dojo.stopEvent(evt);
            this.focus();
            if(this._isShowingNow){
                this._hideResultList();
            }else{
                // forces full population of results, if they click
                // on the arrow it means they want to see more options
                this._startSearch("");
            }
        },

        _startSearchFromInput: function(){
            this._startSearch(this.focusNode.textContent.replace(/([\\\*\?])/g, "\\$1"));
        },

        _getQueryString: function(/*String*/ text){
            return dojo.string.substitute(this.queryExpr, [text]);
        },

        _startSearch: function(/*String*/ key){
            if (key && dojo.trim(key))
            {
                if (key.indexOf('.') == -1)
                {
                    this.set('store', this.entityStore);
                }                 
                if (dojo.every(key, function(char){
                    return dojo.indexOf(this.noliterWords, char) > -1
                }, this))
                {
                    this.set('store', this.entityStore);
                    this.leftString = '';
                    return;
                }  
                var beginIndex = key.lastIndexOf('.');
                if (beginIndex > -1)
                {
                    this.leftString = key.substr(0, beginIndex + 1);
                    key = key.substr(beginIndex + 1, key.length - 1);                    
                }
            }
            else
            {
                this.leftString = '';
                return;
            }
            
            if(!this._popupWidget){
                var popupId = this.id + "_popup";
                dojo.extend(dijit.form._ComboBoxMenu,
                {
                    // these functions are called in showResultList
                    getItems: function(){
                        return this.domNode.childNodes;
                    },

                    getListLength: function(){
                        return this.domNode.childNodes.length-2;
                    }
                });
                this._popupWidget = new dijit.form._ComboBoxMenu({
                    onChange: dojo.hitch(this, this._selectOption),
                    id:popupId
                });
                this.connect(this._popupWidget, '_onMouseUp', function(event){
                    var value = this.store.getValue(this._popupWidget.getHighlightedOption().item, this.searchAttr);
                    this.focusNode.textContent = value;                    
                    this._hideResultList(); 
                    this._setCaretPos(this.focusNode, value.length);
                });
                //dijit.removeWaiState(this.focusNode,"activedescendant");
                //dijit.setWaiState(this.textbox,"owns",popupId); // associate popup with textbox
            }
            // create a new query to prevent accidentally querying for a hidden
            // value from FilteringSelect's keyField
            this.item = null; // #4872
            var query = dojo.clone(this.query); // #5970
            this._lastInput = key; // Store exactly what was entered by the user.
            this._lastQuery = query[this.searchAttr] = this._getQueryString(key);
            // #5970: set _lastQuery, *then* start the timeout
            // otherwise, if the user types and the last query returns before the timeout,
            // _lastQuery won't be set and their input gets rewritten
            this.searchTimer=setTimeout(dojo.hitch(this, function(query, _this){
                var fetch = {
                    queryOptions: {
                        ignoreCase: this.ignoreCase, 
                        deep: true
                    },
                    query: query,
                    onBegin: dojo.hitch(this, "_setMaxOptions"),
                    onComplete: dojo.hitch(this, "_openResultList"), 
                    onError: function(errText){
                        console.error('dijit.form.ComboBox: ' + errText);
                        dojo.hitch(_this, "_hideResultList")();
                    },
                    start:0,
                    count:this.pageSize
                };
                dojo.mixin(fetch, _this.fetchProperties);
                var dataObject = _this.store.fetch(fetch);

                var nextSearch = function(dataObject, direction){
                    dataObject.start += dataObject.count*direction;
                    // #4091:
                    //        tell callback the direction of the paging so the screen
                    //        reader knows which menu option to shout
                    dataObject.direction = direction;
                    this.store.fetch(dataObject);
                };
                this._nextSearch = this._popupWidget.onPage = dojo.hitch(this, nextSearch, dataObject);
            }, query, this), this.searchDelay);
        },

        _setMaxOptions: function(size, request){
             this._maxOptions = size;
        },

        _getValueField:function(){
            return this.searchAttr;
        },

        /////////////// Event handlers /////////////////////

        _arrowPressed: function(){
            if(!this.disabled && !this.readOnly && this.hasDownArrow){
                dojo.addClass(this.downArrowNode, "dijitArrowButtonActive");
            }
        },

        _arrowIdle: function(){
            if(!this.disabled && !this.readOnly && this.hasDownArrow){
                dojo.removeClass(this.downArrowNode, "dojoArrowButtonPushed");
            }
        },

        // FIXME: 
        //        this is public so we can't remove until 2.0, but the name
        //        SHOULD be "compositionEnd"

        compositionend: function(/*Event*/ evt){
            //    summary:
            //        When inputting characters using an input method, such as
            //        Asian languages, it will generate this event instead of
            //        onKeyDown event Note: this event is only triggered in FF
            //        (not in IE)
            var range = window.getSelection().getRangeAt(0); // DOMÏÂ  
            this.focusNode = range.startContainer;
            this._onKeyPress({charCode:-1});
        },

        //////////// INITIALIZATION METHODS ///////////////////////////////////////

        constructor: function(){
            this.query={};
            this.fetchProperties={};
        },

        postMixInProperties: function(){
            this.store = this.entityStore; 
            if(!this.hasDownArrow){
                this.baseClass = "dijitTextBox";
            }
            if(!this.store){
                var srcNodeRef = this.srcNodeRef;

                // if user didn't specify store, then assume there are option tags
                this.store = new dijit.form._ComboBoxDataStore(srcNodeRef);

                // if there is no value set and there is an option list, set
                // the value to the first value to be consistent with native
                // Select

                // Firefox and Safari set value
                // IE6 and Opera set selectedIndex, which is automatically set
                // by the selected attribute of an option tag
                // IE6 does not set value, Opera sets value = selectedIndex
                if(    !this.value || (
                        (typeof srcNodeRef.selectedIndex == "number") && 
                        srcNodeRef.selectedIndex.toString() === this.value)
                ){
                    var item = this.store.fetchSelectedItem();
                    if(item){
                        this.value = this.store.getValue(item, this._getValueField());
                    }
                }
            }
        },
        
        _postCreate:function(){
            //find any associated label element and add to combobox node.
            var label=dojo.query('label[for="'+this.id+'"]');
            if(label.length){
                label[0].id = (this.id+"_label");
                var cn=this.comboNode;
                //dijit.setWaiState(cn, "labelledby", label[0].id);
                
            }
        },

        uninitialize:function(){
            if(this._popupWidget){
                this._hideResultList();
                this._popupWidget.destroy();
            }
        },

        _getMenuLabelFromItem:function(/*Item*/ item){
            var label = this.store.getValue(item, this.labelAttr || this.searchAttr);
            var labelType = this.labelType;
            // If labelType is not "text" we don't want to screw any markup ot whatever.
            if (this.highlightMatch!="none" && this.labelType=="text" && this._lastInput){
                label = this.doHighlight(label, this._escapeHtml(this._lastInput));
                labelType = "html";
            }
            return {html: labelType=="html", label: label};
        },
        
        doHighlight:function(/*String*/label, /*String*/find){
            // summary:
            //        Highlights the string entered by the user in the menu, by default this
            //        highlights the first occurence found. Override this method
            //        to implement your custom highlighing.
            // Add greedy when this.highlightMatch=="all"
            var modifiers = "i"+(this.highlightMatch=="all"?"g":"");
            var escapedLabel = this._escapeHtml(label);
            var ret = escapedLabel.replace(new RegExp("^("+ find +")", modifiers),
                    '<span class="dijitComboBoxHighlightMatch">$1</span>');
            if (escapedLabel==ret){ // Nothing replaced, try to replace at word boundaries.
                ret = escapedLabel.replace(new RegExp(" ("+ find +")", modifiers),
                    ' <span class="dijitComboBoxHighlightMatch">$1</span>');
            }
            return ret;// returns String, (almost) valid HTML (entities encoded)
        },
        
        _escapeHtml:function(/*string*/str){
            // TODO Should become dojo.html.entities(), when exists use instead
            // summary:
            //        Adds escape sequences for special characters in XML: &<>"'
            str = String(str).replace(/&/gm, "&").replace(/</gm, "<").replace(/>/gm, ">").replace(/"/gm, """);
            return str; // string
        },

        open:function(){
            this._isShowingNow=true;
            return dijit.popup.open({
                popup: this._popupWidget,
                around: this.domNode,
                parent: this
            });
        },
        
        reset:function(){
            //    summary:
            //        Additionally reset the .item (to clean up).
            this.item = null;
            this.inherited(arguments);
        },
        
        _onPaste: function(e)
        {
            setTimeout(dojo.hitch(this, '_processPasteText'), 1);            
        },
        
        _processPasteText: function()
        {
            var html = this.domNode.innerHTML;
            if (html.toLowerCase().indexOf('<div>') > 0)
            {
                html = '<div>' + html + '</div>';                
            }
            html = html.split('<br>').join('</div><div>');
            this.domNode.innerHTML = html;                    
            this.setData(this.getData());
        },
        
        _processDomStruct: function(key)
        {        
            if (key)
            {
                var range = window.getSelection().getRangeAt(0); // DOMÏÂ  
                var node = range.startContainer;
                console.log('Node type is ' + node.nodeType + ' and key is:' + key);
                if (isNaN(key))
                {
                    //literalInput
                    this._changeDomStructure(0, node);
                }
                else
                {
                    if (key == dojo.keys.ENTER)
                    {
                        this._changeDomStructure(1, node);
                    }
                    else if (key == dojo.keys.DELETE)
                    {
                        this._changeDomStructure(2, node);
                    }
                    else if (key == dojo.keys.BACKSPACE)
                    {
                        this._changeDomStructure(3, node);
                    }
                    else if (key === ' ' || key == dojo.keys.TAB)
                    {
                        this._changeDomStructure(4, node);
                    }
                }
            }             
        },
        
        //type 0 literal 1 ENTER 2 DELETE 3 BACKSPACE 4 SPACE or TAB
        _changeDomStructure: function(type, node)
        {
            var TEXT_NODE = 3, ELEMENT_NODE = 1;
            if (type == 0 || type == 4)
            {                
                if (node.nodeType == TEXT_NODE)
                {
                    //First Input
                    if (node.parentNode == this.domNode)
                    {
                        var text = node.textContent;
                        var trimText = dojo.trim(text);
                        var lineNode = dojo.create('DIV', {className: 'linediv'}, node, 'after');
                        if (trimText)
                        {
                            this.focusNode = dojo.create('SPAN', {innerHTML: trimText}, lineNode);
                        }
                        else
                        {
                            this.focusNode = this.createBlanSpan(text.length);
                            dojo.place(this.focusNode, lineNode);
                        }
                        dojo.destroy(node); 
                        this._setCaretPos(this.focusNode, this.focusNode.textContent.length);
                    }  
                    else if (node.parentNode.tagName == 'DIV')
                    {
                        dojo.addClass(node.parentNode, 'linediv');         
                        this.focusNode = dojo.create('SPAN', {innerHTML: node.textContent}, node, 'after');
                        dojo.destroy(node);
                        this._setCaretPos(this.focusNode, this.focusNode.textContent.length);
                    }
                    else if (node.parentNode.tagName == 'SPAN')
                    {                        
                        var text = node.textContent, spanNode = node.parentNode;
                        var trimText = dojo.trim(text);
                        if (trimText)
                        {
                            var pos = this._getCaretPos(node.parentNode);
                            var tempStrings = this.processLine(node.textContent);
                            var count = 0, findflag = true, refNode = node.parentNode;
                            for (var i = 0; i < tempStrings.length; i++)
                            {
                                count += tempStrings[i].length;
                                if (tempStrings[i])
                                {
                                    if (dojo.trim(tempStrings[i]))
                                    {
                                        var span = dojo.create('SPAN', {innerHTML: tempStrings[i]}, refNode, 'after');
                                    }
                                    else
                                    {
                                        var span = this.createBlanSpan(tempStrings[i].length);
                                        dojo.place(span, refNode, 'after');
                                    }                                    
                                    if (pos <= count && findflag)
                                    {
                                        this.focusNode = span;
                                        this._setCaretPos(span, tempStrings[i].length - (count - pos));
                                        findflag = false;
                                    }
                                    refNode = span;
                                }
                                else
                                {
                                    continue;
                                }
                            }
                            dojo.destroy(node.parentNode);
                            this.highlightText();
                        }
                        else
                        {
                            this.focusNode = node;
                        }
                    }
                    if (dojo.isFF)
                    {
                        var lineNode = (this.focusNode.nodeType == TEXT_NODE)?this.focusNode.parentNode.parentNode:this.focusNode.parentNode;
                        var spanNode = dojo.query('SPAN[type="FixFF"]', lineNode)[0];
                        dojo.destroy(spanNode);
                    }
                }
                else if (node.nodeType == ELEMENT_NODE)
                {
                    //It seemed this branch not triggerd
                }
            }
            else if (type == 1)
            {
                if (dojo.isFF)
                {
                    if (node.nodeType == TEXT_NODE)
                    {
                        //It seemed this branch not triggerd                                            
                    }
                    else if (node.nodeType == ELEMENT_NODE)
                    {
                        if (node.tagName == 'SPAN')
                        {
                            var srcLineNode = node.parentNode;
                            var pos = this._getCaretPos(node);
                            
                            var leftRange = document.createRange();
                            leftRange.selectNodeContents(srcLineNode);
                            var rightRange = leftRange.cloneRange();
                            
                            //set left range 1)clooapse to begin 2)set end 
                            leftRange.collapse(true);
                            leftRange.setEnd(node.childNodes[0], pos);                            
                            //set right range 1)clooapse to end 2)set Start 
                            rightRange.collapse(false);
                            rightRange.setStart(node.childNodes[0], pos);
                            
                            var leftPart = leftRange.extractContents();
                            var rightPart = rightRange.extractContents();
                            
                            dojo.empty(srcLineNode);
                            srcLineNode.appendChild(leftPart);
                            var destNode = dojo.create('DIV', {className: 'linediv'}, srcLineNode, 'after');
                            destNode.appendChild(rightPart);
                            this.focusNode = dojo.query('SPAN', destNode)[0];
                            dojo.forEach(dojo.query('BR', this.focusNode), function(x){
                                dojo.destroy(x);
                            });
                            if (!this.focusNode.textContent)
                            {
                                dojo.create('SPAN', {innerHTML: ' ', type: 'FixFF'}, this.focusNode, 'after');
                            }
                            this._setCaretPos(this.focusNode.parentNode, 0);
                        }
                        else if (node.tagName == 'DIV')
                        {
                            var htmlArr = node.innerHTML.split('<br>');
                            if (node == this.domNode)
                            {                            
                                var divHtmlArr = [];
                                divHtmlArr.push('<DIV class=\'linediv\'>');
                                divHtmlArr.push(htmlArr[0]);
                                divHtmlArr.push('</DIV>');
                                divHtmlArr.push('<DIV class=\'linediv\'>');
                                divHtmlArr.push(htmlArr[1]?htmlArr[1]:'');
                                divHtmlArr.push('</DIV>');
                                node.innerHTML = divHtmlArr.join('');  
                                var divs = dojo.query('DIV', node);
                                this.focusNode = divs[0];
                                this._setCaretPos(this.focusNode, this.focusNode.textContent.length);
                            }
                            else
                            {
                                node.innerHTML = htmlArr[0];
                                this.focusNode = dojo.create('DIV', {className: 'linediv', innerHTML: htmlArr[1]}, node, 'after');
                                this._setCaretPos(this.focusNode, 0);                                
                            }
                        }
                    }
                }
                else
                {
                    this.focusNode = node;                    
                }
            }
            else if (type == 2 || type == 3)
            {
                if (node.nodeType == TEXT_NODE)
                {
                    var elementNode = node.parentNode;
                    if (elementNode.tagName == 'SPAN')
                    {
                        this._processLineafterDeletion(elementNode.parentNode, node)
                    }
                    else if (elementNode.tagName == 'DIV' && elementNode != this.domNode)
                    {
                        this._processLineafterDeletion(elementNode, node)
                    }
                }
                else if (node.nodeType == ELEMENT_NODE)
                {
                    if (node.tagName == 'SPAN')
                    {
                        this._processLineafterDeletion(node.parentNode, node)
                    }
                    else if (node.tagName == 'DIV' && node != this.domNode)
                    {
                        this._processLineafterDeletion(node, node)
                    }
                }
            }            
            this.highlightText();            
        },
        
        highlightText: function()
        {
            dojo.forEach(dojo.query('DIV.linediv', this.domNode), function(line){
                var lineSpans = dojo.query('SPAN', line);
                var tempvalbegin = -1;
                for (var i = 0; i < lineSpans.length; i++)
                {
                    dojo.removeClass(lineSpans[i], 'keyWord');
                    dojo.removeClass(lineSpans[i], 'tempVal');
                    if (tempvalbegin == -1 && lineSpans[i].textContent.indexOf('${') == 0)
                    {
                        tempvalbegin = i;                                                
                    }
                    if (tempvalbegin == -1 && dojo.indexOf(this.keyWords, lineSpans[i].textContent) != -1)
                    {
                        dojo.addClass(lineSpans[i], 'keyWord');                        
                    }
                    if (tempvalbegin > -1 && lineSpans[i].textContent.indexOf('}') == 0)
                    {
                        for (var j = tempvalbegin; j <= i; j++)
                        {
                            dojo.addClass(lineSpans[j], 'tempVal');                                      
                        }
                        tempvalbegin = -1;
                    }
                }
            }, this);
        },
        
        _processLineafterDeletion: function(lineNode, focusNode)
        {
            if (!dojo.trim(focusNode.textContent))
            {
                this.leftString = '';
            }
            var TEXT_NODE = 3, ELEMENT_NODE = 1;
            var spanNodes = dojo.query('SPAN', lineNode);
            if (spanNodes.length == 1)
            {
                if (spanNodes[0].textContent)
                {
                    this.focusNode = focusNode;
                    this._setCaretPos(this.focusNode, this._getCaretPos(focusNode));                    
                }
                else
                {
                    if (dojo.isFF)
                    {
                        dojo.attr(spanNodes[0], {type: 'FixFF'});
                        spanNodes[0].innerHTML = ' ';
                        this.focusNode = spanNodes[0];
                        this._setCaretPos(this.focusNode, 0);                              
                    }
                    else
                    {
                        dojo.destroy(spanNodes[0]);
                        this.focusNode = lineNode;
                        this._setCaretPos(this.focusNode, this.focusNode.textContent.length);  
                    }
                }
            }
            else
            {
                var emptySpans = dojo.filter(spanNodes, function(x){
                    return !x.textContent;
                });
                if (emptySpans.length >= 1)
                {
                    this.focusNode = emptySpans[0];                    
                    var leftText = this.focusNode.previousSibling?this.focusNode.previousSibling.textContent:'';
                    var rightText = this.focusNode.nextSibling?this.focusNode.nextSibling.textContent:'';
                    if (leftText)
                    {
                        dojo.destroy(this.focusNode.previousSibling);
                    }
                    if (rightText)
                    {
                        dojo.destroy(this.focusNode.nextSibling);
                    }
                    if (dojo.trim(leftText) && (dojo.trim(rightText) && dojo.indexOf(this.noliterWords, rightText) == -1))
                    {
                        this.focusNode.textContent = leftText + rightText;
                    }
                    else
                    {
                        this.focusNode.textContent = leftText;
                        dojo.place(this.createBlanSpan(rightText.length), this.focusNode, 'after');
                    }
                    this._setCaretPos(this.focusNode, leftText.length);
                }
                else
                {
                    this.focusNode = focusNode;
                    this._setCaretPos(this.focusNode, this._getCaretPos(focusNode));
                }
            }            
        },
        
        createBlanSpan: function(length)
        {
            return dojo.create('SPAN', {innerHTML: dojo.string.pad('', length * 6, ' ')}); 
        },
        
        getData: function()
        {            
            var codes = [];
            dojo.forEach(dojo.query('DIV', this.domNode), function(line) {
                var tempcode = line.textContent;
                codes.push(tempcode);
            });
            codes = codes.join("\r\n");
            return codes;
        },
        
        setData: function(data)
        {            
            var linkArray = data.split('\r\n').join('\n').split('\r').join('\n').split('\n');
            dojo.empty(this.domNode);
            var htmlArr = [];
            for (var i = 0; i < linkArray.length; i++) 
            {
                htmlArr.push('<DIV class=\'linediv\'>');
                dojo.forEach(this.processLine(linkArray[i]), function(word){
                    htmlArr.push('<SPAN>');
                    htmlArr.push(word);
                    htmlArr.push('</SPAN>');
                }); 
                htmlArr.push('</DIV>');
            }
            this.domNode.innerHTML = htmlArr.join('');
            this.highlightText();   
        },
        
        processLine: function(text)
        {
            if (!text)
            {
                return [''];
            }
            var subBegin = 0, result = [], beginFlag = 0//literal
            if (!dojo.trim(text[0]))
            {
                beginFlag = 1;//space
            }
            else if (dojo.indexOf(this.noliterWords, text[0]) > -1)
            {
                beginFlag = 2; //none literal
            }
            for (var i = 1; i < text.length; i++)
            {
                if (beginFlag == 0 && (dojo.indexOf(this.noliterWords, text[i]) == -1 && dojo.trim(text[i])))
                {
                    continue;                    
                }
                else if (beginFlag == 1 && !dojo.trim(text[i]))
                {
                    continue;                    
                }
                else if (beginFlag == 2 && dojo.indexOf(this.noliterWords, text[i]) > -1)
                {
                    continue;                    
                }
                else
                {
                    result.push(text.substring(subBegin, i));
                    subBegin = i;
                    if (!dojo.trim(text[i]))
                    {
                        beginFlag = 1;//space
                    }
                    else if (dojo.indexOf(this.noliterWords, text[i]) > -1)
                    {
                        beginFlag = 2; //none literal
                    }
                    else
                    {
                        beginFlag = 0; //literal                        
                    }
                }
            }
            if (subBegin < text.length)
            {
                result.push(text.substring(subBegin, text.length));                
            }
            return result;
        }
    }
);
