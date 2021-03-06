/*******************************************************
*                                                      *
*   REXLANG example - data exchange via serial line    *
*                                                      *
*   Receiver station                                   *
*                                                      *
*   (c) REX Controls, www.rexcontrols.com              *
*                                                      *
*******************************************************/

#define CON_COM1 33	       // COM1 in Windows, /dev/ttyS1 in Linux
#define CON_COM2 34
#define CON_COM3 35
#define CON_COM4 36
#define CON_COM5 37        // COM5 in Windows, /dev/ttyS5 in Linux
#define CON_COM6 38
#define CON_COM7 39
#define CON_COM8 40
#define CON_COM9 41        // COM9 in Windows, /dev/ttyS9 in Linux
#define CON_COM_FNAME 63   // serial device is defined by the fname parameter of the REXLANG block (e.g. set it to /dev/ttyAMA0 on the Raspberry Pi minicomputer) )

#define COM_BAUDRATE 57600 //baudrate, e.g. 9600, 19200, 57600, 115200

#define COM_PARITY_NONE 0  //no parity
#define COM_PARITY_ODD  1  //odd parity
#define COM_PARITY_EVEN 2  //even parity

#define BUFFER_SIZE  50    //maximum number of bytes to receive

long output(0) signal0;    //integer number received from the sender
long output(1) signal1;    //integer number received from the sender
double output(2) signal2;  //real number received from the sender
double output(3) signal3;  //real number received from the sender
long output(14) receivedBytes; //number of received bytes
long output(15) handle;    //handle of the serial device

long output(10) dat0;      //the first byte of the received data
long output(11) dat1;      //the second byte of the received data
long output(12) dat2;      //the third byte of the received data
long output(13) dat3;      //the fourth byte of the received data

long hCom;   //socket handle
long buffer[BUFFER_SIZE]; //buffer for incoming data
long dataCnt;    //number of received bytes
long convData[2];    //array for data conversion

/* Function for conversion of 2 numbers of type Long representing a decimal 
number in the double format according to IEEE 754 to a decimal number. 
Little-endian format is used. */
double LongAsDouble(long val[])
{
	double lbase=((double)(val[1]&0xFFFFF))/((double)0x00100000)+(val[0]&0x7FFFFFFF)*pow(2.0,-52.0);
	long lexp=(val[1]>>20)&0x7FF;
	if(val[0]&0x80000000)
		lbase+=pow(2.0,-21.0);
	if(lexp==0)
		return 0.0;
	if(lexp==0x7FF)
	{	
    //deal with NaN and Inf here if necessary
		return 1.0e60; //substitute value
	}
	lbase=(lbase+1.0)*pow(2.0,(double)(lexp-1023));
	return (val[1]&0x80000000)!=0? -lbase : lbase;
}

/* Initialization of the REXLANG algorithm */
long init(void)
{
  hCom = -1;
  dataCnt = 0;
	return 0;
}

/* The body of REXLANG algorithm */
long main(void)
{
  long i;
  if (hCom<0)
  {
    hCom = Open(CON_COM9,COM_BAUDRATE,COM_PARITY_NONE);  //opening serial device
  }
  else 
  {
    //receive the data
    dataCnt = Recv(hCom,buffer,BUFFER_SIZE); //receive data, max number of bytes = BUFFER_SIZE
    //number of type long, therefore 4 bytes
    signal0 = buffer[0] | buffer[1]<<8 | buffer[2]<<16 | buffer[3]<<24;
    dat0 = buffer[0];
    dat1 = buffer[1];
    dat2 = buffer[2];
    dat3 = buffer[3];
    
    //binary signal, therefore 1 byte
    signal1 = buffer[4];
    //double value, therefore 8 bytes
    convData[0] = buffer[5] | buffer[6]<<8 | buffer[7]<<16 | buffer[8]<<24;
    convData[1] = buffer[9] | buffer[10]<<8 | buffer[11]<<16 | buffer[12]<<24;
    signal2 = LongAsDouble(convData);
    //double value, therefore 8 bytes
    convData[0] = buffer[13] | buffer[14]<<8 | buffer[15]<<16 | buffer[16]<<24;
    convData[1] = buffer[17] | buffer[18]<<8 | buffer[19]<<16 | buffer[20]<<24;
    signal3 = LongAsDouble(convData);
  }  
  receivedBytes = dataCnt;
  handle = hCom;
  return 0;
}

/* Closing the REXLANG algorithm */
long exit(void)
{
	if(hCom>=0) Close(hCom);
  return 0;
}