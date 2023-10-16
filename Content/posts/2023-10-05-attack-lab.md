---
date: 2023-10-05 20:01
description: Walkthrough of Attack Lab for CSCI 2400 Computer Systems
tags: gdb, reverse-engineering, c++, csci2400, assembly
draft: true
---

# Attack Lab

## Introduction

Lab 3 for CSCI 2400 @ CU Boulder - Computer Systems

> This assignment involves generating a total of five attacks on two programs having different security vulnerabilities.  The directions for this lab are detailed but not difficult to follow.

Again, I like using objdump to disassemble the code. 

`objdump -d ctarget > dis.txt`

## Phase 1

From the instructions, we know that our task is to get `CTARGET` to execute the code for `touch1` when `getbuf` executes its return statement, rather than returning to `test`
