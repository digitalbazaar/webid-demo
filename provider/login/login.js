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
   var flashLoaded = function(e)
   {
      // no flash support
      if(!e.success)
      {
         init($);
      }
   };
   swfobject.embedSWF(
      '/forge/SocketPool.swf', 'socketPool', '0', '0', '9.0.0',
      false, {}, {allowscriptaccess: 'always'}, {}, flashLoaded);
})(jQuery);

var init = function($)
{
   var cat = 'webid-login';
   
   /**
    * Updates a status field on the page.
    */
   var setStatus = function(id, text, act, fade)
   {
      if(text != '')
      {
         forge.log.info(cat, text);
      }

      if(act)
      {
         text = '<img src="/login.gif" /> ' + text;
      }

      // stop any running/queued animations, replace the text,
      // set to full opacity and show the element
      $(id).stop(true).html(text).fadeTo(0, 1).show();

      if(fade)
      {
         $(id).delay(2000).fadeOut();
      }
   };
   
   var createFlashButton = function(options, webid, id)
   {
      var button = $('<button id="b-select-flash-' + id + '" \
         class="control right">Select (Flash)</button>');
      button.click(function()
      {
         // disable UI
         $('button.control').attr('disabled', 'disabled');
         $('.webid[id!=webid-' + id + ']').fadeTo('fast', 0.5);
         setStatus('#status-login', 'Logging in...', true);
         
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
               window.name = data;
               window.location = options.redirect;
            },
            error: function(xhr, textStatus, errorThrown)
            {
               forge.log.error(cat, 'Authentication FAILED', arguments);
               
               // enable UI
               $('button.control').removeAttr('disabled');
               $('.webid[id!=webid-' + id + ']').fadeTo('fast', 1);
               setStatus('#status-login', 'Log in failed.', false, true);
            },
            xhr: forge.xhr.create
         });
      });
      return button;
   };

   var createWebSocketButton = function(options, webid, id)
   {
      var button = $('<button id="b-select-ws-' + id + '" \
         class="control right">Select (WebSocket)</button>');
      button.click(function()
      {
         // disable UI
         $('button.control').attr('disabled', 'disabled');
         $('.webid[id!=webid-' + id + ']').fadeTo('fast', 0.5);
         setStatus('#status-login', 'Logging in...', true);
         
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
                  // return response via window.name
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
            if(window.name === '')
            {
               forge.log.error(cat, 'Authentication FAILED');
               
               // enable UI
               $('button.control').removeAttr('disabled');
               $('.webid[id!=webid-' + id + ']').fadeTo('fast', 1);
               setStatus('#status-login', 'Log in failed.', false, true);
            }
            window.location = options.redirect;
         };
      });
      return button;
   };

   var createWebIdCard = function(options, title, webid, id)
   {
      // create the WebID card template
      var card = $('<div id="webid-' + id + '" class="webid"> \
         <div class="webid-image"> \
            <img src="/identity.png" /> \
         </div> \
         <div class="webid-options"></div> \
         <div class="webid-info"> \
            <p class="webid-title"></p> \
            <p class="webid-common-name"></p> \
            <p class="webid-email"></p> \
            <p class="webid-location"></p> \
            <p class="webid-uri"></p> \
         </div> \
         <div id="webid-details-' + id + '" class="webid-details hidden clear"> \
            <p class="detail-title">Providers</p> \
            <div class="row"> \
               <span class="label">PaySwarm</span> \
               <span class="value"><a href="http://payswarm.com">PaySwarm</a></span> \
            </div> \
            <div class="row"> \
               <span class="label">Music Registration</span> \
               <span class="value"><a href="http://connectedmediaexperience.org/">Connected Media Experience</a></span> \
            </div> \
            <div class="row"> \
               <span class="label">Microblogging</span> \
               <span class="value"><a href="http://twitter.com">Twitter</a></span> \
            </div> \
            <p class="detail-title">Public Key</p> \
            <div class="row"> \
               <span class="label">Modulus</span> \
               <span class="webid-modulus value"></span> \
            </div> \
            <div class="row"> \
               <span class="label">Exponent</span> \
               <span class="webid-exponent value"></span> \
            </div> \
            <p class="detail-title">Private Information</p> \
            <div class="row"> \
               <span class="label">Private Key</span> \
               <span class="webid-pkey value"></span> \
            </div> \
            <div class="row"> \
               <span class="label">Certificate</span> \
               <span class="webid-cert value"></span> \
            </div> \
         </div> \
         <div class="clear"></div> \
         </div>');
      
      /* WebID Card Options */
      
      // add button to do WebID auth using flash
      if(options.flashApi !== null)
      {
         var button = createFlashButton(options, webid, id);
         $('.webid-options', card).append(button);
      }
      // add button to do WebID auth using WebSockets
      if(typeof(WebSocket) !== 'undefined' && options.wsPort !== null)
      {
         var button = createWebSocketButton(options, webid, id);
         $('.webid-options', card).append(button);
      }
      
      /* WebID Card Info */
      var cert = forge.pki.certificateFromPem(webid.certificate);

      // get WebID info section
      var info = $('.webid-info', card);

      // add WebID Card title
      $('.webid-title', info).html(title);

      // add WebID Common Name
      var fullname = cert.subject.getField({name: 'commonName'});
      fullname = fullname ? fullname.value : '';
      $('.webid-common-name', info).html(fullname);

      // add WebID email
      var email = cert.subject.getField({name: 'emailAddress'});
      email = email ? email.value : '';
      $('.webid-email', info).html(email);

      // add WebID uri link
      $('.webid-uri', info).html('<a href="' + webid.uri + '">' + webid.uri +
         '</a>');

      // add WebID location
      var locality = cert.subject.getField({name: 'localityName'});
      locality = locality ? locality.value : 'Locality';
      var state = cert.subject.getField({name: 'stateOrProvinceName'});
      state = state ? state.value : 'State';
      var country = cert.subject.getField({name: 'countryName'});
      country = country ? country.value : 'Country';

      $('.webid-location', info).html(
         locality + ', ' + state + ' - ' + country);

      /* WebID Card Details */
      var details = $('.webid-details', card);

      var attr;
      for(var n = 0; n < cert.subject.attributes.length; ++n)
      {
         // dump all certificate details into WebID card details
         attr = cert.subject.attributes[n];
         $(details).append('<div class="row"><span class="label">' + attr.name +
            '</span><span class="value">' + attr.value + '</span></div>');
      }

      // add details
      $('.webid-modulus', details).html('<pre>' +
         cert.publicKey.n.toString(16).
         replace(/(.{0,63})/g, '$1\n') + '</pre>');
      $('.webid-exponent', details).html(cert.publicKey.e.toString(10));
      $('.webid-pkey', details).html('<pre>' + webid.privateKey + '</pre>');
      $('.webid-cert', details).html('<pre>' + webid.certificate + '</pre>');
      
      return card;
   };

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
      options.redirect = 'https://' + options.domain + '/' + options.redirect;
      options.host = forge.util.parseUrl(options.redirect).host;
      
      // show domain to login to on UI
      $('.domain').html('`' + options.domain + '`');
      
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
         options.flashApi, 'forge.test.webid', 'webids', ['flash', 'web']);
      webids = webids || {};

      // create list of WebID cards
      var id = 0;
      var list = $('<div></div>');
      for(var title in webids)
      {
         list.append(createWebIdCard(options, title, webids[title], ++id));
      }

      if(list.children().length === 0)
      {
         list.append('You have no WebIDs.');
      }

      $('#webid-cards').append(list);
   }
   catch(ex)
   {
      forge.log.error(cat, ex);
   }
};

