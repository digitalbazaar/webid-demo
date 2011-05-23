<?php
// get cookies
$cookie = $_COOKIE['webid'];
if(isset($cookie))
{
   $cookie = json_decode(urldecode($cookie));
   $cookie->cert = openssl_x509_parse($cookie->cert);
}
$rdf = $_COOKIE['rdf'];
if(isset($rdf))
{
   $rdf = base64_decode($rdf);
}
// clear cookies
//print_r($cookie);
setcookie('webid', '', 0);
setcookie('rdf', '', 0);
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
   <head>
      <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
      <title>socialswarm - your home page</title>

      <link href="socialsite.css" rel="stylesheet" type="text/css" />

      <link rel="shortcut icon" href="favicon.ico" />

      <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
      <script type="text/javascript" src="socialsite.js"></script>
   </head>

   <body>
      <div id="container">
         <div id="header">
            <div class="col">
               <h1>socialswarm</h1>
            </div>
         </div>

         <div id="content">
            <div id="home">
            <?php if(isset($cookie) and $cookie->success) { ?>
               <h2>Welcome, you are now logged in.</h2>

               <p>Congratulations! You have logged into socialswarm using your demo WebID.</p>
	            <p>Normally, if this were a real social networking site, you would see your messages, friends,
               and other social stuff on this page. Much of this information could actually be retrieved
               directly from your WebID URL, making it possible for you to store your friends and any other
               fully-customizable information in a single, global location. For the purpose of this demo, this
               page is intentionally left empty - a blank slate to represent the endless possibilities of WebID ;).</p>
	            <p>Your demo WebID: <a href="<?php echo $cookie->webID; ?>"><?php echo $cookie->webID; ?></a></p>
               <p>If you refresh this page or navigate away from it you will be logged out.
               Note that this is not a limitation of the technology, rather it makes it
               easier to more rapidly demonstrate selecting different WebIDs and repeat
               the demonstration process.
               </p>
               <p>For geeks: To demonstrate that your certificate was read during the login, here is your certificate subject:</p>
               <p><?php echo json_encode($cookie->cert->subject); ?></p>
               <p>Here is your RDF profile:</p>
               <p><pre><?php echo htmlspecialchars($rdf); ?></pre></p>
            <?php } else if(isset($cookie)) { ?>
               <p>You are not logged in. Authentication failed:
               "<?php echo $cookie->error ?>"</p>
               <p><a href="https://payswarm.com/webid-demo">Click here to try to login again.</a></p>
            <?php } else { ?>
               <p>You are not logged in. <a href="https://payswarm.com/webid-demo">Click here to login.</a></p>
            <?php } ?>
            </div>

            <div class="clear"></div>
         </div>

         <div id="footer">
            <p id="copyright">
               Digital Bazaar, Inc. &#169; 2010
               Web Page Content licensed under Creative Commons Attribution Share-Alike 3.0. JavaScript and PHP licensed under BSD License.
            </p>
            <p id="legal">Part of the <a href="http://payswarm.com/">payswarm.com</a> initiative.</p>
         </div>
      </div>
   </body>
</html>
