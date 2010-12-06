/**
 * Forge Web ID Tests
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010 Digital Bazaar, Inc. All rights reserved.
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

var init = function($)
{
   var cat = 'web-id-login';
   
   // local alias
   var forge = window.forge;
   try
   {
      // get query variables
      var query = forge.util.getQueryVariables();
      var domain = '';
      if(query.domain)
      {
         domain = query.domain[0];
      }
      var auth = '';
      if(query.auth)
      {
         auth = query.auth[0];
      }
      var pport = 843;
      if(query.pport)
      {
         pport = parseInt(query.pport[0]);
      }
      var redirect = '';
      if(query.redirect)
      {
         redirect = query.redirect[0];
      }
      redirect = 'https://' + domain + '/' + redirect;
      if(domain)
      {
         $('#domain').html('`' + domain + '`');
      }
      
      // for chosen webid
      var chosen = null;
      
      // init forge xhr
      forge.xhr.init({
         flashId: 'socketPool',
         msie: $.browser.msie,
         url: 'https://' + domain,
         policyPort: pport,
         connections: 1,
         caCerts: [],
         verify: function(c, verified, depth, certs)
         {
            // don't care about cert verification for test
            return true;
         },
         getCertificate: function(c)
         {
            forge.log.debug(cat,
               'using cert', chosen.certificate);
            return chosen.certificate;
         },
         getPrivateKey: function(c)
         {
            forge.log.debug(cat,
               'using private key', chosen.privateKey);
            return chosen.privateKey;
         }
      });
      
      // get flash API
      var flashApi = document.getElementById('socketPool');
      
      // get web ids collection
      var webids = forge.util.getItem(
         flashApi, 'forge.test.webid', 'webids');
      webids = webids || {};
      
      var id = 0;
      var list = $('<div></div>');
      for(var name in webids)
      {
         (function(webid)
         {
            var cert = forge.pki.certificateFromPem(webid.certificate);
            var item = $('<div class="webid"></div>');
            var button = $('<button class="blue right">Select</button>');
            button.attr('id', '' + (webid + id++));
            button.click(function()
            {
               button.attr('disabled', 'disabled');
               
               // set chosen webid
               chosen = webid;
               
               // do webid call
               $.ajax(
               {
                  type: 'GET',
                  url: '/' + auth,
                  success: function(data, textStatus, xhr)
                  {
                     forge.log.debug(cat, 'in success');
                     if(data !== '')
                     {
                        forge.log.debug(cat, 'authentication completed');
                        //forge.log.debug(cat, 'authentication data', data);
                        window.name = data;
                     }
                     else
                     {
                        forge.log.error(cat,
                           'no data, authentication failed', arguments);
                        window.name = '';
                     }
                     window.location = redirect;
                  },
                  error: function(xhr, textStatus, errorThrown)
                  {
                     forge.log.error(cat, 'authentication failed', arguments);
                  },
                  xhr: forge.xhr.create
               });
            });
            item.append(button);
            item.append(
               '<h3>' + name + '</h3>' +
               '<h4><a href="' + webid.uri + '">' + webid.uri + '</a></h4>');
            
            // display certificate attributes
            var attr;
            for(var n = 0; n < cert.subject.attributes.length; ++n)
            {
               attr = cert.subject.attributes[n];
               item.append('<p>' + attr.name + ': ' + attr.value + '</p>');
            }
            
            list.append(item);
         })(webids[name]);
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
