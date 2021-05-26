---
date: 2020-06-01 13:10
description: This is my workflow for lightning fast molecular docking.
tags: Code-Snippet, Molecular-Docking, Cheminformatics, Open-Babel, AutoDock Vina
---

# Workflow for Lightning Fast Molecular Docking Part One

## My Setup

* macOS Catalina ( RIP 32bit app)
* PyMOL
* AutoDock Vina
* Open Babel

## One Command Docking

```
obabel -:"$(pbpaste)" --gen3d -opdbqt -Otest.pdbqt && vina --receptor lu.pdbqt --center_x -9.7 --center_y 11.4 --center_z 68.9 --size_x 19.3 --size_y 29.9 --size_z 21.3  --ligand test.pdbqt
```

To run this command you simple copy the SMILES structure of the ligand you want an it automatically takes it from your clipboard, generates the 3D structure in the AutoDock PDBQT format using Open Babel and then docks it with your receptor using AutoDock Vina, all with just one command.


Let me break down the commands


```
obabel -:"$(pbpaste)" --gen3d -opdbqt -Otest.pdbqt
```

`pbpaste`  and `pbcopy` are macOS commands for pasting and copying from and to the clipboard. Linux users may install the `xclip` and  `xsel` packages from their respective package managers and then insert these aliases into their bash_profile,  zshrc e.t.c


```
alias pbcopy='xclip -selection clipboard'
alias pbpaste='xclip -selection clipboard -o'
```


```
$(pbpaste)
```

This is used in bash to evaluate the results of a command. In this scenario we are using it to get the contents of the clipboard.

The rest of the command is a normal Open Babel command to generate a 3D structure in PDBQT format and then save it as `test.pdbqt`


```
&&
```

This tells the terminal to only run the next part if the previous command runs successfully without any errors.


```
vina --receptor lu.pdbqt --center_x -9.7 --center_y 11.4 --center_z 68.9 --size_x 19.3 --size_y 29.9 --size_z 21.3  --ligand test.pdbqt
```

This is just the docking command for AutoDock Vina. In the next part I will tell how to use PyMOL and a plugin to directly generate the coordinates in Vina format ` --center_x -9.7 --center_y 11.4 --center_z 68.9 --size_x 19.3 --size_y 29.9 --size_z 21.3` without needing to type them manually.
