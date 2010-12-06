/**
 * Web ID Management UI
 *
 * @author Dave Longley
 * @author David I. Lehn
 *
 * Copyright (c) 2010 Digital Bazaar, Inc. All rights reserved.
 */
jQuery(function($)
{
   // load flash socket pool
   window.forge.socketPool = {};
   window.forge.socketPool.ready = function()
   {
      init();
   };
   swfobject.embedSWF(
      '../forge/SocketPool.swf', 'socketPool', '0', '0', '9.0.0',
      false, {}, {allowscriptaccess: 'always'}, {});
});

var init = function()
{
   var cat = 'web-id-management';
   
   // local alias
   var forge = window.forge;

   // create a random url
   var rootIdsUrl = 'http://webid.digitalbazaar.com/ids/';
   $('#webid-url').val(rootIdsUrl + (Math.floor(Math.random() * 0xffffffff)));
   var keyBits = $.browser.webkit ? 1024 : 512;
   $('#webid-key-bits').val(keyBits);

   var status = function(id, text)
   {
      if(typeof(text) === 'undefined')
      {
         $(id).empty();
      }
      else
      {
         forge.log.info(cat, text);
         $(id).html('<img src="activity.gif" /> ' + text);
      }
   };

   $('#b-create').click(function()
   {
      status('#create-act', 'Creating new WebID...');
      var bits = $('#webid-key-bits')[0].value;
      forge.log.info(cat, 'generating ' + bits +
         '-bit RSA key-pair and certificate...');

      var createCert = function(keys)
      {
         try
         {
            var uri = $('#webid-url')[0].value;
            // get the end of the uri (the unique ID)
            var uriId = uri.substr(
               'http://webid.digitalbazaar.com/ids/'.length);
            uri += '#me';
            var name = $('#webid-name')[0].value;
            var commonName = $('#webid-common-name')[0].value;
            var locality = $('#webid-locality')[0].value;
            var state = $('#webid-state')[0].value;
            var country = $('#webid-country')[0].value;
            var org = $('#webid-organization')[0].value;
            var orgUnit = $('#webid-organizational-unit')[0].value;

            var cert = forge.pki.createCertificate();
            cert.serialNumber = '01';
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(
               cert.validity.notBefore.getFullYear() + 1);
            var attrs = [];
            if(commonName !== '')
            {
               attrs.push({
                  name: 'commonName',
                  value: commonName
               });
            }
            if(locality !== '')
            {
               attrs.push({
                  name: 'localityName',
                  value: locality
               });
            }
            if(state !== '')
            {
               attrs.push({
                  shortName: 'ST',
                  value: state
               });
            }
            if(country !== '')
            {
               attrs.push({
                  name: 'countryName',
                  value: country
               });
            }
            if(org !== '')
            {
               attrs.push({
                  name: 'organizationName',
                  value: org
               });
            }
            if(orgUnit !== '')
            {
               attrs.push({
                  shortName: 'OU',
                  value: orgUnit
               });
            }
            cert.setSubject(attrs);
            cert.setIssuer(attrs);
            cert.setExtensions([{
               name: 'basicConstraints',
               cA: true
            }, {
               name: 'keyUsage',
               keyCertSign: true,
               digitalSignature: true,
               nonRepudiation: true,
               keyEncipherment: true,
               dataEncipherment: true
            }, {
               name: 'subjectAltName',
               altNames: [{
                  type: 6, // URI
                  value: uri
               }]
            }]);
            // FIXME: add subjectKeyIdentifier extension
            // FIXME: add authorityKeyIdentifier extension
            cert.publicKey = keys.publicKey;
            
            // self-sign certificate
            cert.sign(keys.privateKey);
            
            forge.log.info(cat, 'certificate:', cert);
            //forge.log.debug(cat,
            //   forge.asn1.prettyPrint(forge.pki.certificateToAsn1(cert)));
            var keyPem = forge.pki.privateKeyToPem(keys.privateKey);
            var certPem = forge.pki.certificateToPem(cert);
            forge.log.debug(cat, keyPem);
            forge.log.debug(cat, certPem);
            
            forge.log.info(cat, 'storing certificate and private key...');
            try
            {
               // get flash API
               var flashApi = document.getElementById('socketPool');
               
               // get web ids collection
               var webids = forge.util.getItem(
                  flashApi, 'forge.test.webid', 'webids');
               webids = webids || {};
               
               // add web id
               webids[name] = {
                  uri: uri,
                  certificate: certPem,
                  privateKey: keyPem
               };
               
               // update web ids collection
               forge.util.setItem(
                  flashApi, 'forge.test.webid', 'webids', webids);
               
               forge.log.info(cat, 'certificate and private key stored');

               // FIXME: do post to php page to store rdf data
               $.ajax({
                  type: 'POST',
                  url: '/ids/storage.php',
                  data: {
                     id: uriId,
                     nick: name,
                     modulus: cert.publicKey.n.toString(16)
                  }
               });

               $('#b-refresh').click();
            }
            catch(ex)
            {
               forge.log.error(cat, ex);
            }
         }
         catch(ex)
         {
            forge.log.error(cat, ex, ex.message ? ex.message : '');
         }
         status('#create-act');
      };

      var state = forge.pki.rsa.createKeyPairGenerationState(bits);
      var step = function()
      {
         // step key-generation
         if(!forge.pki.rsa.stepKeyPairGenerationState(state, 1000))
         {
            setTimeout(step, 1);
         }
         // key-generation complete
         else
         {
            createCert(state.keys);
         }
      };
      setTimeout(step, 0);
   });

   $('#b-refresh').click(function()
   {  
      status('#manage-act', 'Refreshing WebIDs...');
      try
      {
         // get flash API
         var flashApi = document.getElementById('socketPool');
         
         // get web ids collection
         var webids = forge.util.getItem(
            flashApi, 'forge.test.webid', 'webids');
         webids = webids || {};
         
         var html = '';
	 var notification = '';
         var webid, cert;
         for(var name in webids)
         {
            webid = webids[name];
            cert = forge.pki.certificateFromPem(webid.certificate);
            html += '<div class="webid">';
            html += '<h3>' + name + '</h3>';
            html += '<h4><a href="' + webid.uri + '">';
            html += webid.uri + '</a></h4>';
            
            var attr;
            for(var n = 0; n < cert.subject.attributes.length; ++n)
            {
               attr = cert.subject.attributes[n];
               html += '<p>' + attr.name + ': ' + attr.value + '</p>';
            }
            
            //html += '<p>' + webid.certificate + '</p></li>';
            html += '</div>';
         }

         if(html === '')
         {
            html = '<h3>You have no WebIDs. Enter a name and click "Create" to make a new one.</h3>';
         }
	 else
	 {
	    notification = 'You can use your WebID to <a href="https://payswarm.com/webid-demo/">log in to the demo WebID site</a>';
	 }
         
         $('#webids').html(html);
	 $('#notification').html(notification);
         
         forge.log.info(cat, 'Web IDs retrieved');
      }
      catch(ex)
      {
         forge.log.error(cat, ex);
      }
      status('#manage-act');
   });
   
   $('#b-clear').click(function()
   {  
      status('#manage-act', 'Clearing all WebIDs...');
      try
      {
         // get flash API
         var flashApi = document.getElementById('socketPool');
         forge.util.clearItems(flashApi, 'forge.test.webid');

         $('#webids').html('<h3>You have no WebIDs. Enter a name and click "Create" to make a new one.</h3>');
         $('#notification').html('');

         forge.log.info(cat, 'Web IDs retrieved');
      }
      catch(ex)
      {
         forge.log.error(cat, ex);
      }
      status('#manage-act');
   });
   
   $('#b-adv').click(function()
   {
      $('#options').toggle();
      return false;
   });

   // load current WebIDs on startup
   $('#b-refresh').click();
};
