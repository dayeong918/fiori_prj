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
                this.aStore_obj = []; // 20230530 : StepInput 객체 담는 변수
                this.price = []; // odataItem 객체 담는 변수.
                this.odataItem;
    
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
                var oDialog = this.byId("Dialog");
                if (oDialog) {
                    oDialog.open();
                    return;
                }else{
                this.loadFragment({
                    name: "zsalesorderfi.view.fragment.CustomerDialog"
                }).then(function(oDialog) {
                    oDialog.open();
                }, this); // this는 현재컨트롤러를 바라보게
                }
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

                   if (action === MessageBox.Action.OK) { // 주문하시겠습니까? 알림 창 뜨고 주문 진행.
                        if (this.aStore.length == 0){
                            MessageBox.warning('주문하실 아이템을 선택해주세요.');
                        } else {
                            var odatas = {   
                                "OrdDocNum":"",
                                "SD_ORD_I": [],
                            }
                            debugger;
                        for (var i=0; i<aStore.length; i++){
                            var nPrice = Number(aStore[i].Price) * aStore[i].cnt / 100
                            odatas.SD_ORD_I.push({
                                "OrdDocNum":"",
                                "SkuId":aStore[i].SkuId,
                                "Batch":aStore[i].Batch,
                                "WhId": "2000", // aStore[i].WhId,
                                "OrdQty":aStore[i].cnt,
                                "TotalPrice": String(nPrice),
                                "Currency": "KRW",
                                "StfUnit":"EA", 
                                "OutQty": aStore[i].cnt
                            });
                            console.log(odatas);
                        }
                
                        this.getView().getModel().create("/SD_ORD_HSet", odatas, {
                            success: function(oReturn){
                                console.log("성공");
                                console.log(oReturn);
    
                                this.getView().getModel("json").setData(); // item 테이블 초기화
                                this.getView().getModel("a").setProperty("/clickCount", 0); // 뱃지 초기화
                                odataModel.refresh(true, true); // header 테이블 초기화 (step input`)
                                // 20230530 : 선택했던 StepInput 전부 0 세팅 로직 추가
                                this.aStore_obj.forEach(function(item){
                                    item.setValue(0);
                                })
                                this.aStore_obj = [];
                                this.aStore = [];
    
                                MessageBox.success('주문을 생성하였습니다.')
                                
                            }.bind(this),
                            error: function(oReturn){
                                console.log("실패");
                                console.log(oReturn);
                            }
                        })
                        }
                        
/////////////////////////////////////////////////////////////////////////////////////////////////////     
                    }}.bind(this));
                    
                },
                handleCloseButton: function (oEvent) {
                this.byId("myPopover").close();
                }
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
                // var aStore = [];
                var boundValue = this.getView().getModel().getObject(oEvent.getSource().getBindingContext().getPath()).InvQty;
                var fullpath = this.getView().getModel().getObject(oEvent.getSource().getBindingContext().getPath());
                
                console.log(oModel);
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
                
                // 20230530 : 데이터 저장 후 StepInput 값을 강제로 0 세팅 하기 위한 로직
                this.aStore_obj.push(oEvent.getSource());

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
                        if(item.SkuId === sSelectSkuId && item.Batch === sBatch) {
                            item.cnt = enteredValue;
                            item.OrdQty = oEvent.getParameters().value;
                            debugger;
                        }
                        return item;
                    })

                }else{
                    odataItem.cnt = enteredValue;
                    this.aStore.push(odataItem); //aStore Json model에 아이템을 담음
                }
                jsonModel.setData(this.aStore); //데이터 세팅함.

                this.getView().getModel("a").setProperty("/clickCount", this.aStore.length);
                console.log(this.getView().getModel("a").getProperty("/clickCount"));

                        // 합계 금액 로직
                        // this.count = this.aStore.length       
                        // console.log(this.aStore.length);
                        

                        // for(var i = 0; i<=count; i++){
                        //     this.price = Number(this.aStore[i].Price)*this.aStore[i].cnt; 
                        //     console.log(this.price);
                        //     odataItem.total = this.price;
                        //     this.aStore.push(odataItem);
                        // };
                        // // debugger;
                        // jsonModel.setData(this.aStore); //데이터 세팅함.
                        
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
            },

            fnSectionChange : function(sValue) {
                this.byId("listPage").setSelectedSection(this.byId(sValue));
            }
            
        });
    });