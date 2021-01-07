require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/layers/TileLayer",
    "esri/widgets/LayerList",
    "esri/widgets/Search",
    "esri/widgets/BasemapToggle",
    "esri/widgets/Expand",
    "esri/widgets/Editor",
    "esri/widgets/Home",
    "esri/Viewpoint",
    "dijit/Dialog"
  ], function (
    Map,
    MapView,
    FeatureLayer,
    TileLayer,
    LayerList,
    Search,
    BasemapToggle,
    Expand,
    Editor,
    Home,
    Viewpoint,
    Dialog
  ) {
    // create splash screen to explain map and let map load
    var splashScreen = new Dialog({
      title: "About",
      content: "<p>The <b>Agricultural District Assessment Tool</b> was developed to gain comment from the public regarding the current boundaries of Chautauqua County's Agricultural Districts. Comments provided will be reviewed by planning staff at the Chautauqua County Department of Planning & Development to determine modifications to the district boundaries.</p>" +
      "<p>Located on the left is a <b>Layer List & Legend</b>, which you can use to toggle the visibility of different data layers. To add a comment to the map, click the <b>Editor</b> icon (symbolized as a pencil) at the top-left edge of the map view. Please provide your name and a way to contact you so our planning staff can follow up regarding your comment.</p>" +
      "<p>If you have any questions, please contact:</br>Brendan Cullen | Planning Technician</br>716-753-4063</br><a href='mailto:cullenb@co.chautauqua.ny.us'>cullenb@co.chautauqua.ny.us</a></br><a href='https://planningchautauqua.com'>planningchautauqua.com</a>.</p>",
      style: "width: 600px"
    });
    splashScreen.show()
    
    // create map objects
    var map = new Map({
      basemap: "streets-relief-vector",
    });
    
    // create view object of map
    var view = new MapView({
      container: "viewDiv",
      map: map,
      zoom: 10
    });

    // create search widget
    var searchWidget = new Search({
      view: view
    });
    view.ui.add(searchWidget, "top-right");

    // Add a legend instance to the panel of a
    // ListItem in a LayerList instance
    // snippet taken from arcgis javascript api guide
    const layerList = new LayerList({
      view: view,
      container: layerListWidget,
      listItemCreatedFunction: function(event) {
        const item = event.item;
        if (item.layer.type != "group") {
          // don't show legend twice
          item.panel = {
            content: "legend",
            open: true
          };
        }
      }
    });

    // create home widget
    var home = new Home({
      view: view,
    });
    view.ui.add(home, "top-left");

    // create editor widget
    var editor = new Editor({
      view: view,
      allowedWorkflows: ["create"]
    });
    // put editor widget in expand widget
    var editorExpand = new Expand({
      expandIconClass: "esri-icon-edit",
      view: view,
      content: editor
    });
    view.ui.add(editorExpand, "top-left");

    // create basemap toggle widget
    var toggle = new BasemapToggle({
      view: view,
      nextBasemap: "hybrid"
     });
     view.ui.add(toggle, "top-right");

    // define service urls for layers
    var agDistrictServiceUrl = "https://services9.arcgis.com/6EuFgO4fLTqfNOhu/arcgis/rest/services/agCHAU2016/FeatureServer";
    var farmlandServiceUrl = "https://tiles.arcgis.com/tiles/6EuFgO4fLTqfNOhu/arcgis/rest/services/FramlandClass_Chautauqua/MapServer";
    var landCoverServiceUrl = "https://tiles.arcgis.com/tiles/6EuFgO4fLTqfNOhu/arcgis/rest/services/LandCover_Chautauqua/MapServer";
    var publicCommentServiceUrl = "https://services9.arcgis.com/6EuFgO4fLTqfNOhu/arcgis/rest/services/Ag_District_Boundary_Comments/FeatureServer"
    
    // create ag district feature layer
    var agDistLayer = new FeatureLayer({
      url: agDistrictServiceUrl,
      visible: true,
      title: "Agricultural Districts",
      opacity: 0.6
    });

    // query extent and set map center to ag district layer
    agDistLayer.queryExtent().then(function(result){
      view.extent = result.extent
      // also set viewpoint for home widget
      var viewpoint = new Viewpoint({
        targetGeometry: result.extent
      });
      home.viewpoint = viewpoint;
    });

    // 9 class qualitative color scheme from colorbrewer.org for ag district layer
    // nested array value paired with color
    var agDistColors = [
      ['CHAU001','rgb(166,206,227)'],
      ['CHAU002','rgb(31,120,180)'],
      ['CHAU006','rgb(178,223,138)'],
      ['CHAU007','rgb(51,160,44)'],
      ['CHAU008','rgb(251,154,153)'],
      ['CHAU010','rgb(227,26,28)'],
      ['CHAU011','rgb(253,191,111)'],
      ['CHAU012','rgb(255,127,0)'],
      ['CHAU013','rgb(202,178,214)']
    ];

    // set default renderer for ag district layer
    agDistLayer.renderer = {
      type: "unique-value",
      field: "DistCode",
      defaultSymbol:{
        type: "simple-fill",
        style: "solid",
        color: [0, 0, 0, 0.3],
        outline: {
          width: 0.5,
          color: "black"
        }
      }
    };

    // for each item in ag district nested array, add unique value to ag district renderer
    agDistColors.forEach(function(colorValue){
      agDistLayer.renderer.addUniqueValueInfo({
        value: colorValue[0],
        symbol: {
          type: "simple-fill",
          color: colorValue[1]
        }
      });
    });

    // create prime farmland tile layer
    var farmlandLayer = new TileLayer({
      url: farmlandServiceUrl,
      visible: false,
      title: "Farmland Classification",
      listMode: "hide-children",
    });

    // create land cover tile layer
    var landCoverLayer = new TileLayer({
      url: landCoverServiceUrl,
      visible: false,
      title: "Land Cover/Use",
      listMode: "hide-children",
    });

    // create feature layer for Public Comment feature layer
    var publicCommentLayer = new FeatureLayer({
      url: publicCommentServiceUrl,
      visible: true,
      title: "Public Comment",
      listMode: "hide-children"
    });

    // override default renderer of public comment layer with stickpin picture marker
    publicCommentLayer.renderer = {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "http://static.arcgis.com/images/Symbols/Basic/RedStickpin.png",
        width: "32px",
        height: "32px"
      }
    };

    // create popupTemplate for Public Comment Layer
    publicCommentLayer.popupTemplate = {
      // title: "{ContactInfo}",
      content: (
        "<b>Comment:</b><p>{PublicComment}</p>" +
        "<p><em>Contact Information is not shown to protect privacy.</em></p>"
      )
    };
    
    // add layers to map
    map.layers.push(farmlandLayer, landCoverLayer, agDistLayer, publicCommentLayer);
  });
  