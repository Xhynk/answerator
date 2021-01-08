// ==UserScript==
// @name         Stack Overflow Answerator
// @namespace    http://xhynk.com
// @version      0.1
// @description  Help answer StackOverflow questions with appropriate linkage without needing to reference WP/PHP docs
// @author       Xhynk
// @match        https://stackoverflow.com/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	window.onload = function(){
		// Add some loading styles
		var style = document.createElement('style');
		style.innerHTML = `.wmd-preview.loading{position:relative}.wmd-preview.loading:after{content:"";position:absolute;top:-12px;left:-12px;width:calc(100% + 12px);height:calc(100% + 12px);background:rgba(0,0,0,.5);backdrop-filter:blur(.6px)}.wmd-preview.loading:before{z-index:10;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100px;height:100px;border:24px solid rgba(255,255,255,.2);content:"";border-radius:100px;border-top-color:#0094ee;animation:wmdpreviewspin .2s linear forwards infinite}@keyframes wmdpreviewspin{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}`;
		document.head.appendChild(style);

		// Add the Answerator Button
		var submitButton     = document.querySelector('#submit-button');
		var answeratorButton = document.createElement('span');

		answeratorButton.classList.add('grid--cell', 's-btn', 's-btn__primary', 's-btn__icon');
		answeratorButton.style.background = '#9f43bd';
		answeratorButton.innerText = 'Answerator';
		answeratorButton.onclick = function(){
			event.preventDefault();

			// Show we're doing something
			var preview = this.closest('form').querySelector('.wmd-preview');
			preview.classList.add('loading');

			// Find the answer input (TODO: Change for edits)
			var input = this.closest('form').querySelector('#wmd-input');
			input = (input === null) ? '' : input;
			var value = input.value;

			// Look for %%type|function%% matches
			var matches = value.match(/%%[|\w\d]*%%/gi);
			if( matches !== null && matches.length > 0 ){
				matches = [...new Set(matches)]; // Remove Duplicates

				// Start the Reference Table
				input.value += '\r\n\r\n----\r\n\r\n### Documentation & Function Reference\r\n\r\n| Function | Linked Description |\r\n\| --- | --- |\r\n';

				matches.forEach((match,i) => {
					var item = match.replace(/%/g,'').split('|'),
							type = item[0],
							ref  = item[1],
							xURL = 'https://xhynk.com/answerator/?url=',
							refURL;

					// Where do we look? (Todo: Parse this manually in the fetch request?)
					switch( type ){
						case 'wpf': refURL = 'https://developer.wordpress.org/reference/functions/' + ref; xURL += refURL; break;
						case 'wph': refURL = 'https://developer.wordpress.org/reference/hooks/' + ref; xURL += refURL; break;
						case 'f':   refURL = 'https://www.php.net/manual/en/function.'+ ref.replace(/_/g,'-') +'.php'; xURL += refURL; break;
						case 'cs':  refURL = 'https://www.php.net/manual/en/control-structures.'+ ref.replace(/_/g,'-') +'.php'; xURL += refURL; break;
					}

					ref = (type == 'wph') ? ref : ref + '()';

					fetch(xURL)
						.then(response => response.json())
						.then(data => {
							// Find match
							var regex = new RegExp(match.replace('|','\\|'), 'gi');

							// Replace match
							input.value = input.value.replace(regex, '[`'+ ref +'`]('+ refURL +')');

							// Add match to reference
							input.value += '| `'+ ref +'` | ['+ data.description +']('+ refURL +') |\r\n';

							// Reinvoke change
							input.dispatchEvent(new Event('focus'));
							input.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 40}));

							// Remove loading
							if( i == matches.length-1 ){
								preview.classList.remove('loading');
							}
						});
				});
			} else {
				preview.classList.remove('loading');
			}
		}

		submitButton.parentNode.insertBefore(answeratorButton, submitButton.nextSibling );
	}
})();