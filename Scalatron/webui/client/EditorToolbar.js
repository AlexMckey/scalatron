(function () {
    EditorToolBar = {
        create:function () {

            var actions = [];

            function errorHandler(response) {
                disableActions(false);
                ErrorConsole.showError(response.responseText);
            }

            function disableActions(dis) {
                Ext.each(actions, function (e) {
                    e.setDisabled(dis);
                    if(dis) {
                        Events.fireEvent("progressStarted");
                    } else {
                        Events.fireEvent("progressEnded");
                    }
                })
            }

            function createPublishBuildAction(text, fn) {
                return Ext.create('Ext.Action', {
                    text:text,
                    handler:function (c) {
                        disableActions(true);

                        var botCode = Editor.getContent();

                        if (botCode) {

                            Events.fireEvent("progressUpdate", { message: "Saving sources" });

                            API.updateSourceFiles({
                                jsonData:{ files: [ { filename: "Bot.scala", code: botCode} ] },

                                success:function () {
                                    Events.fireEvent("progressUpdate", { message: "Building sources" });
                                    Events.fireEvent("documentSaved");

                                    API.build({
                                        success:function (result) {
                                            try {
                                                if (result.successful) {
                                                    ErrorConsole.hide(true);
                                                    if (fn) {
                                                        fn();
                                                    }
                                                } else {
                                                    ErrorConsole.show(result);
                                                }
                                            } finally {
                                                disableActions(false);
                                            }
                                        },

                                        failure:errorHandler
                                    });
                                },

                                failure:errorHandler
                            });
                        }

                    }
                });
            }

            var buildAction = createPublishBuildAction("Build");

            var buildAndPubAction = createPublishBuildAction('Publish into Tournament', function () {
                Events.fireEvent("progressUpdate", { message: "Publishing" });
                API.publish({});
            });

            var sandbox = createPublishBuildAction('Run in Sandbox', function () {
                Events.fireEvent("progressUpdate", { message: "Creating new sandbox" });
                API.createSandbox({
                    jsonData:{
                        config: {
                            "-x":"50",
                            "-y":"50",
                            "-perimeter":"open",
                            "-walls":"20",
                            "-snorgs":"20",
                            "-fluppets":"20",
                            "-toxifera":"20",
                            "-zugars":"20"
                        }
                    },
                    success:function () {
                        Debugger.show();
                    }
                });

            });

            var signOut = Ext.create('Ext.Action', {
                text: "Sign Out",
                handler:function (c) {
                    disableActions(true);
                    API.logout();
                    window.location = "/"
                }
            });

            var saveAction = Ext.create('Ext.Action', {
                text: "Save",
                handler:function (c) {
                    disableActions(true);
                    var botCode = Editor.getContent();
                    if (botCode) {
                        API.updateSourceFiles({
                            jsonData:{ files: [ { filename: "Bot.scala", code: botCode} ] },
                            success:function () {
                                disableActions(false);

                                Events.fireEvent("documentSaved")

                            },
                            failure:errorHandler
                        });
                    }
                }
            });

            actions.push(saveAction);
            actions.push(buildAction);
            actions.push(buildAndPubAction);
            actions.push(sandbox);

            var spinner = {
                xtype:"panel",
                width:22,
                height:22,
                border:0,
                bodyCls: "x-toolbar x-toolbar-default",
                items:[
                    Ext.create('Ext.Img', {
                        id: "loadingImage",
                        src:"/ext-4.0.7/resources/themes/images/gray/grid/nowait.gif",

                        stop: function() {
                            this.setSrc("/ext-4.0.7/resources/themes/images/gray/grid/nowait.gif")
                        },

                        start: function() {
                            this.setSrc("/ext-4.0.7/resources/themes/images/gray/grid/loading.gif");
                        },

                        listeners: {
                            afterrender: function() {
                                Events.on("progressStarted", this.start, this);
                                Events.on("progressEnded", this.stop, this);
                            }
                        }
                    })
                ]
            }


            return [ saveAction, "-", buildAction, "-", sandbox, "-", buildAndPubAction, "->", spinner, signOut]
        }
    };

})();