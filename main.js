define(function (require, exports, module) {
    "use strict";

    var Commands            = app.getModule("command/Commands"),
        CommandManager      = app.getModule("command/CommandManager"),
        Core                = app.getModule("core/Core"),
        Repository          = app.getModule("core/Repository"),
        DiagramManager      = app.getModule('diagrams/DiagramManager'),
        Dialogs             = app.getModule("dialogs/Dialogs"),
        ElementPickerDialog = app.getModule("dialogs/ElementPickerDialog"),
        FileSystem          = app.getModule("filesystem/FileSystem"),
        SelectionManager    = app.getModule('engine/SelectionManager'),
        Factory             = app.getModule("engine/Factory"),
        MenuManager         = app.getModule("menu/MenuManager");


    var unitTestPkg    = 'Tests::Unit';
    var featureTestPkg = 'Tests::Feature';
    var serviceTestPkg = 'Tests::Unit';

    var controllerPkg  = 'App::Http::Controllers';
    var repositoryPkg  = 'App::Domain::Allwissend::Repositories';
    var servicePkg     = 'App::Domain::Allwissend::Services';

    var angularServicePkg   = 'Angular::services';
    var angularInterfacePkg = 'Angular::interfaces';
    
    var defaulErd = 'Data Model';



    // Handler for HelloWorld command
    function handleHelloWorld() {
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function _handleCreateTest() {
        var selected = SelectionManager.getSelected();
        if(typeof(selected) != 'undefined'){
            console.log('Create a TestClass to ' + selected.name + ' as Test' + selected.name);
            var options = {
                modelInitializer: function (elem) {
                    elem.name = 'Test' + selected.name;
                    elem.isAbstract = 'false';
                }
            };

            var model = Repository.select("@UMLModel[name=Design Model]")[0];
            var testClass = Factory.createModel("UMLClass", model, 'ownedElements', options);

            var children = selected.getChildren();
            for (var i = 0; i < children.length; i++) {
                if(children[i] instanceof type.UMLOperation){
                    console.log ('   test' + capitalizeFirstLetter(children[i].name) );
                }else if(children[i] instanceof type.Tag){
                    //Do nothing...
                }
            }
        }
    }


    function _handleCreateLaravelServiceMRC(){
        var selected = SelectionManager.getSelected();
        if(typeof(selected) != 'undefined'){
            var itens = SelectionManager.getSelectedViews();
            if( itens.length == 3){
                var diagram = DiagramManager.getCurrentDiagram();

                
                var controller = getControllerFromViewItems(itens);
                console.log(controller);
                var repository = getRepositoryFromViewItems(itens);
                console.log(repository);
                var model = getModelFromViewItems(itens);
                console.log(model);

                var cumodel = getCurrentModel( model.model.getPath() );

                var scn = prompt("Please inform service class name:");
                var msm = prompt("Please inform main service method:");

                // Create class
                var classOptions = {
                    modelInitializer: function (elem) {
                        elem.name = capitalizeFirstLetter(scn);
                        elem.visibility = "public";
                        elem.documentation = "";
                        elem.isAbstract= false;
                    }
                };

                var pkg = Repository.select(servicePkg);
                var cls = Factory.createModel("UMLClass", pkg[0], 'ownedElements', classOptions);
                var oper = addOpertion(cls, msm);

                var viewOptions = {
                    x: 470, //Left
                    y: 265  //Top
                };
                var clsView = Factory.createViewOf(cls, diagram, viewOptions);
                clsView.fillColor = "#ffebd8";
                clsView.fontColor = "#000000";

                // Create associations
                    //Service uses model
                    //var ass = addAssociation(cumodel, diagram, controllerView, repositoryView, "UMLAssociation");
                    var ass = addAssociation(cumodel, diagram, clsView, model, "UMLDependency");
                    ass.model.name = "uses";
                    console.log(ass);

                    //Service uses repository
                    var ass = addAssociation(cumodel, diagram, clsView, repository, "UMLDependency");
                    ass.model.name = "uses";

                    //Controller has a service
                    var ass = addAssociation(cumodel, diagram, clsView, controller, "UMLAssociation");
                    ass.model.name = "has a";
                    ass.model.end1.name = "service";
                    ass.model.end1.navigable = true;
                    ass.model.multiplicity = "1";
                    ass.model.visibility = "private";


                // Check for Test
                var testCls = Repository.select(serviceTestPkg + '::' + model.model.name + "ServicesTest");
                if( testCls.length == 0 ){
                    // Not found: Create
                    var testOptions = {
                        modelInitializer: function (elem) {
                            elem.name = model.model.name + "ServicesTest";
                            elem.visibility = "public";
                            elem.documentation = "";
                            elem.isAbstract= false;
                        }
                    };

                    var pkg = Repository.select(serviceTestPkg);
                    var testCls = Factory.createModel("UMLClass", pkg[0], 'ownedElements', testOptions);
                    addOpertion(testCls, "setUp");
                    var viewOptions = {
                        x: 50, //Left
                        y: 265  //Top
                    };
                    var testView = Factory.createViewOf(testCls, diagram, viewOptions);
                    testView.fillColor = "#007c3e";
                    testView.fontColor = "#ffffff";
                    // addAssociation(cumodel, diagram, testView, clsView, "UMLDependency"); 
                }else{
                    testCls = testCls[0];
                }

                addOpertion(testCls, "test" + capitalizeFirstLetter(scn));
                    
                // Add associaction
                var views = Repository.getViewsOf( testCls );
                for(var i=0;i<views.length;i++){
                    if( views[i] instanceof type.UMLClassView && views[i]._parent == diagram ){
                        addAssociation(cumodel, diagram, views[i], clsView, "UMLDependency"); 
                        break;
                    }
                }
                    // Test uses service
            }else{
                alert('Too low');
            }
        }
    }
    function getRepositoryFromViewItems(itens){
        for(var i=0;i<itens.length;i++){
            if(itens[i] != null && itens[i].model.name.indexOf("Repository") >= 0 ){
                return itens[i];
            }
        }
    }
    function getModelFromViewItems(itens){
        for(var i=0;i<itens.length;i++){
            if( itens[i].model.name.indexOf("Controller") == -1 && itens[i].model.name.indexOf("Repository") == -1 ){
                return itens[i];
            }
        }

    }
    function getControllerFromViewItems(itens){
        for(var i=0;i<itens.length;i++){
            if(itens[i] != null && itens[i].model.name.indexOf("Controller") >= 0 ){
                return itens[i];
            }
        }
    }


    function _handleCreateLaravelRepository() {
        var selected = SelectionManager.getSelected();
        if(typeof(selected) != 'undefined'){
            
            var model = getCurrentModel( selected.getPath() );
            var diagram=DiagramManager.getCurrentDiagram();
            
            /*********************************************************/
            console.log('Create a repository class to ' + selected.name + ' as ' + selected.name + 'Repository');
            var repositoryOptions = {
                modelInitializer: function (elem) {
                    elem.name = selected.name + 'Repository';
                    elem.visibility = "public";
                    elem.documentation = "";
                    elem.isAbstract= false;
                }
            };
            var pkg = Repository.select(repositoryPkg);
            var repositoryClass = Factory.createModel("UMLClass", pkg[0], 'ownedElements', repositoryOptions);
            addAttribute(repositoryClass, "modelClass");

            //create UMLClassView to Repository 
            var viewOptions = {
                x: 640, //Left
                y: 160  //Top
            };
            var repositoryView = Factory.createViewOf(repositoryClass, diagram, viewOptions);
            repositoryView.fillColor = "#ffebd8";
            repositoryView.fontColor = "#000000";

            /*********************************************************/
            console.log('Create a repository test class to ' + selected.name + ' as ' + selected.name + 'RepositoryTest');
            var repositoryTestOptions = {
                modelInitializer: function (elem) {
                    elem.name = selected.name + 'RepositoryTest';
                    elem.visibility = "public";
                    elem.documentation = "";
                    elem.isAbstract= false;
                }
            };

            var pkg = Repository.select(unitTestPkg);
            var repositoryTestClass = Factory.createModel("UMLClass", pkg[0], 'ownedElements', repositoryTestOptions);

            addOpertion(repositoryTestClass, "setUp");
            var oper = addOpertion(repositoryTestClass, "testNewQuery");
            oper.specification = "\t\t$r = new " + selected.name + "Repository();\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r);\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r->newQuery());\n";
        
            var oper = addOpertion(repositoryTestClass, "testDoQuery");
            oper.specification = "\t\t$r = new " + selected.name + "Repository();\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r);\n";

            var oper = addOpertion(repositoryTestClass, "testFindById");
            oper.specification = "\t\t$r = new " + selected.name + "Repository();\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r);\n";
            
            var oper = addOpertion(repositoryTestClass, "testListAll");
            oper.specification = "\t\t$r = new " + selected.name + "Repository();\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r);\n";
            
            var oper = addOpertion(repositoryTestClass, "testUpdate");
            oper.specification = "\t\t$r = new " + selected.name + "Repository();\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r);\n";
            
            var oper = addOpertion(repositoryTestClass, "testDelete");
            oper.specification = "\t\t$r = new " + selected.name + "Repository();\n";
            oper.specification+= "$this->assertInstanceOf(RepositoryInterface::class, $r);\n";
            
            //create UMLClassView to Repository 
            var viewOptions = {
                x: 470, //Left
                y: 265  //Top
            };
            var repositoryTestView = Factory.createViewOf(repositoryTestClass, diagram, viewOptions);
            repositoryTestView.fillColor = "#007c3e";
            repositoryTestView.fontColor = "#ffffff";

            addAssociation(model, diagram, repositoryTestView, repositoryView, "UMLDependency");

            /*********************************************************/
            console.log('Create a controller class to ' + selected.name + ' as ' + selected.name + 'Controller');
            var controllerOptions = {
                modelInitializer: function (elem) {
                    elem.name = selected.name + 'Controller';
                    elem.visibility = "public";
                    elem.documentation = "";
                    elem.isAbstract= false;
                }
            };


            var pkg = Repository.select(controllerPkg);
            var controllerClass = Factory.createModel("UMLClass", pkg[0], 'ownedElements', controllerOptions);
            addTextTag(controllerClass, "@Swagger", '@SWG\\Info(title="' +  selected.name + ' Controller REST API", version="1.0.0")');

            var oper = addOpertion(controllerClass, "save");
            addTextTag(oper, "@Swagger", '@SWG\\Post(path="' + selected.name + '", summary="Save or update a new ' + selected.name + '", @SWG\Response(response=200, description="A new or saved ' + selected.name + '"))');
            oper.specification = "\t\t$this->validate(\n";
            oper.specification+= "\t$request, [\n";
            oper.specification+= "\t]\n";
            oper.specification+= ");\n\n";
            oper.specification+= "return response()->json([$" + selected.name.toLowerCase() +", $request]);\n";

            var oper = addOpertion(controllerClass, "delete");
            addTextTag(oper, "@Swagger", '@SWG\\Delete(path="' + selected.name + '", summary="Delete a ' + selected.name + '", @SWG\Response(response=200, description="A new or saved ' + selected.name + '"))');

            var oper = addOpertion(controllerClass, "update");
            addTextTag(oper, "@Swagger", '@SWG\\Put(path="' + selected.name + '", summary="Update a ' + selected.name + '", @SWG\Response(response=200, description="A new or saved ' + selected.name + '"))');
            oper.specification = "\t\t$this->validate(\n";
            oper.specification+= "\t$request, [\n";
            oper.specification+= "\t]\n";
            oper.specification+= ");\n\n";
            oper.specification+= "return response()->json([$" + selected.name.toLowerCase() +", $request]);\n";

            var oper = addOpertion(controllerClass, "list");
            addTextTag(oper, "@Swagger", '@SWG\\Get(path="' + selected.name + '", summary="List all ' + selected.name + '", @SWG\Response(response=200, description="A new or saved ' + selected.name + '"))');

            var oper = addOpertion(controllerClass, "search");
            addTextTag(oper, "@Swagger", '@SWG\\Get(path="' + selected.name + '", summary="Serach for one or many ' + selected.name + '", @SWG\Response(response=200, description="A new or saved ' + selected.name + '"))');

            //create UMLClassView to Controller 
            var viewOptions = {
                x: 200, // left
                y: 160, // top
            };
            var controllerView = Factory.createViewOf(controllerClass, diagram, viewOptions);
            controllerView.fillColor = "#ffebd8";
            controllerView.fontColor = "#000000";

            var ass = addAssociation(model, diagram, controllerView, repositoryView, "UMLAssociation");
            ass.name = "has a";
            // ass.end2.navigable = true;
            // ass.end2.name = "repository";
            // ass.end2.visibility= "private";
            // ass.end1.navigable = false;

            /*********************************************************/
            // Create Controller Test
            console.log('Create a controller test class to ' + selected.name + ' as ' + selected.name + 'ControllerTest');
            var controllerTestOptions = {
                modelInitializer: function (elem) {
                    elem.name = selected.name + 'ControllerTest';
                    elem.visibility = "public";
                    elem.documentation = "";
                    elem.isAbstract= false;
                }
            };

            
            var pkg = Repository.select(featureTestPkg);
            var controllerTestClass = Factory.createModel("UMLClass", pkg[0], 'ownedElements', controllerTestOptions);
            var oper   = addOpertion(controllerTestClass, "setUp");

            var oper   = addOpertion(controllerTestClass, "testSave");
            oper.documentation+= "Tests the method save() from " + selected.name + "Controller class";

            oper.specification = "\t\t//Teting web version of controller\n";
            oper.specification+= "\t\t$response = $this->post('/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";

            oper.specification+= "\t\t//Teting api version of controller\n";
            oper.specification+= "\t\t$response = $this->post('/api/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";
            

            var oper   = addOpertion(controllerTestClass, "testDelete");
            oper.documentation+= "Tests the method delete() from " + selected.name + "Controller class";

            oper.specification = "\t\t//Teting web version of controller\n";
            oper.specification+= "\t\t$response = $this->delete('/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";

            oper.specification+= "\t\t//Teting api version of controller\n";
            oper.specification+= "\t\t$response = $this->delete('/api/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";
            
            
            var oper   = addOpertion(controllerTestClass, "testUpdate");
            oper.documentation+= "Tests the method update() from " + selected.name + "Controller class";

            oper.specification = "\t\t//Teting web version of controller\n";
            oper.specification+= "\t\t$response = $this->put('/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";

            oper.specification+= "\t\t//Teting api version of controller\n";
            oper.specification+= "\t\t$response = $this->put('/api/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";
            
            
            var oper   = addOpertion(controllerTestClass, "testList");
            oper.documentation+= "Tests the method list() from " + selected.name + "Controller class";

            oper.specification = "\t\t//Teting web version of controller\n";
            oper.specification+= "\t\t$response = $this->get('/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";

            oper.specification+= "\t\t//Teting api version of controller\n";
            oper.specification+= "\t\t$response = $this->get('/api/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";
            
            
            var oper   = addOpertion(controllerTestClass, "testSearch");
            oper.documentation+= "Tests the method search() from " + selected.name + "Controller class";

            oper.specification = "\t\t//Teting web version of controller\n";
            oper.specification+= "\t\t$response = $this->getput('/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";

            oper.specification+= "\t\t//Teting api version of controller\n";
            oper.specification+= "\t\t$response = $this->get('/api/" + selected.name.toLowerCase() + "');\n";
            oper.specification+= "\t\t$response->assertStatus(200);\n\n";
            
            
            

            //create UMLClassView to Controller Test
            var viewOptions = {
                x: 50, //Left
                y: 265  //Top
            };
            var controllerTestView = Factory.createViewOf(controllerTestClass, diagram, viewOptions);
            controllerTestView.fillColor = "#007c3e";
            controllerTestView.fontColor = "#ffffff";

            addAssociation(model, diagram, controllerTestView, controllerView, "UMLDependency");

            
        }
    }



    function addTextTag(elm, name, txt){
        // Options for creating a tag
        var options = {
            modelInitializer: function (tag) {
                tag.name = name;
                tag.kind = Core.TK_HIDDEN; // or TK_STRING TK_BOOLEAN, TK_NUMBER, TK_REFERENCE, TK_HIDDEN
                tag.value = txt;
                // tag.checked = true; // for TK_BOOLEAN
                // tag.number = 100; // for TK_NUMBER
                // tag.reference = ...; // for TK_REFERENCE
            }
        };
        // Create a tag to the selected element
        var tag1 = Factory.createModel("Tag", elm, 'tags', options);
        return tag1;
    }

    function addAssociation(model, diagram, from, to, type){
        // Create an association connecting the two classes (controllerTest X controller)
            var association = {
                tailView: from,
                headView: to,
                tailModel: from.model,
                headModel: to.model
            };
            var assoView = Factory.createModelAndView(type, model, diagram, association);
            return assoView;
    }

    function addAttribute(elm, attr){
        var attribute = {
            modelInitializer: function (elem) {
                elem.visibility = "protected";
                elem.name = attr;
                elem.type = "";
                elem.documentation = "";
            }
        };
        var oper = Factory.createModel("UMLAttribute", elm, 'attributes', attribute);
        return oper;
    }

    function addOpertion(elm, ope){
        var operation = {
            modelInitializer: function (elem) {
                elem.visibility = "public";
                elem.name = ope;
                elem.text = "+" + ope + "()";
                elem.concurrency = "sequential";
                elem.documentation = "";
            }
        };
        var oper = Factory.createModel("UMLOperation", elm, 'operations', operation);
        return oper;
    }

    function getCurrentModel(elm){
        for(var i=elm.length; i>0; i--){
            if(elm[i] instanceof type.UMLModel){
                return elm[i];
            }
        }
        return null;
    }

    function getCurrentDiagram(elm){
        for(var i=elm.length; i>0; i--){
            if(elm[i] instanceof type.UMLModel){
                return elm[i];
            }
        }
        return null;
    }

    // Add a HelloWorld command
    //var CMD_HELLOWORLD = "tools.helloworld";
    //CommandManager.register("Hello World", CMD_HELLOWORLD, handleHelloWorld);
    /**
     * Commands IDs
     */
    var CMD_IRGM           = 'irgm',
        CMD_IRGM_CREATE    = 'irgm.create',
        CMD_IRGM_CRT_TEST  = 'irgm.create.test',
        CMD_IRGM_GENERATE  = 'php.generate',
        CMD_IRGM_CONFIGURE = 'php.configure';


    CommandManager.register("IRGM",              CMD_IRGM,           CommandManager.doNothing);
    // CommandManager.register("Create",           CMD_IRGM_CREATE,    CommandManager.doNothing);
    CommandManager.register("Create Test Class", CMD_IRGM_CRT_TEST,  _handleCreateTest);

    // CommandManager.register("Generate Code...", CMD_PHP_GENERATE,  _handleGenerate);
    // CommandManager.register("Configure...",     CMD_PHP_CONFIGURE, _handleConfigure);

    var menu, menuItem;
    menu = MenuManager.getMenu(Commands.TOOLS);
    menuItem = menu.addMenuItem(CMD_IRGM);
    menuItem.addMenuItem(CMD_IRGM_CRT_TEST);
    // menuItem.addMenuDivider();
    // menuCreate.addMenuItem(CMD_IRGM_CRT_TEST);


    var CMD_IMLARA             = 'imlaravel',
        CMD_IMLARA_CREATE_REPO = 'imlaravel.create.repository',
        CMD_IMLARA_CREATE_SERV = 'imlaravel.create.service.from.mrc',
        CMD_IMLARA_CONFIG      = 'imlaravel.configure',
        CMD_IMLARA_ABOUT       = 'imlaravel.about';


    CommandManager.register("Laravale Helper",   CMD_IMLARA,              CommandManager.doNothing);
    CommandManager.register("Create Repository", CMD_IMLARA_CREATE_REPO,  _handleCreateLaravelRepository);
    CommandManager.register("Configuration",     CMD_IMLARA_CONFIG,       _handleCreateTest);
    CommandManager.register("About",             CMD_IMLARA_ABOUT,        _handleCreateTest);
    CommandManager.register("Create Service from M-R-C", CMD_IMLARA_CREATE_SERV,  _handleCreateLaravelServiceMRC);

    // CommandManager.register("Generate Code...", CMD_PHP_GENERATE,  _handleGenerate);
    // CommandManager.register("Configure...",     CMD_PHP_CONFIGURE, _handleConfigure);

    var menu, menuItem;
    menu = MenuManager.getMenu(Commands.TOOLS);
    menuItem = menu.addMenuItem(CMD_IMLARA);
    menuItem.addMenuItem(CMD_IMLARA_CREATE_REPO);
    menuItem.addMenuItem(CMD_IMLARA_CREATE_SERV);
    menuItem.addMenuDivider();

    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_IMLARA_CONFIG);
    menuItem.addMenuItem(CMD_IMLARA_ABOUT);




    var CMD_IMDEGPAR             = 'imdegpar',
        CMD_IMDEGPAR_CREATE_DECO = 'imdegpar.create.decorator',
        CMD_IMDEGPAR_CREATE_COMP = 'imdegpar.create.composite',
        CMD_IMDEGPAR_CONFIG      = 'imdegpar.configure',
        CMD_IMDEGPAR_ABOUT       = 'imdegpar.about';


    CommandManager.register("Design Patterns",          CMD_IMDEGPAR,              CommandManager.doNothing);
    CommandManager.register("Create Decorator Pattern", CMD_IMDEGPAR_CREATE_DECO,  _handleCreateLaravelRepository);
    CommandManager.register("Create Composite Pattern", CMD_IMDEGPAR_CREATE_COMP,  _handleCreateLaravelRepository);
    CommandManager.register("Configuration",            CMD_IMDEGPAR_CONFIG,       _handleCreateTest);
    CommandManager.register("About",                    CMD_IMDEGPAR_ABOUT,        _handleCreateTest);

    var menu, menuItem;
    menu = MenuManager.getMenu(Commands.TOOLS);
    menuItem = menu.addMenuItem(CMD_IMDEGPAR);
    menuItem.addMenuItem(CMD_IMDEGPAR_CREATE_DECO);
    menuItem.addMenuItem(CMD_IMDEGPAR_CREATE_COMP);

    menuItem.addMenuDivider();
    menuItem.addMenuItem(CMD_IMDEGPAR_CONFIG);
    menuItem.addMenuItem(CMD_IMDEGPAR_ABOUT);

});
