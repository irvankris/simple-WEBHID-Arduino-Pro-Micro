/*
  Copyright (c) 2014-2015 NicoHood
  See the readme for credit to other people.

  Advanced RawHID example

  Shows how to send bytes via RawHID.
  Press a button to send some example values.

  Every received data is mirrored to the host via Serial.

  See HID Project documentation for more information.
  https://github.com/NicoHood/HID/wiki/RawHID-API
*/

/*

sesuaikan library, pada file RawHID.h

#undef RAWHID_USAGE_PAGE
//#define RAWHID_USAGE_PAGE  0xFFC0 // recommended: 0xFF00 to 0xFFFF
#define RAWHID_USAGE_PAGE 0xFFAB // recommended: 0xFF00 to 0xFFFF
//#usagePage: 0xFFAB, usage: 0x0200


#undef RAWHID_USAGE
//#define RAWHID_USAGE    0x0C00 // recommended: 0x0100 to 0xFFFF
#define RAWHID_USAGE    0x0200 // recommended: 0x0100 to 0xFFFF

USAGE_PAGE dan USAGE disamakan dengan konfigurasi WEBHID teensy dari luni.
 * 
 */


#include "HID-Project.h"
#include <ByteConvert.hpp>


const int pinLed = LED_BUILTIN;
const int pinButton = 9;
const int pinCommand = 10;

// Buffer to hold RawHID data.
// If host tries to send more data than this,
// it will respond with an error.
// If the data is not read until the host sends the next data
// it will also respond with an error and the data will be lost.
#define MAX_BUFFER 255
#define USB_PACKET_SIZE 64
uint8_t rawhidData[MAX_BUFFER];
uint8_t ReceivedrawhidData[MAX_BUFFER];
uint8_t Receivedlength = 0;
uint8_t Receivedposition = 0;
boolean OnReceiveWait = false;
//send buffer
uint8_t megabuff[MAX_BUFFER];

char inValChars[3];

void oneNibble(char* store,uint8_t val) {
  val &= 0xF;
  *store++ = (val < 10 ? '0' : 'A' - 10) + val;
}
void oneByte(char* store,uint8_t val) {
  oneNibble(store, val >> 4);
  oneNibble(store, val);
}

bool to_hex(char* dest, size_t dest_len, const uint8_t* values, size_t val_len) {
    if(dest_len < (val_len*2+1)) /* check that dest is large enough */
        return false;
    *dest = '\0'; /* in case val_len==0 */
    while(val_len--) {
        /* sprintf directly to where dest points */
        sprintf(dest, "%02X", *values);
        dest += 2;
        ++values;
    }
    return true;
}

static char hex[] = "0123456789ABCDEF"; 
void convert_to_hex_str(char* str, uint8_t* val, size_t val_count)
{
  for (size_t i = 0; i < val_count; i++)
  {
    str[(i * 2) + 0] = hex[((val[i] & 0xF0) >> 4)];
    str[(i * 2) + 1] = hex[((val[i] & 0x0F) >> 0)];
  }
}


void setup() {
  pinMode(pinLed, OUTPUT);
  pinMode(pinCommand, OUTPUT);
  pinMode(pinButton, INPUT_PULLUP);
  digitalWrite(pinCommand, LOW);
  
  Serial.begin(9600);

  // Set the RawHID OUT report array.
  // Feature reports are also (parallel) possible, see the other example for this.
  RawHID.begin(rawhidData, sizeof(rawhidData));
}

void loop() {
  // Send data to the host
  if (digitalRead(pinButton)) {
    digitalWrite(pinLed, HIGH);

    // Create buffer with numbers and send it
    for (uint8_t i = 0; i < USB_PACKET_SIZE; i++) {
      //megabuff[i] = i;
      megabuff[i] = ~ReceivedrawhidData[i];
    }
    RawHID.write(megabuff, USB_PACKET_SIZE);

    // Simple debounce
    delay(300);
    digitalWrite(pinLed, LOW);
    digitalWrite(pinCommand, LOW);  
  }


  // Check if there is new data from the RawHID device
  auto bytesAvailable = RawHID.available();
  if (bytesAvailable)
  {
    digitalWrite(pinLed, HIGH);
        Receivedposition = 0;

    // Mirror data via Serial
    while (bytesAvailable--) {
      ReceivedrawhidData[Receivedposition] = RawHID.read();
      to_hex(inValChars, 3  ,&ReceivedrawhidData[Receivedposition], 1 );
      //such a waste of time. what is the different between this :
      //Serial.print(i + " > " + inValChars);      
      //and this :
      Serial.print(Receivedposition);
      Serial.print(" > ");
      Serial.println(inValChars);
      Receivedposition = Receivedposition +1;
    }



    
    digitalWrite(pinLed, LOW);
  }
}

