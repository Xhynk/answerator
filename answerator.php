<?php
	header( 'Content-Type: application/json' );
	header( 'Access-Control-Allow-Origin: *' );

	function get_web_page( $url ){
		$user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:78.0) Gecko/20100101 Firefox/78.6.1';

		$options = array(
			CURLOPT_CUSTOMREQUEST  => "GET",
			CURLOPT_POST           => false,
			CURLOPT_USERAGENT      => $user_agent,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_HEADER         => false,
			CURLOPT_FOLLOWLOCATION => true,
			CURLOPT_ENCODING       => "",
		);

		$ch = curl_init( $url );
		curl_setopt_array( $ch, $options );

		$result = curl_getinfo( $ch );
		$result['content'] = curl_exec( $ch );
		$result['errmsg']  = curl_error( $ch );
		$result['errno']   = curl_errno( $ch );

		curl_close( $ch );
		return $header;
	}

	$url  = $_REQUEST['url'];
	$doc  = new DOMDocument();
	$path = __DIR__ . sprintf( '/cache/%s.html', preg_replace('[\W|_]', '', $url) );

	// Check for cache:
	if( file_exists($path) && time() - filemtime($path) <= 60 * 60 * 24 * 7 ){
		$page = file_get_contents($path);
	} else {
		$page = get_web_page($url)['content'];
		file_put_contents( $path, $page );
	}
	
	$doc->loadHTML($page);
	$page = $doc->saveHTML();

	if( stripos($url, 'developer.wordpress.org') ){
		preg_match('/(?<=<section class="summary">).*?(?=<\/section>)/s', $page, $matches );
		$description = $matches[0];
	} else if( stripos($url, 'www.php.net') ){
		preg_match('/(?<=<span class="dc-title">).*?(?=<\/span>)/s', $page, $matches );
		if( !$description = $matches[0] ){
			preg_match('/(?<=<span class="para">).*?(?=<\/span>)/s', $page, $matches );
			$description = $matches[0];
		}		
	}

	echo json_encode( array(
		'url' => $url,
		'description' => trim(strip_tags($description))
	) );