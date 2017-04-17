import React, { PropTypes } from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';
import { load } from 'redux/modules/room';
import { asyncConnect } from 'redux-async-connect';
import RoleAwareComponent from 'helpers/RoleAwareComponent';
import mxgraph from 'mxgraph';

let MxGraph;

if (!__SERVER__) {
  MxGraph = mxgraph({
    mxImageBasePath: '../src/images',
    mxBasePath: '../src'
  });

  window.onInit = onInit;
}

function createEditor(config) {
  console.log(MxGraph);

  const mxEvent = MxGraph.mxEvent;
  const mxEffects = MxGraph.mxEffects;
  const mxClient = MxGraph.mxClient;
  const mxUtils = MxGraph.mxUtils;
  const mxObjectCodec = MxGraph.mxObjectCodec;
  const mxEditor = MxGraph.mxEditor;
  const mxPanningManager = MxGraph.mxPanningManager;

  let editor = null;

  const hideSplash = function hideSplash() {
    // Fades-out the splash screen
    const splash = document.getElementById('splash');

    if (splash !== null) {
      try {
        mxEvent.release(splash);
        mxEffects.fadeOut(splash, 100, true);
      }
      catch (ex) {
        splash.parentNode.removeChild(splash);
      }
    }
  };

  try {
    if (!mxClient.isBrowserSupported()) {
      mxUtils.error('Browser is not supported!', 200, false);
    }
    else {
      mxObjectCodec.allowEval = true;
      const node = mxUtils.load(config).getDocumentElement();
      editor = new mxEditor(node);
      mxObjectCodec.allowEval = false;

      // Adds active border for panning inside the container
      editor.graph.createPanningManager = function createPanningManager() {
        const pm = new mxPanningManager(this);
        pm.border = 30;

        return pm;
      };

      editor.graph.allowAutoPanning = true;
      editor.graph.timerAutoScroll = true;

      // Updates the window title after opening new files
      const title = document.title;
      const funct = function(sender) {
        document.title = title + ' - ' + sender.getTitle();
      };

      editor.addListener(mxEvent.OPEN, funct);

      // Prints the current root in the window title if the
      // current root of the graph changes (drilling).
      editor.addListener(mxEvent.ROOT, funct);
      funct(editor);

      // Displays version in statusbar
      editor.setStatus('mxGraph ' + mxClient.VERSION);

      // Shows the application
      hideSplash();
    }
  }
  catch (ex) {
    hideSplash();

    // Shows an error message if the editor cannot start
    mxUtils.alert('Cannot start application: ' + ex.message);
    throw ex; // for debugging
  }

  return editor;
}

