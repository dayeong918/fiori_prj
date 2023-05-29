sap.ui.define([
  'sap/ui/core/Fragment',
  'sap/ui/core/mvc/Controller',
  'sap/ui/model/json/JSONModel',
  'sap/m/MessageBox'
], 
// @param {typeof sap.ui.core.mvc.Controller} Controller

function (Fragment, Controller, JSONModel, MessageBox) {
  "use strict";

  return Controller.extend("zsalesorderfi.controller.Popover", {
    onInit: function (evt) {
      var oButton = oEvent.getSource(),
        oView = this.getView();

      // create popover
      if (!this._pPopover) {
        this._pPopover = Fragment.load({
          id: oView.getId(),
          name: "zsalesorderfi.view.fragment.Popover",
          controller: this
        }).then(function (oPopover) {
          oView.addDependent(oPopover);
          return oPopover;
        });
      }

      this._pPopover.then(function (oPopover) {
        oPopover.openBy(oButton);
      });

    },
    handleDelete: function (oEvent) {
      var listItem = oEvent.getParameter("listItem");
      var data = oEvent.getParameter("listItem").getParent().getItems();

      if (data.length <= 1) {
        return;
      }

      for (var i = 0; i < data.length; i++) {
        if (data[i].getTitle() === listItem.getTitle()) {
          data.splice(i, 1);
          this.calcTotal();
          this.model.updateBindings();
          break;
        }
      }
    },
    handleWizardCancel: function () {
      this._handleMessageBoxOpen("Are you sure you want to cancel your purchase?", "warning");
      this.byId("close").close();
    },
    leWizardCancel: function () {
      this.byId("myPopover").close();
    },
    handleDamdaSubmit: function () {
      var odataModel = this.getView().getModel();
      var aStore = this.getView().getModel("json").getData();
      this._handleMessageBoxOpen2("주문오더를 생성하시겠습니까?", "confirm", function (action) {
        if (action === MessageBox.Action.OK) {
          console.log("구매시작");
          var ODatas = [];
          for (var i = 0; i < aStore.length; i++) {
            ODatas.push({
              "ORD_DOC_NUM": String(i),
              "SKU_ID": aStore[i].SkuId,
              "BATCH": aStore[i].Batch,
              "ORD_QTY": aStore[i].cnt
            });
          }
          odataModel.create("/SD_ORD_ISet", ODatas, {
            success: function (oRetrun) {
              console.log("성공");
              return oRetrun;
            },
            error: function () {
              console.log("실패");
            }
          });
        }
        debugger;
      });
    }
  });
});