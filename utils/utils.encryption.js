/*
	== ENC ==
	ENC.sha1 - used in encrypting passwords at login
	ENC.base64.encode - used in encrypting passwords to pass at saving
*/
var ENC = {
	sha1: function(msg){
 
		var rotate_left = function(n,s){
			var t4 = ( n<<s ) | (n>>>(32-s));
			return t4;
		}; //rotate_left
	 
		var lsb_hex = function(val){
			var str="";
			var i;
			var vh;
			var vl;
	 
			for( i=0; i<=6; i+=2 ){
				vh = (val>>>(i*4+4))&0x0f;
				vl = (val>>>(i*4))&0x0f;
				str += vh.toString(16) + vl.toString(16);
			}
			return str;
		}; //lsb_hex
	 
		var cvt_hex = function(val){
			var str="";
			var i;
			var v;
	 
			for( i=7; i>=0; i-- ){
				v = (val>>>(i*4))&0x0f;
				str += v.toString(16);
			}
			return str;
		}; //cvt_hex
	 
		var Utf8Encode = function(string){
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";
	 
			for (var n = 0; n < string.length; n++){
				var c = string.charCodeAt(n);
				if (c < 128)
					utftext += String.fromCharCode(c);
				else if ((c > 127) && (c < 2048)){
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}
	 
			}
	 
			return utftext;
		}; //Utf8Encode
		
		var blockstart;
		var i, j;
		var W = new Array(80);
		var H0 = 0x67452301;
		var H1 = 0xEFCDAB89;
		var H2 = 0x98BADCFE;
		var H3 = 0x10325476;
		var H4 = 0xC3D2E1F0;
		var A, B, C, D, E;
		var temp;
		msg = Utf8Encode(msg);
		var msg_len = msg.length;
		var word_array = new Array();
		for ( i=0; i<msg_len-3; i+=4 ){
			j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
			msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
			word_array.push( j );
		}
		switch( msg_len % 4 ){
			case 0:
				i = 0x080000000;
			break;
			case 1:
				i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
			break;
	 
			case 2:
				i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
			break;
	 
			case 3:
				i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8	| 0x80;
			break;
		}
		word_array.push( i );
		while ((word_array.length % 16) != 14){
			word_array.push( 0 );
		}
		word_array.push( msg_len>>>29 );
		word_array.push( (msg_len<<3)&0x0ffffffff );
		for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ){
			for ( i=0; i<16; i++ ){
				W[i] = word_array[blockstart+i];
			}
			for ( i=16; i<=79; i++ ){
				W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
			}
			A = H0;
			B = H1;
			C = H2;
			D = H3;
			E = H4;
			for ( i= 0; i<=19; i++ ){
				temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
			for ( i=20; i<=39; i++ ){
				temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
			for ( i=40; i<=59; i++ ){
				temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
			for ( i=60; i<=79; i++ ){
				temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}
			H0 = (H0 + A) & 0x0ffffffff;
			H1 = (H1 + B) & 0x0ffffffff;
			H2 = (H2 + C) & 0x0ffffffff;
			H3 = (H3 + D) & 0x0ffffffff;
			H4 = (H4 + E) & 0x0ffffffff;
		}
		var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
		return temp.toUpperCase();
	},

	//encode/decode to base64
	base64: {
		keystr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
		encode: function(input){
			var output = '';
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;
			input = ENC.base64._utf8_encode(input);

			while (i < input.length){

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2))
					enc3 = enc4 = 64;
				else if (isNaN(chr3))
					enc4 = 64;
				output = output +
				this.keystr.charAt(enc1) + this.keystr.charAt(enc2) +
				this.keystr.charAt(enc3) + this.keystr.charAt(enc4);
			}
			return output;
		},
		decode: function(input) {
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;

			input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < input.length) {

				enc1 = this.keystr.indexOf(input.charAt(i++));
				enc2 = this.keystr.indexOf(input.charAt(i++));
				enc3 = this.keystr.indexOf(input.charAt(i++));
				enc4 = this.keystr.indexOf(input.charAt(i++));

				chr1 = (enc1 << 2) | (enc2 >> 4);
				chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
				chr3 = ((enc3 & 3) << 6) | enc4;

				output = output + String.fromCharCode(chr1);

				if (enc3 != 64) {
					output = output + String.fromCharCode(chr2);
				}
				if (enc4 != 64) {
					output = output + String.fromCharCode(chr3);
				}

			}

			output = ENC.base64._utf8_decode(output);

			return output;

		},
		_utf8_encode: function(string){
			string = string.replace(/\r\n/g,"\n");
			var utftext = '';

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}

			return utftext;
		},
		_utf8_decode: function(utftext){
			var string = '';
			var i = 0;
			var c = c1 = c2 = 0;

			while ( i < utftext.length ){
				c = utftext.charCodeAt(i);
				if (c < 128){
					string += String.fromCharCode(c);
					i++;
				}
				else if((c > 191) && (c < 224)) {
					c2 = utftext.charCodeAt(i+1);
					string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
					i += 2;
				}
				else {
					c2 = utftext.charCodeAt(i+1);
					c3 = utftext.charCodeAt(i+2);
					string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
					i += 3;
				}
			}
			return string;
		}
	} //base64
};