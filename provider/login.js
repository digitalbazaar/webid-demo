/**
 * Forge WebID Login Demo
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2011 Digital Bazaar, Inc. All rights reserved.
 */
(function($)
{
   // load flash socket pool
   window.forge.socketPool = {};
   window.forge.socketPool.ready = function()
   {
      // init page
      init($);
   };
   swfobject.embedSWF(
      'forge/SocketPool.swf', 'socketPool', '0', '0', '9.0.0',
      false, {}, {allowscriptaccess: 'always'}, {});
})(jQuery);

var createFlashButton = function(options, webid, id)
{
   var button =
      $('<button class="blue right webid-button">Select (Flash)</button>');
   button.attr('id', 'fs-' + (webid + id));
   button.click(function()
   {
      // disable webid buttons
      $('.webid-button').attr('disabled', 'disabled');
      
      // set chosen webid
      options.webid = webid;
      
      // do webid call
      window.name = '';
      $.ajax(
      {
         type: 'GET',
         url: '/' + options.auth,
         success: function(data, textStatus, xhr)
         {
            // on success, return response via window.name
            if(data !== '')
            {
               forge.log.debug(cat, 'Authentication PASSED');
               //forge.log.debug(cat, 'authentication data', data);
               window.name = data;
            }
            else
            {
               forge.log.error(cat, 'Authentication FAILED', arguments);
            }
            window.location = options.redirect;
         },
         error: function(xhr, textStatus, errorThrown)
         {
            forge.log.error(cat, 'Authentication FAILED', arguments);
         },
         xhr: forge.xhr.create
      });
   });
   return button;
};

var createWebSocketButton = function(options, webid, id)
{
   var button =
      $('<button class="blue right webid-button">Select (WebSocket)</button>');
   button.attr('id', 'ws-' + (webid + id));
   button.click(function()
   {
      // disable webid buttons
      $('.webid-button').attr('disabled', 'disabled');
      
      // set chosen webid
      options.webid = webid;
      
      // create websocket
      var ws = new WebSocket('ws://' + options.host + ':' + options.wsPort);
      forge.log.debug(cat, 'Created WebSocket', ws);
      
      // create TLS client
      window.name = '';
      var tls = forge.tls.createConnection(
      {
         caStore: [],
         virtualHost: options.host,
         verify: function(c, verified, depth, certs)
         {
            // accept any certificate from the server for this demo
            return true;
         },
         connected: function(c)
         {
            forge.log.debug(cat, 'Client connected');
         },
         getCertificate: function(c, hint)
         {
            forge.log.debug(cat, 'Client-certificate', webid.certificate);
            return webid.certificate;
         },
         getPrivateKey: function(c, cert)
         {
            return webid.privateKey;
         },
         tlsDataReady: function(c)
         {
            // send base64-encoded TLS data to server
            ws.send(forge.util.encode64(c.tlsData.getBytes()));
         },
         dataReady: function(c)
         {
            var response = c.data.getBytes();
            //forge.log.debug(cat, 'Client received \"' + response + '\"');
            try
            {
               // on success, return response via window.name
               if(JSON.parse(response).success)
               {
                  window.name = response;
               }
            }
            catch(ex) {}
            c.close();
         },
         closed: function(c)
         {
            forge.log.debug(cat, 'Client disconnected');
         },
         error: function(c, error)
         {
            forge.log.debug(cat, 'Client error: ' + error.message);
         }
      });

      // setup websocket handlers
      ws.onopen = function(evt)
      {
         forge.log.debug(cat, 'WebSocket connected');

         // do TLS handshake
         tls.handshake();
      };
      ws.onmessage = function(evt)
      {
         // base64-decode data and process it
         tls.process(forge.util.decode64(evt.data));
      };
      ws.onclose = function(evt)
      {
         forge.log.debug(cat, 'WebSocket closed');
         if(window.name !== '')
         {
            forge.log.debug(cat, 'Authentication PASSED');
         }
         else
         {
            forge.log.error(cat, 'Authentication FAILED');
         }
         window.location = options.redirect;
      };
   });
   return button;
};

var createWebIdItem = function(options, webid, id)
{
   var item = $('<div class="webid"></div>');
   
   // add button to do WebID auth using flash
   if(flashApi !== null)
   {
      var button = createFlashButton(options, webid, id);
      item.append(button);
   }
   // add button to do WebID auth using WebSockets
   if(typeof(WebSocket) !== 'undefined' && options.wsPort !== null)
   {
      var button = createWebSocketButton(options, webid, id);
      item.append(button);
   }
   item.append(
      '<h3>' + name + '</h3>' +
      '<h4><a href="' + webid.uri + '">' + webid.uri + '</a></h4>');
   
   // display certificate attributes
   var cert = forge.pki.certificateFromPem(webid.certificate);
   var attr;
   for(var n = 0; n < cert.subject.attributes.length; ++n)
   {
      attr = cert.subject.attributes[n];
      item.append('<p>' + attr.name + ': ' + attr.value + '</p>');
   }
   
   return item;
};

var init = function($)
{
   var cat = 'web-id-login';
   
   // local alias
   var forge = window.forge;
   try
   {
      // create option defaults
      var options =
      {
         domain: '',
         host: '',
         auth: '',
         redirect: '',
         policyPort: 843,
         wsPort: null,
         flashApi: null
      };
      
      // get query variables
      var query = forge.util.getQueryVariables();
      if(query.domain)
      {
         options.domain = query.domain[0];
      }
      if(query.auth)
      {
         options.auth = query.auth[0];
      }
      if(query.pport)
      {
         options.policyPort = parseInt(query.pport[0]);
      }
      if(query.wsport)
      {
         options.wsPort = parseInt(query.wsport[0]);
      }
      if(query.redirect)
      {
         options.redirect = query.redirect[0];
      }
      options.redirect = 'https://' + domain + '/' + redirect;
      options.host = forge.util.parseUrl(options.redirect).host;
      
      // show domain to login to on UI
      $('#domain').html('`' + options.domain + '`');
      
      // get flash API
      options.flashApi = document.getElementById('socketPool');
      if(options.flashApi.type !== 'application/x-shockwave-flash')
      {
         options.flashApi = null;
      }
      
      // init forge xhr if flash is available
      if(options.flashApi !== null)
      {
         forge.xhr.init({
            flashId: 'socketPool',
            msie: $.browser.msie,
            url: 'https://' + options.domain,
            policyPort: options.policyPort,
            connections: 1,
            caCerts: [],
            verify: function(c, verified, depth, certs)
            {
               // don't care about cert verification for test
               return true;
            },
            getCertificate: function(c)
            {
               forge.log.debug(cat, 'Client-certificate',
                  options.webid.certificate);
               return options.webid.certificate;
            },
            getPrivateKey: function(c)
            {
               return options.webid.privateKey;
            }
         });
      }
      
      // get web ids collection
      var webids = forge.util.getItem(
         options.flashApi, 'forge.test.webid', 'webids');
      webids = webids || {};
      
      // build web ID selection UI
      var id = 0;
      var list = $('<div></div>');
      for(var name in webids)
      {
         var item = createWebIdItem(options, webid, ++id);
         list.append(item);
      }

      if(list.children().length === 0)
      {
         list.append('You have no WebIDs.');
      }
      
      $('#webids').append(list);
   }
   catch(ex)
   {
      forge.log.error(cat, ex);
   }
};

