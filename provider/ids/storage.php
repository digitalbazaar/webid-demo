<?php

// storage
if($_SERVER['REQUEST_METHOD'] === 'POST')
{
   // FIXME: no checks on input, simple for demo
   $id = $_POST['id'];
   $uri = $_POST['uri'];
   $title = $_POST['title'];
   $name = $_POST['name'];
   $email = $_POST['email'];
   $locality = $_POST['locality'];
   $state = $_POST['state'];
   $country = $_POST['country'];
   $org = $_POST['org'];
   $orgUnit = $_POST['orgUnit'];
   $modulus = $_POST['modulus'];

   $rdf = <<<"EOD"
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:ns0="http://xmlns.com/foaf/0.1/"
  xmlns:ns1="http://www.w3.org/ns/auth/cert#"
  xmlns:ns2="http://www.w3.org/ns/auth/rsa#">

  <rdf:Description rdf:about="">
    <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/PersonalProfileDocument"/>
    <ns0:maker rdf:resource="#me"/>
    <ns0:primaryTopic rdf:resource="#me"/>
  </rdf:Description>

  <rdf:Description rdf:about="#me">
    <rdf:type rdf:resource="http://xmlns.com/foaf/0.1/Person"/>
    <ns0:nick>$name</ns0:nick>
    <ns0:homepage rdf:resource=""/>
  </rdf:Description>

  <rdf:Description rdf:about="#cert">
    <rdf:type rdf:resource="http://www.w3.org/ns/auth/rsa#RSAPublicKey"/>
    <ns1:identity rdf:resource="#me"/>
    <ns2:modulus rdf:resource="#modulus"/>
    <ns2:public_exponent rdf:resource="#public_exponent"/>
  </rdf:Description>

  <rdf:Description rdf:about="#modulus">
    <ns1:hex>$modulus</ns1:hex>
  </rdf:Description>

  <rdf:Description rdf:about="#public_exponent">
    <ns1:decimal>65537</ns1:decimal>
  </rdf:Description>

</rdf:RDF>
EOD;

   $xhtmlrdfa = <<<"EOD"
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN"
   "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">
<html version="XHTML+RDFa 1.0" xmlns="http://www.w3.org/1999/xhtml"
   xmlns:foaf="http://xmlns.com/foaf/0.1/"
   xmlns:cert="http://www.w3.org/ns/auth/cert#"
   xmlns:rsa="http://www.w3.org/ns/auth/rsa#"
   xmlns:ps="http://payswarm.com/vocab#"
   xmlns:cmx="http://cmx.org/spec/terms#"
   xmlns:microblog="http://example.org/microblog#">
<head>
   <title>WebID Card: $title</title>
   <link type="text/css" rel="stylesheet" media="all" href="/webid.css" />
</head>
<body typeof="foaf:PersonalProfileDocument">
   <div id="container">
      <div id="header">
         <div class="col">
            <h1>Digital Bazaar Public WebID</h1>
         </div>
      </div>

      <div id="content" class="col">
         <div id="webid-' + id + '" class="webid" about="#me" typeof="foaf:Person">
            <div class="webid-image">
               <img src="/identity.png" />
            </div>

            <div class="webid-info">
               <p class="webid-title">$title</p>
               <p class="webid-name" property="foaf:nick">$name</p>
               <p class="webid-email">$email</p>
               <p class="webid-location">$locality, $state $country</p>
               <p class="webid-uri">$uri</p>
            </div>
            <div id="webid-details-' + id + '" class="webid-details clear">
               <p class="detail-title">Providers</p>
               <div class="row">
                  <span class="label">PaySwarm</span>
                  <span class="value"><a rel="ps:provider" href="http://payswarm.com">PaySwarm</a></span>
               </div>
               <div class="row">
                  <span class="label">Music Registration</span>
                  <span class="value"><a rel="cmx:provider" href="http://connectedmediaexperience.org/">Connected Media Experience</a></span>
               </div>
               <div class="row">
                  <span class="label">Microblogging</span>
                  <span class="value"><a rel="microblog:provider" href="http://twitter.com">Twitter</a></span>
               </div>

               <p class="detail-title">Public Key</p>
               <div about="#cert" typeof="rsa:RSAPublicKey">
                  <div class="row">
                     <span class="label">Owner</span>
                     <span rel="cert:identity" resource="#me">$name</span>
                  </div>
                  <div class="row" rel="rsa:modulus" resource="#modulus">
                     <span class="label">Modulus</span>
                     <span class="webid-modulus value" property="cert:hex">$modulus</span>
                  </div>
                  <div class="row" rel="rsa:public_exponent" resource="#public_exponent">
                     <span class="label">Exponent</span>
                     <span class="webid-exponent value" property="cert:decimal">65537</span>
                  </div>
               </div>
            </div>
            <div class="clear"></div>
         </div>
      </div>
   </div>
</body>
</html>
EOD;

   /*
   $xhtmlrdfa = <<<"EOD"
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN"
   "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd">
<html version="XHTML+RDFa 1.0" xmlns="http://www.w3.org/1999/xhtml"
   xmlns:foaf="http://xmlns.com/foaf/0.1/"
   xmlns:cert="http://www.w3.org/ns/auth/cert#"
   xmlns:rsa="http://www.w3.org/ns/auth/rsa#"
   xmlns:ps="http://payswarm.com/vocab#"
   xmlns:cmx="http://cmx.org/spec/terms#"
   xmlns:microblog="http://example.org/microblog#">
<head>
   <title>WebID Profile: $cardname</title>
   <link rel="stylesheet" type="text/css" media="all" href="/webid.css" />
</head>
<body typeof="foaf:PersonalProfileDocument">

   <div about="#me" typeof="foaf:Person">
      Nickname: <span property="foaf:nick">$cardname</span>
      <a rel="ps:provider" href="http://payswarm.com/">PaySwarm</a>
      <a rel="cmx:provider" href="http://connectedmediaexperience.org/">CME</a>
      <a rel="microblog:provider" href="http://payswarm.com/">Twitter</a>
   </div>

   <div about="#cert" typeof="rsa:RSAPublicKey">
      <span rel="cert:identity" resource="#me">Public Key for: $cardname</span>
      <div rel="rsa:modulus" resource="#modulus">
         Modulus: <span property="cert:hex">$modulus</span>
      </div>
      <div rel="rsa:public_exponent" resource="#public_exponent">
         Exponent: <span property="cert:decimal">65537</span>
      </div>
   </div>
</body>
</html>
EOD;
   */

   // save input to database
   try
   {
      // connect to db
      $dbh = new PDO('sqlite:/var/tmp/webid-demo.db');
      $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

      // create table
      $dbh->exec(
         'CREATE TABLE IF NOT EXISTS webid
            (id TEXT, rdf TEXT, xhtmlrdfa TEXT, PRIMARY KEY (id))');

      // do update
      $stmt = $dbh->prepare(
         'REPLACE INTO webid (id,rdf,xhtmlrdfa) VALUES (:id,:rdf,:xhtmlrdfa)');
      $params = array(
         ':id' => $_POST['id'],
         ':rdf' => $rdf,
         ':xhtmlrdfa' => $xhtmlrdfa);
      $stmt->execute($params);
   }
   catch(PDOException $e)
   {
      // FIXME: handle exception
      header('HTTP/1.0 500 Internal Server Error');
      //echo '<pre>ERROR: ' . $e->getMessage() . '</pre>';
   }
}
// retrieval
else if($_SERVER['REQUEST_METHOD'] === 'GET')
{
   // check for application/rdf+xml, default to rdfa (application/xhtml+xml)
   $rdf = strpos($_SERVER['HTTP_ACCEPT'], 'application/rdf+xml') !== false;

   // get from database
   try
   {
      // connect to db
      $dbh = new PDO('sqlite:/var/tmp/webid-demo.db');
      $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

      // create table if necessary
      $dbh->exec(
         'CREATE TABLE IF NOT EXISTS webid
            (id TEXT, rdf TEXT, xhtmlrdfa TEXT, PRIMARY KEY (id))');

      // do select
      $stmt = $dbh->prepare($rdf ?
         'SELECT rdf FROM webid WHERE id=:id' :
         'SELECT xhtmlrdfa FROM webid WHERE id=:id');
      $params = array(
         ':id' => $_GET['id']);
      $stmt->execute($params);
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
      if(count($rows) > 0)
      {
         // matching webID
         if($rdf)
         {
            header('Content-Type: application/rdf+xml');
            echo "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n";
            echo $rows[0]['rdf'];
         }
         else
         {
            // correct rdfa content type, but use text/html for IE since it
            // can't display rdfa
            $contentType = 'application/xhtml+xml';
            $ua = $_SERVER['HTTP_USER_AGENT'];
            if(strstr($ua, 'MSIE'))
            {
               $contentType = 'text/html';
            }
            header('Content-Type: ' . $contentType);
            echo $rows[0]['xhtmlrdfa'];
         }
      }
      else
      {
         // no matching webID
         header('HTTP/1.0 404 Not Found');
      }
   }
   catch(PDOException $e)
   {
      // FIXME: handle exception
      header('HTTP/1.0 500 Internal Server Error');
      //echo '<pre>ERROR: ' . '$e->getMessage()' .</pre>';
   }
}
else
{
   header('HTTP/1.0 405 Method Not Allowed');
}

?>
