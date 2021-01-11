var device=null ;

const reportId = 1;
const INPUT_ENDPOINT = 0x00;
const OUTPUT_ENDPOINT = 0x00;


const HID_PKT_SIZE = 64;

const ku01Button = document.querySelector('#buttonku01');
const VIDText = document.querySelector('#TextVID');
const PIDText = document.querySelector('#TextPID');
const ku02Button = document.querySelector('#buttonku02');
const HEX01Text = document.querySelector('#TextHEX01');

const waitFor = duration => new Promise(r => setTimeout(r, duration));

let outputReportId = 0x00;
let outputReport = new Uint8Array(HID_PKT_SIZE);
    for (var i = 0; i < HID_PKT_SIZE; i++) {
			outputReport[i] = 0;			
		
	}



function hexStringToArrayBuffer(hexString) {
    // remove the leading 0x
    hexString = hexString.replace(/^0x/, '');
    
    // ensure even number of characters
    if (hexString.length % 2 != 0) {
        console.log('WARNING: expecting an even number of characters in the hexString');
    }
    
    // check for some non-hex characters
    var bad = hexString.match(/[G-Z\s]/i);
    if (bad) {
        console.log('WARNING: found non-hex characters', bad);    
    }
    
    // split the string into pairs of octets
    var pairs = hexString.match(/[\dA-F]{2}/gi);
    
    // convert the octets to integers
    var integers = pairs.map(function(s) {
        return parseInt(s, 16);
    });
    
    var array = new Uint8Array(integers);
    console.log(array);
    
    return array.buffer;
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  // create a byte array (Uint8Array) that we can use to read the array buffer
  const byteArray = new Uint8Array(buffer);
  
  // for each element, we want to get its two-digit hexadecimal representation
  const hexParts = [];
  for(let i = 0; i < byteArray.length; i++) {
    // convert value to hexadecimal
    const hex = byteArray[i].toString(16);
    
    // pad with zeros to length 2
    const paddedHex = ('00' + hex).slice(-2);
    // push to array
    hexParts.push(paddedHex);
		if (i < (byteArray.length - 1 )) {
			//spacer
			hexParts.push(" ");
		}    
  }
  
  // join all the hex values of the elements into a single string
  return hexParts.join('');
}

/*
// EXAMPLE:
const buffer = new Uint8Array([ 4, 8, 12, 16 ]).buffer;
console.log(buf2hex(buffer)); // = 04080c10st PIDText = document.getElementById('TextPID');
*/


function hexToBytes(hex) {
	var newhex = hex.replace(/\s+/g, '')
    for (var bytes = [], c = 0; c < newhex.length; c += 2)
    bytes.push(parseInt(newhex.substr(c, 2), 16));
    return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
		if (i < (bytes.length - 1 )) {
			//spacer
			hex.push(" ");
		}
    }
    return hex.join("");
}

function onInputReport(event) {
	    let dv = event.data

   console.log('Message from BOSS :');
   console.log(buf2hex(dv.buffer))

}


const connectDevice = async (device) => {
  let joyCon;
  if (device.productId === 0x2006) {
    joyCon = new JoyConLeft(device);
  } else if (device.productId === 0x2007) {
    joyCon = new JoyConRight(device);
  }
  await joyCon.open();
  await joyCon.enableStandardFullMode();
  await joyCon.enableIMUMode();
  return joyCon;
};

const requestDevice = async () =>  {
	document.getElementById("preconnect").innerHTML = "filter to <br>VID :"+ bytesToHex(hexToBytes(VIDText.value))+"<br>PID :" +  bytesToHex(hexToBytes(PIDText.value))+"";

let VIDbuffer = new Uint8Array(hexToBytes(VIDText.value)).buffer;
let VIDdataView = new DataView(VIDbuffer);
let PIDbuffer = new Uint8Array(hexToBytes(PIDText.value)).buffer;
let PIDdataView = new DataView(PIDbuffer);

// get 8-bit number at offset 0
//alert( dataView.getUint8(0) ); // 255

// now get 16-bit number at offset 0, it consists of 2 bytes, together interpreted as 65535
//alert( dataView.getUint16(0) ); // 65535 (biggest 16-bit unsigned int)

	

  const filters = [
    {
 	  //teensy //#usagePage: 0xFFAB, usage: 0x0200	  
      vendorId: VIDdataView.getUint16(0), 
      productId: PIDdataView.getUint16(0), 

	  usagePage: 0xFFAB, 
	  usage: 0x0200 
    },
  ];
  

  try {
     [device] = await navigator.hid.requestDevice({ filters });
    if (!device) {
		    console.log('chooser dismissed with no selection');
      return;
    }
	
	await device.open();
    if (!device.opened) {
      console.log('open failed');
      //return;
    }
  
   device.oninputreport = onInputReport;
   console.log('Connected to device: ' + device.productName);
   //console.log(device.HIDCollectionInfo);
  
  } catch (error) {
    console.error(error.name, error.message);
  }
};



const  proseskan = async () => {

	
   console.log('Connected to device: ' + device.productName);

  let HEX01buffer = new Uint8Array(hexToBytes(HEX01Text.value));  

  console.log(buf2hex(HEX01buffer)); // 



    
    var sendbytes = hexToBytes(HEX01Text.value);
	//console.log("sendbytes length = " + sendbytes.length);
    for (var i = 0; i < sendbytes.length; i++) {
		if (i < HID_PKT_SIZE) {
			//console.log(sendbytes[i]);
			outputReport[i] = sendbytes[i];			
		}
	}
    
	  	//document.getElementById("hasil").innerHTML = "<h3>Hex : "+ bytesToHex(hexToBytes(HEX01Text.value)) + "</h3>";
      console.log(buf2hex(outputReport));
//try 
  {
	  await device.sendReport(outputReportId,outputReport );


     await waitFor(100);	
  } 
  /*
   catch (error) 
  {
    console.error(error.name, error.message);
  } 
  */
  
}


ku01Button.addEventListener('click', requestDevice);
ku02Button.addEventListener('click', proseskan);





