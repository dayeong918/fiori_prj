/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zsales_order_fi/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
