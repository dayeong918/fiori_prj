sap.ui.define([
    'sap/ui/core/Fragment',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageBox'
  ], 
  
      function(Controller, JSONModel, library, MessageBox, Fragment) {
        "use strict";
    
        return Controller.extend("salesorderfi.controller.Popover", {
          onInit(evt) {
            var oButton = oEvent.getSource(),
            oView = this.getView();
  
            // create popover
            if (!this._pPopover) {
              this._pPopover = Fragment.load({
                id: oView.getId(),
                name: "salesorderfiori.view.fragment.Popover",
                controller: this
              }).then(function(oPopover){
                oView.addDependent(oPopover);
                return oPopover;
              });
            }
  
              this._pPopover.then(function(oPopover){
                  oPopover.openBy(oButton);
              });
  
      },
        handleWizardCancel: function () {
              this._handleMessageBoxOpen("Are you sure you want to cancel your purchase?", "warning");
        this.byId("close").close();
          },
         
              });
          }
    );
      
    