function onInit(editor)
{
  const mxEvent = MxGraph.mxEvent;
  const mxEffects = MxGraph.mxEffects;
  const mxClient = MxGraph.mxClient;
  const mxUtils = MxGraph.mxUtils;
  const mxObjectCodec = MxGraph.mxObjectCodec;
  const mxEditor = MxGraph.mxEditor;
  const mxPanningManager = MxGraph.mxPanningManager;
  const mxVertexHandler = MxGraph.mxVertexHandler;
  const mxGraphHandler = MxGraph.mxGraphHandler;
  const mxGuide = MxGraph.mxGuide;
  const mxEdgeHandler = MxGraph.mxEdgeHandler;
  const mxConnectionHandler = MxGraph.mxConnectionHandler;
  const mxImage = MxGraph.mxImage;
  const mxCodec = MxGraph.mxCodec;
  const mxXmlCanvas2D = MxGraph.mxXmlCanvas2D;
  const mxSvgCanvas2D = MxGraph.mxSvgCanvas2D;
  const mxXmlRequest = MxGraph.mxXmlRequest;
  const mxImageExport = MxGraph.mxImageExport;
  const mxResources = MxGraph.mxResources;


  // Enables rotation handle
  mxVertexHandler.prototype.rotationEnabled = true;

  // Enables guides
  mxGraphHandler.prototype.guidesEnabled = true;

  // Alt disables guides
  mxGuide.prototype.isEnabledForEvent = function(evt)
  {
    return !mxEvent.isAltDown(evt);
  };

  // Enables snapping waypoints to terminals
  mxEdgeHandler.prototype.snapToTerminals = true;

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  mxConnectionHandler.prototype.connectImage = new mxImage('../images/connector.gif', 16, 16);

  // Enables connections in the graph and disables
  // reset of zoom and translate on root change
  // (ie. switch between XML and graphical mode).
  editor.graph.setConnectable(true);

  // Clones the source if new connection has no target
  editor.graph.connectionHandler.setCreateTarget(true);

  // Updates the title if the root changes
  var title = document.getElementById('title');

  if (title != null)
  {
    var f = function(sender)
    {
      title.innerHTML = 'mxDraw - ' + sender.getTitle();
    };

    editor.addListener(mxEvent.ROOT, f);
    f(editor);
  }

  // Changes the zoom on mouseWheel events
  mxEvent.addMouseWheelListener(function (evt, up)
  {
    if (!mxEvent.isConsumed(evt))
    {
      if (up)
      {
        editor.execute('zoomIn');
      }
      else
      {
        editor.execute('zoomOut');
      }

      mxEvent.consume(evt);
    }
  });

  // Defines a new action to switch between
  // XML and graphical display
  var textNode = document.getElementById('xml');
  var graphNode = editor.graph.container;
  var sourceInput = document.getElementById('source');
  sourceInput.checked = false;

  var funct = function(editor)
  {
    if (sourceInput.checked)
    {
      graphNode.style.display = 'none';
      textNode.style.display = 'inline';

      var enc = new mxCodec();
      var node = enc.encode(editor.graph.getModel());

      textNode.value = mxUtils.getPrettyXml(node);
      textNode.originalValue = textNode.value;
      textNode.focus();
    }
    else
    {
      graphNode.style.display = '';

      if (textNode.value != textNode.originalValue)
      {
        var doc = mxUtils.parseXml(textNode.value);
        var dec = new mxCodec(doc);
        dec.decode(doc.documentElement, editor.graph.getModel());
      }

      textNode.originalValue = null;

      // Makes sure nothing is selected in IE
      if (mxClient.IS_IE)
      {
        mxUtils.clearSelection();
      }

      textNode.style.display = 'none';

      // Moves the focus back to the graph
      editor.graph.container.focus();
    }
  };

  editor.addAction('switchView', funct);

  // Defines a new action to switch between
  // XML and graphical display
  mxEvent.addListener(sourceInput, 'click', function()
  {
    editor.execute('switchView');
  });

  // Create select actions in page
  var node = document.getElementById('mainActions');
  var buttons = ['group', 'ungroup', 'cut', 'copy', 'paste', 'delete', 'undo', 'redo', 'print', 'show'];

  // Only adds image and SVG export if backend is available
  // NOTE: The old image export in mxEditor is not used, the urlImage is used for the new export.
  if (editor.urlImage != null)
  {
    // Client-side code for image export
    var exportImage = function(editor)
    {
      var graph = editor.graph;
      var scale = graph.view.scale;
      var bounds = graph.getGraphBounds();

      // New image export
      var xmlDoc = mxUtils.createXmlDocument();
      var root = xmlDoc.createElement('output');
      xmlDoc.appendChild(root);

      // Renders graph. Offset will be multiplied with state's scale when painting state.
      var xmlCanvas = new mxXmlCanvas2D(root);
      xmlCanvas.translate(Math.floor(1 / scale - bounds.x), Math.floor(1 / scale - bounds.y));
      xmlCanvas.scale(scale);

      var imgExport = new mxImageExport();
      imgExport.drawState(graph.getView().getState(graph.model.root), xmlCanvas);

      // Puts request data together
      var w = Math.ceil(bounds.width * scale + 2);
      var h = Math.ceil(bounds.height * scale + 2);
      var xml = mxUtils.getXml(root);

      // Requests image if request is valid
      if (w > 0 && h > 0)
      {
        var name = 'export.png';
        var format = 'png';
        var bg = '&bg=#FFFFFF';

        new mxXmlRequest(editor.urlImage, 'filename=' + name + '&format=' + format +
          bg + '&w=' + w + '&h=' + h + '&xml=' + encodeURIComponent(xml)).
        simulate(document, '_blank');
      }
    };

    editor.addAction('exportImage', exportImage);

    // Client-side code for SVG export
    var exportSvg = function(editor)
    {
      var graph = editor.graph;
      var scale = graph.view.scale;
      var bounds = graph.getGraphBounds();

      // Prepares SVG document that holds the output
      var svgDoc = mxUtils.createXmlDocument();
      var root = (svgDoc.createElementNS != null) ?
        svgDoc.createElementNS(mxConstants.NS_SVG, 'svg') : svgDoc.createElement('svg');

      if (root.style != null)
      {
        root.style.backgroundColor = '#FFFFFF';
      }
      else
      {
        root.setAttribute('style', 'background-color:#FFFFFF');
      }

      if (svgDoc.createElementNS == null)
      {
        root.setAttribute('xmlns', mxConstants.NS_SVG);
      }

      root.setAttribute('width', Math.ceil(bounds.width * scale + 2) + 'px');
      root.setAttribute('height', Math.ceil(bounds.height * scale + 2) + 'px');
      root.setAttribute('xmlns:xlink', mxConstants.NS_XLINK);
      root.setAttribute('version', '1.1');

      // Adds group for anti-aliasing via transform
      var group = (svgDoc.createElementNS != null) ?
        svgDoc.createElementNS(mxConstants.NS_SVG, 'g') : svgDoc.createElement('g');
      group.setAttribute('transform', 'translate(0.5,0.5)');
      root.appendChild(group);
      svgDoc.appendChild(root);

      // Renders graph. Offset will be multiplied with state's scale when painting state.
      var svgCanvas = new mxSvgCanvas2D(group);
      svgCanvas.translate(Math.floor(1 / scale - bounds.x), Math.floor(1 / scale - bounds.y));
      svgCanvas.scale(scale);

      var imgExport = new mxImageExport();
      imgExport.drawState(graph.getView().getState(graph.model.root), svgCanvas);

      var name = 'export.svg';
      var xml = encodeURIComponent(mxUtils.getXml(root));

      new mxXmlRequest(editor.urlEcho, 'filename=' + name + '&format=svg' + '&xml=' + xml).simulate(document, "_blank");
    };

    editor.addAction('exportSvg', exportSvg);

    buttons.push('exportImage');
    buttons.push('exportSvg');
  };

  for (var i = 0; i < buttons.length; i++)
  {
    var button = document.createElement('button');
    mxUtils.write(button, mxResources.get(buttons[i]));

    var factory = function(name)
    {
      return function()
      {
        editor.execute(name);
      };
    };

    mxEvent.addListener(button, 'click', factory(buttons[i]));
    node.appendChild(button);
  }

  // Create select actions in page
  var node = document.getElementById('selectActions');
  mxUtils.write(node, 'Select: ');
  mxUtils.linkAction(node, 'All', editor, 'selectAll');
  mxUtils.write(node, ', ');
  mxUtils.linkAction(node, 'None', editor, 'selectNone');
  mxUtils.write(node, ', ');
  mxUtils.linkAction(node, 'Vertices', editor, 'selectVertices');
  mxUtils.write(node, ', ');
  mxUtils.linkAction(node, 'Edges', editor, 'selectEdges');

  // Create select actions in page
  var node = document.getElementById('zoomActions');
  mxUtils.write(node, 'Zoom: ');
  mxUtils.linkAction(node, 'In', editor, 'zoomIn');
  mxUtils.write(node, ', ');
  mxUtils.linkAction(node, 'Out', editor, 'zoomOut');
  mxUtils.write(node, ', ');
  mxUtils.linkAction(node, 'Actual', editor, 'actualSize');
  mxUtils.write(node, ', ');
  mxUtils.linkAction(node, 'Fit', editor, 'fit');
}

