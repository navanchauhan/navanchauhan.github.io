---
date: 2024-08-08 16:08
description: Using LLDB with OpenCOD on macOS
tags: OpenOCD, LLVM, LLDB, macOS, Pico-W
---

# Using OpenOCD with LLDB for Raspberry Pi Pico W on macOS

This guide provides detailed instructions for setting up and using OpenOCD and LLDB to debug a Raspberry Pi Pico W on macOS. While these instructions are specific to the Pico W, they should work for any board supported by OpenOCD with minimal modifications.

## Prerequisites

- Raspberry Pi Pico W
- Raspberry Pi Debug Probe (or any other SWD-compatible debugger)
- macOS system with OpenOCD and LLDB installed
- Your compiled ELF file


Make sure you are compiling your program in DEBUG mode.

## Starting OpenOCD

Open a terminal and start the OpenOCD server with the following command:

```bash
$ sudo openocd -f interface/cmsis-dap.cfg -f target/rp2040.cfg -c "adapter speed 5000"
```

You should see output similar to this:

```bash
$ sudo openocd -f interface/cmsis-dap.cfg -f target/rp2040.cfg -c "adapter speed 5000"
Password:
Open On-Chip Debugger 0.12.0
Licensed under GNU GPL v2
For bug reports, read
	http://openocd.org/doc/doxygen/bugs.html
adapter speed: 5000 kHz

Info : Listening on port 6666 for tcl connections
Info : Listening on port 4444 for telnet connections
Warn : could not read product string for device 0x2e8a:0x000a: Operation timed out
Info : Using CMSIS-DAPv2 interface with VID:PID=0x2e8a:0x000c, serial=E6614103E7728F24
Info : CMSIS-DAP: SWD supported
Info : CMSIS-DAP: Atomic commands supported
Info : CMSIS-DAP: Test domain timer supported
Info : CMSIS-DAP: FW Version = 2.0.0
Info : CMSIS-DAP: Interface Initialised (SWD)
Info : SWCLK/TCK = 0 SWDIO/TMS = 0 TDI = 0 TDO = 0 nTRST = 0 nRESET = 0
Info : CMSIS-DAP: Interface ready
Info : clock speed 5000 kHz
Info : SWD DPIDR 0x0bc12477, DLPIDR 0x00000001
Info : SWD DPIDR 0x0bc12477, DLPIDR 0x10000001
Info : [rp2040.core0] Cortex-M0+ r0p1 processor detected
Info : [rp2040.core0] target has 4 breakpoints, 2 watchpoints
Info : [rp2040.core1] Cortex-M0+ r0p1 processor detected
Info : [rp2040.core1] target has 4 breakpoints, 2 watchpoints
Info : starting gdb server for rp2040.core0 on 3333
Info : Listening on port 3333 for gdb connections
Info : starting gdb server for rp2040.core1 on 3334
Info : Listening on port 3334 for gdb connections
Info : accepting 'gdb' connection on tcp/3333
Info : Found flash device 'win w25q16jv' (ID 0x001540ef)
Info : RP2040 B0 Flash Probe: 2097152 bytes @0x10000000, in 32 sectors
```

Leave this terminal window open.

## Using LLDB

1. Open a new terminal tab or window.

2. Start LLDB and load your ELF file:

```bash
$ lldb path/to/your/project.elf
(lldb) target create "path/to/your/project.elf"
Current executable set to '/path/to/your/project.elf' (arm).
```

3. Select the remote GDB server platform:

```bash
(lldb) platform select remote-gdb-server
Platform: remote-gdb-server
Connected: no
```

4. Connect to the OpenOCD server:

```bash
(lldb) process connect connect://localhost:3333
```

You should see output indicating that the process has stopped, usually at a memory address.

## Debugging with LLDB

Now that you're connected, you can use standard LLDB commands to debug your program. Here are some key points and useful commands:

1. Setting breakpoints:
   Use hardware breakpoints to avoid issues with software breakpoints. To set a hardware breakpoint, use the following command:

```bash
(lldb) breakpoint set --hardware --name function_name
```

2. Continuing execution:

```bash
(lldb) continue
```

3. Stepping through code:

```bash
(lldb) step    # Step in
(lldb) next    # Step over
(lldb) finish  # Step out
```

4. Inspecting variables:

```bash
(lldb) frame variable
(lldb) print variable_name
```

5. Restarting the program:
   To restart the program, use the `process plugin packet` command:

```bash
(lldb) process plugin packet monitor reset run
```

This sends the `reset run` command to OpenOCD, which resets the device and starts program execution.

## Advanced LLDB Commands

1. Backtrace:
   View the call stack:

```bash
(lldb) bt
```

2. Disassemble:
   View the assembly code:

```bash
(lldb) disassemble
```

3. Memory examination:
   View memory contents:

```bash
(lldb) memory read --size 4 --format x --count 10 0x10000000
```

4. Register inspection:
   View register contents:

```bash
(lldb) register read
```

## Tips and Tricks

1. Create an LLDB init file:
   You can create a `.lldbinit` file in your home directory with commonly used commands. For example:

```
platform select remote-gdb-server
process connect connect://localhost:3333
```

2. Use LLDB aliases:
   Create aliases for frequently used commands:

```bash
(lldb) command alias bh breakpoint set --hardware --name
```

Now you can set a hardware breakpoint with:

```bash
(lldb) bh function_name
```

3. Debugging multiple cores:
   The RP2040 has two cores. OpenOCD provides separate GDB servers for each core (ports 3333 and 3334). To debug the second core, connect to port 3334 instead.

4. Flash memory operations:
   OpenOCD can perform flash operations. For example, to erase the flash:

```bash
(lldb) process plugin packet monitor flash erase_sector 0 last
```

I still haven't figured out how to load the elf file through lldb, and for now am using Telnet to load the elf file.

```bash
$ telnet localhost 4444
Trying ::1...
telnet: connect to address ::1: Connection refused
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
Open On-Chip Debugger
> program build/pico-swift-display.elf verify
[rp2040.core0] halted due to debug-request, current mode: Thread
xPSR: 0xf1000000 pc: 0x000000ea msp: 0x20041f00
[rp2040.core1] halted due to debug-request, current mode: Thread
xPSR: 0xf1000000 pc: 0x000000ea msp: 0x20041f00
** Programming Started **
Padding image section 1 at 0x1008ae78 with 136 bytes (bank write end alignment)
Adding extra erase range, 0x1008af00 .. 0x1008ffff
keep_alive() was not invoked in the 1000 ms timelimit. GDB alive packet not sent! (8905 ms). Workaround: increase "set remotetimeout" in GDB
** Programming Finished **
** Verify Started **
** Verified OK **
```
