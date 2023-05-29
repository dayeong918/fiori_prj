sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    'sap/ui/model/odata/v2/ODataModel',
    "sap/ui/core/format/NumberFormat"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast, Fragment, MessageBox,ODataModel,NumberFormat) {
        "use strict";

        return Controller.extend("zsalesorderfi.controller.Main", {
            onInit: function (evt) {
                
                // create model with settings
                this.oModel = new JSONModel();
                this.oModel.setData({
                    badgeMin:			"1",
                    badgeMax:			"9999",
                    badgeCurrent:		1,
                    buttonText: 		"Button with Badge",
                    buttonIcon: 		"sap-icon://cart",
                    buttonType: 		"Default",
                    buttonWithIcon:		true,
                    buttonWithText:		true
                });
                this.getView().setModel(this.oModel,"a");
                this.jsonModel = this.getView().setModel(new JSONModel(),"json");
                this.aStore = []; // 함수 외부에 aStore 변수 정의 및 초기화
    
                // create internal vars with instances of controls
                this.oLabel = this.byId("ButtonLabel");
                this.oButton = this.byId("BadgedButton");
                this.oMin = this.byId("MinInput");
                this.oMax = this.byId("MaxInput");
                this.oCurrent = this.byId("CurrentValue");
                this.oLabelCheckBox = this.byId("LabelCheckBox");
                // 컨트롤러 부분입니다.
            },
            // current value or min/max values change handler
            currentChangeHandler: function() {
                var iCurrent = this.oCurrent.getValue(),
                    oButtonBadgeCustomData = this.oButton.getBadgeCustomData(),
                    sValue = iCurrent.toString();
    
                if (!oButtonBadgeCustomData) {
                    return;
                }
    
                oButtonBadgeCustomData.setValue(sValue);
            },
            
            cartPress: function(oEvent){
                //popover 로직
                var oButton = oEvent.getSource(),
                oView = this.getView();
            // create popover
            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "zsalesorderfi.view.fragment.Popover",
                    controller: this
                }).then(function(oPopover) {
                    oView.addDependent(oPopover);
                    // oPopover.bindElement("/ProductCollection/0");
                    oPopover.bindElement('json');
                    console.log(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function(oPopover) {
                oPopover.openBy(oButton);
            });
            },
            soPress: function(){

            },
            _handleMessageBoxOpen: function (Message, sMessageBoxType) {
                MessageBox[sMessageBoxType](Message, {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.YES) { // 구매한다 할 때 로직
                            // this._wizard.discardProgress(this._wizard.getSteps()[0]);
                            // this.handleNavBackToList();
                            this.handleDamdaSubmit();
                        }
                    }.bind(this)
                });
            },
            leWizardCancel: function () {
                // this._handleMessageBoxOpen("Are you sure you want to cancel your purchase?", "warning");
                this.byId("myPopover").close();
            },
            _handleMessageBoxOpen2: function(message, messageType, callback) {
                sap.m.MessageBox.show(
                    message,
                    messageType,
                    "확인",
                    [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    function(action) {
                        if (callback && typeof callback === "function") {
                            callback(action);
                        }
                    }
                );
            },
            handleDamdaSubmit: function(){
                var odataModel = this.getView().getModel();
                var aStore = this.getView().getModel("json").getData();
                this._handleMessageBoxOpen2("주문오더를 생성하시겠습니까?", "confirm", function(action){
                    // var jsonModel = this.getView().getModel("json");                    

                    if (action === MessageBox.Action.OK) {
                        // 주문하시겠습니까? 알림 창 뜨고 주문 진행.
                        console.log("구매시작");
                        // 담긴 애들
                        
                        var ODatas = [];
                        for (var i = 0; i < aStore.length; i++) {
                        ODatas.push({
                            "ORD_DOC_NUM": String(i),
                            "SKU_ID": aStore[i].SkuId,
                            "BATCH": aStore[i].Batch,
                            "ORD_QTY": aStore[i].cnt
                            // "TotalPrice": aStore[i].cnt * Number(aStore[i].Price),
                        });
                        }
                        odataModel.create("/SD_ORD_ISet", ODatas
                        , {
                            success: function(oRetrun){
                                console.log("성공");
                                return oRetrun;
                            },
                            error: function(){
                                console.log("실패");
                            }
                        })
                        }
                        
                        debugger;
        
                    })}
                ,handleDelete: function(oEvent) {
                    // 이거 고쳐야 함
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
                onValueChange: function(oEvent){
                var oModel = this.getOwnerComponent().getModel();
                var jsonModel = this.getView().getModel("json");
                var enteredValue = oEvent.getParameter("value");
                var aStore = [];
                var boundValue = this.getView().getModel().getObject(oEvent.getSource().getBindingContext().getPath()).InvQty;
                var fullpath = this.getView().getModel().getObject(oEvent.getSource().getBindingContext().getPath());
                
                console.log(oModel);
                debugger;
                // value state 설정
                if (enteredValue == 0) {
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.none);
                    oEvent.getSource().setValueStateText("품절입니다.");
                  }
                else if (enteredValue > boundValue) {
                  oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                  oEvent.getSource().setValueStateText("구매 수량이 현재 재고량보다 초과되었습니다.");
                } else if(enteredValue <= boundValue){
                  oEvent.getSource().setValueState(sap.ui.core.ValueState.Success);
                };

                // // 장바구니 추가 삭제 로직
                var odataItem = this.getView().getModel().getObject(oEvent.getSource().getBindingContext().getPath());
                var sSelectSkuId, sBatch;
                // aStore.push(odataItem);
                var hasItem = this.aStore.some(function(item){ //some : 값을 찾아주는 함수
                    if(item.SkuId === odataItem.SkuId && item.Batch === odataItem.Batch) {
                        sSelectSkuId = item.SkuId;
                        sBatch = item.Batch;
                        return true;
                    }
                    return false; 
                });
                

                if(hasItem){
                    if(enteredValue === 0) {

                        // 장바구니에 데이터가 있는데 StepInput 값이 0 인 경우, json model 에서 해당 데이터 삭제
                        if (enteredValue === 0) {
                            var indexToRemove = this.aStore.findIndex(function(item) {
                                return item.SkuId === sSelectSkuId && item.Batch === sBatch;
                            });
                        
                            if (indexToRemove > -1) {
                                this.aStore.splice(indexToRemove, 1); //해당 데이터 삭제
                                jsonModel.setData(this.aStore); // 변경된 데이터를 모델에 설정
                            }
                        }
                    }
                    this.aStore = this.aStore.map(function(item){ //map : 배열로 결과도출
                        if(item.SkuId === sSelectSkuId && item.Batch === sBatch) item.cnt = enteredValue;
                        return item;
                    })

                }else{
                    odataItem.cnt = enteredValue;
                    this.aStore.push(odataItem); //aStore Json model에 아이템을 담음
                }
                jsonModel.setData(this.aStore); //데이터 세팅함.

                this.getView().getModel("a").setProperty("/clickCount", this.aStore.length);
                console.log(this.getView().getModel("a").getProperty("/clickCount"));
                
                // odata에 create된 애들 생성해주기
                // this.oModel.create("/Purchase", aStore, {
                //     success: function() {
                //         MessageToast.show("주문이 완료되었습니다.");
                //     }, 
                //     error: function(){
                //         MessageToast.show("주문이 생성되지 않았습니다.");
                //     }
                // })                
            }
            
        });
    });