@asyncConnect([{
  promise: ({
    store: { dispatch },
    params: { id },
    location: { search }}
  ) => {
    return dispatch(load(id, search));
  }
}])
@connect(
  state => ({
    user: state.auth.user,
    room: state.room.data,
    error: state.room.loadError,
    permission: state.room.permission
  })
)
export default class Room extends RoleAwareComponent {

  static propTypes = {
    user: PropTypes.object,
    room: PropTypes.object,
    permission: PropTypes.object,
    params: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  state = {
    message: '',
    messages: []
  };

  componentDidMount() {
    if (socket) {
      socket.emit('JOIN_ROOM', this.props.params.id);

      socket.on('MESSAGE', this.onMessageReceived);
      socket.on('INIT', this.onInit);
    }

    if (!__SERVER__) {
      const editor = createEditor('../config/diagrameditor.xml');
      onInit(editor);
    }
  }

  componentWillUnmount() {
    if (socket) {
      socket.removeListener('MESSAGE', this.onMessageReceived);
      socket.removeListener('INIT', this.onInit);
    }
  }

  onInit = messages => {
    if (this.refs.messages) {
      this.setState({ messages });
    }
  };

  onMessageReceived = (data) => {
    const messages = this.state.messages;
    messages.push(data);
    this.setState({ messages });
  };

  handleSubmit = (event) => {
    event.preventDefault();

    const msg = this.state.message;
    const roomId = this.props.params.id;

    if (msg) {
      this.setState({ message: '' });
      socket.emit('MESSAGE', roomId, {
        author: this.props.user && this.props.user.username || 'Anonymous',
        text: msg
      });
    }
  };

  render() {
    const { room, error } = this.props;
    const style = require('./Room.scss');
    const margin = { marginTop: 30 };

    return error ? (<div>ERROR: {error.message}</div>) : (
      <div className={style.room}>
        <Helmet title="Room"/>
        <h1 className={style}>{ `Room ${room.title}` }</h1>

        <div>
          <ul style={ margin } ref="messages">
          {this.state.messages.map((msg) => {
            return msg ? <li key={`room.msg.${msg._id}`}>{msg.author}: {msg.text}</li> : '';
          })}
          </ul>
          { this.hasPermission('write') &&
            <form className="login-form" onSubmit={this.handleSubmit}>
              <input type="text"
                   ref="message"
                   placeholder="Enter your message"
                   value={this.state.message}
                   onChange={ (event) => this.setState({message: event.target.value}) }
              />
              <button className="btn" onClick={ this.handleSubmit }>Send</button>
            </form>
          }
          <div id="page">
            <div id="header">
              <div id="headerimg" style={{overflow: 'hidden'}}>
                <h1 id="title">mxDraw</h1>
              </div>
            </div>
            <div id="mainActions"
                 style={{width: '100%', paddingTop: '8px', paddingLeft: '24px', paddingBottom: '8px'}}>
            </div>
            <div id="selectActions" style={{width: '100%', paddingLeft: '54px', paddingBottom: '4px'}}>
            </div>
            <table style={{width: "730px"}}>
              <tbody>
              <tr>
                <td id="toolbar" style={{width: '16px', paddingLeft: '20px'}}>
                </td>
                <td style={{borderWidth: '1px', borderStyle: 'solid', borderColor: 'black'}}>
                  <div id="graph" style={{position: 'relative', height: '480px', width: '684px', overflow: 'hidden', cursor: 'default'}}>
                    <center id="splash" style={{paddingTop: '230px'}}>
                      <img src="images/loading.gif"/>
                    </center>
                  </div>
                  <textarea id="xml" style={{height: '480px', width: '684px', display: 'none', borderStyle: 'none'}}></textarea>
                </td>
              </tr>
              </tbody>
            </table>
            <span style={{float: 'right', paddingRight: '36px'}}>
			        <input id="source" type="checkbox"/>Source
		        </span>
            <div id="zoomActions" style={{width: '100%', paddingLeft: '54px', paddingTop: '4px'}}>
            </div>
            <div id="footer">
              <p id="status">
                Loading...
              </p>
              <br/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}