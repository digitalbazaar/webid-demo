<?php

// storage
if($_SERVER['REQUEST_METHOD'] === 'POST')
{
   // FIXME: no checks on input, simple for demo
   $nick = $_POST['nick'];
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
    <ns0:nick>$nick</ns0:nick>
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

   $xhtmlrdfa = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML+RDFa 1.0//EN\"
 \"http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd\"> 
<html version=\"XHTML+RDFa 1.0\" xmlns=\"http://www.w3.org/1999/xhtml\"
   xmlns:foaf=\"http://xmlns.com/foaf/0.1/\"
   xmlns:cert=\"http://www.w3.org/ns/auth/cert#\"
   xmlns:rsa=\"http://www.w3.org/ns/auth/rsa#\">
<head>
   <title>WebID Profile: $nick</title>
</head>
<body typeof=\"foaf:PersonalProfileDocument\">

   <div about=\"#me\" typeof=\"foaf:Person\">
      Nickname: <span property=\"foaf:nick\">$nick</span>
   </div>
   
   <div about=\"#cert\" typeof=\"rsa:RSAPublicKey\">
      <span rel=\"cert:identity\" resource=\"#me\">Public Key for: $nick</span>
      <div rel=\"rsa:modulus\" resource=\"#modulus\">
         Modulus: <span property=\"cert:hex\">$modulus</span>
      </div>
      <div rel=\"rsa:public_exponent\" resource=\"#public_exponent\">
         Exponent: <span property=\"cert:decimal\">65537</span>
      </div>
   </div>
</body>
</html>";  

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
      $stmt = $dbh->prepare(
         'SELECT rdf FROM webid WHERE id=:id');
      $params = array(
         ':id' => $_GET['id']);
      $stmt->execute($params);
      $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
      if(count($rows) > 0)
      {
         // matching webID
         header('Content-Type: application/rdf+xml');
         echo "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n";
         echo $rows[0]['rdf'];
      }
      else
      {
         // no matchin webID
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
