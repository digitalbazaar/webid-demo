/**
 * Web ID Management UI
 *
 * @author Dave Longley
 * @author David I. Lehn
 * @author Mike Johnson
 *
 * Copyright (c) 2010-2011 Digital Bazaar, Inc. All rights reserved.
 */
jQuery(function($)
{
   // load flash socket pool
   window.forge.socketPool = {};
   window.forge.socketPool.ready = function()
   {
      init();
   };
   var flashLoaded = function(e)
   {
      // no flash support
      if(!e.success)
      {
         init();
      }
   };
   swfobject.embedSWF(
      '/forge/SocketPool.swf', 'socketPool', '0', '0', '9.0.0',
      false, {}, {allowscriptaccess: 'always'}, {}, flashLoaded);
});

var init = function()
{
   // set logging category
   var cat = 'webid-manage';

   // local alias
   var forge = window.forge;

   // set keybits based on browser
   var keyBits = $.browser.webkit ? 1024 : 512;
   $('#webid-key-bits').val(keyBits);

   // storage type
   var storageType = ['flash', 'web'];

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
         text = '<img src="/activity.gif" /> ' + text;
      }

      // stop any running/queued animations, replace the text,
      // set to full opacity and show the element
      $(id).stop(true).html(text).fadeTo(0, 1).show();

      if(fade)
      {
         $(id).delay(2000).fadeOut();
      }
   };

   /**
    * Creates a new name and uri for a WebID.
    */
   var generateId = function()
   {
      // create a random url
      var rootIdsUrl = 'http://webid.digitalbazaar.com/ids/';
      var randId = (Math.floor(Math.random() * 0xffffffff));
      $('#webid-url').val(rootIdsUrl + randId);

      // set WebID Card title
      $('#webid-title').val('Demo WebID Card ' + randId);
   };
   
   /**
    * Gets the flash API.
    * 
    * @return the flash API or null if not available.
    */
   var getFlashApi = function()
   {
      var rval = document.getElementById('socketPool');
      if(rval.type !== 'application/x-shockwave-flash')
      {
         rval = null;
      }
      return rval;
   };

   /**
    * Refreshes the WebID card list.
    */
   var refreshCards = function()
   {
      try
      {
         // get flash API
         var flashApi = getFlashApi();

         // get web ids collection
         var webids = forge.util.getItem(
            flashApi, 'forge.test.webid', 'webids', storageType);
         webids = webids || {};

         // create list of WebID cards
         var id = 1;
         var list = $('<div></div>');
         for(var title in webids)
         {
            (function(webid, title, id)
            {
               // get the cert
               var cert = forge.pki.certificateFromPem(webid.certificate);

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

               // create delete button
               var buttonDel = $('<button id="b-delete-' + id + '" \
                  class="control end">Delete</button>');
               buttonDel.click(function()
               {
                  buttonDel.attr('disabled', 'disabled');

                  // get WebIDs collection
                  var webids = forge.util.getItem(
                     flashApi, 'forge.test.webid', 'webids', storageType);
                  webids = webids || {};

                  // delete web id, update
                  delete webids[title];
                  forge.util.setItem(
                     flashApi, 'forge.test.webid', 'webids', webids, storageType);

                  // refresh cards
                  refreshCards();
               });

               // create details button
               var buttonDet = $('<button id="b-details-' + id + '" \
                  class="control start">Details</button>');
               buttonDet.click(function()
               {
                  $('.webid-details', card).toggle();
               });

               // add buttons to WebID options
               $('.webid-options', card).append(buttonDet);
               $('.webid-options', card).append(buttonDel);

               /* WebID Card Info */

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
               $('.webid-uri', info).html('<a href="' + webid.uri + '">' + webid.uri + '</a>');

               // add WebID location
               var locality = cert.subject.getField({name: 'localityName'});
               locality = locality ? locality.value : 'Locality';
               var state = cert.subject.getField({name: 'stateOrProvinceName'});
               state = state ? state.value : 'State';
               var country = cert.subject.getField({name: 'countryName'});
               country = country ? country.value : 'Country';

               $('.webid-location', info).html(locality + ', ' + state + ' ' + country);

               /* WebID Card Details */
               var details = $('.webid-details', card);

               var attr;
               for(var n = 0; n < cert.subject.attributes.length; ++n)
               {
                  // dump all certificate details into WebID card details
                  attr = cert.subject.attributes[n];
                  $(details).append('<div class="row"><span class="label">' + attr.name + '</span><span class="value">' + attr.value + '</span></div>');
               }

               // add details
               $('.webid-modulus', details).html('<pre>' + cert.publicKey.n.toString(16).replace(/(.{0,63})/g, '$1\n') + '</pre>');
               $('.webid-exponent', details).html(cert.publicKey.e.toString(10));
               $('.webid-pkey', details).html('<pre>' + webid.privateKey + '</pre>');
               $('.webid-cert', details).html('<pre>' + webid.certificate + '</pre>');

               // add WebID card to list
               list.append(card);
            })(webids[title], title, id++);
         }

         var notification = '';
         if(list.children().length === 0)
         {
            notification =
               'You have no WebID Cards. Create one using the form below.';
         }
         else
         {
            notification =
               'You can use these WebID Cards to ' +
               '<a href="https://payswarm.com/webid-demo/">log in to the ' +
               'demo WebID site</a>.';
         }

         $('#webid-list').html(list);
         $('#notification').html(notification);
      }
      catch(ex)
      {
         forge.log.error(cat, ex);
      }
   }

   /**
    * Refreshes all WebIDs.
    */
   $('#b-refresh').click(function()
   {
      setStatus('#status-manage', 'Refreshing WebID Cards...', true);

      refreshCards();

      setStatus('#status-manage', 'WebID Cards refreshed.', false, true);
   });

   $('#b-create').click(function()
   {
      // disable UI
      $('#b-create').attr('disabled', 'disabled');
      $('#webid-create input').attr('disabled', 'disabled');

      // set status message
      setStatus('#status-create', 'Creating new WebID Card...', true);

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
            var title = $('#webid-title')[0].value;
            var commonName = $('#webid-common-name')[0].value;
            var email = $('#webid-email-address')[0].value;
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
            if(email !== '')
            {
               attrs.push({
                  name: 'emailAddress',
                  value: email
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
               var flashApi = getFlashApi();

               // get web ids collection
               var webids = forge.util.getItem(
                  flashApi, 'forge.test.webid', 'webids', storageType);
               webids = webids || {};

               // add web id
               webids[title] = {
                  uri: uri,
                  certificate: certPem,
                  privateKey: keyPem
               };

               // update web ids collection
               forge.util.setItem(
                  flashApi, 'forge.test.webid', 'webids', webids, storageType);

               forge.log.info(cat, 'certificate and private key stored');

               // FIXME: do post to php page to store rdf data
               // FIXME: should do this over https
               $.ajax({
                  type: 'POST',
                  url: '/ids/storage.php',
                  data: {
                     id: uriId,
                     uri: uri,
                     title: title,
                     name: commonName,
                     email: email,
                     locality: locality,
                     state: state,
                     country: country,
                     org: org,
                     orgUnit: orgUnit,
                     modulus: cert.publicKey.n.toString(16)
                  }
               });

               // refresh WebID cards
               refreshCards();

               setStatus('#status-create', 'New WebID created.', false, true);
            }
            catch(ex)
            {
               forge.log.error(cat, ex);
               setStatus('#status-create', 'New WebID storage failed.', false, true);
            }
         }
         catch(ex)
         {
            forge.log.error(cat, ex, ex.message ? ex.message : '');
            setStatus('#status-create', 'New WebID creation failed.', false, true);
         }

         // generate new WebID for next creation
         generateId();

         // enable UI
         $('#b-create').removeAttr('disabled');
         $('#webid-create input').removeAttr('disabled');
      };

      var state = forge.pki.rsa.createKeyPairGenerationState(bits);
      var step = function()
      {
         // step key-generation
         if(!forge.pki.rsa.stepKeyPairGenerationState(state, 100))
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

   /**
    * Import an existing WebID.
    */
   $('#b-import').click(function()
   {
      // set status
      setStatus('#status-import', 'Importing existing WebID...', true);

      // disable UI
      $('#b-import').attr('disabled', 'disabled');
      $('#webid-import input').attr('disabled', 'disabled');

      var importCert = function()
      {
         try
         {
            var title = $('#webid-import-title')[0].value;
            var keyPem = $('#webid-import-pkey')[0].value;
            var certPem = $('#webid-import-cert')[0].value;

            // get subject alternative name (WebID URL)
            var cert = forge.pki.certificateFromPem(certPem);
            var ext = cert.getExtension('subjectAltName');
            var uri = ext.altNames[0].value;

            forge.log.info(cat, 'storing certificate and private key...');
            try
            {
               // get flash API
               var flashApi = getFlashApi();

               // get web ids collection
               var webids = forge.util.getItem(
                  flashApi, 'forge.test.webid', 'webids', storageType);
               webids = webids || {};

               // add web id
               webids[title] = {
                  uri: uri,
                  certificate: certPem,
                  privateKey: keyPem
               };

               // update web ids collection
               forge.util.setItem(
                  flashApi, 'forge.test.webid', 'webids', webids, storageType);

               forge.log.info(cat, 'certificate and private key stored');

               refreshCards();

               setStatus('#status-import', 'New WebID imported.', false, true);
            }
            catch(ex)
            {
               forge.log.error(cat, ex);
               setStatus('#status-import', 'New WebID storage failed.', false, true);
            }
         }
         catch(ex)
         {
            forge.log.error(cat, ex, ex.message ? ex.message : '');
            setStatus('#status-import', 'New WebID import failed.', false, true);
         }

         // enable UI
         $('#b-import').removeAttr('disabled');
         $('#webid-import input').removeAttr('disabled');
      };

      // do import
      importCert();
   });

   /**
    * Deletes all WebIDs.
    */
   $('#b-clear').click(function()
   {
      setStatus('#status-manage', 'Deleting all WebIDs...', true);

      try
      {
         // get flash API
         var flashApi = getFlashApi();
         forge.util.clearItems(flashApi, 'forge.test.webid', storageType);

         refreshCards();

         forge.log.info(cat, 'Web IDs cleared');
         setStatus('#status-manage', 'All WebIDs deleted.', false, true);
      }
      catch(ex)
      {
         forge.log.error(cat, ex);
         setStatus('#status-manage', 'WebId deletion failed.', true);
      }
   });

   /**
    * Display creation options.
    */
   $('#b-options').click(function()
   {
      $('#webid-create-options').toggle();
      return false;
   });

   /**
    * Display advanced import creation.
    */
   $('#b-advanced').click(function()
   {
      $('#webid-import').toggle();
      return false;
   });

   // load current WebID cards on startup
   refreshCards();

   // generate a WebID on startup
   generateId();
};
