---
date: 2023-02-08 17:21
description: Code snippet to interact with Siri by issuing commands from the command-line.
tags: Tutorial, Code-Snippet, Python, Siri, macOS, AppleScript
---

# Interacting with Siri using the command line

My main objective was to see if I could issue multi-intent commands in one go. Obviously, Siri cannot do that (neither can Alexa, Cortana, or Google Assistant). The script here can issue either a single command, or use the help of OpenAI's DaVinci model to extract multiple commands and pass them onto siri.

## Prerequisites

* Run macOS
* Enable type to Siri (Settings > Accessibility -> Type to Siri)
* Enable the Terminal to control System Events (The first time you run the script, it will prompt you to enable it)

## Show me ze code

If you are here just for the code:

```python
import argparse
import applescript
import openai

from os import getenv

openai.api_key = getenv("OPENAI_KEY")
engine = "text-davinci-003"

def execute_with_llm(command_text: str) -> None:
	llm_prompt = f"""You are provided with multiple commands as a single command. Break down all the commands and return them in a list of strings. If you are provided with a single command, return a list with a single string, trying your best to understand the command.
	
	Example:
	Q: "Turn on the lights and turn off the lights"
	A: ["Turn on the lights", "Turn off the lights"]

	Q: "Switch off the lights and then play some music"
	A: ["Switch off the lights", "Play some music"]

	Q: "I am feeling sad today, play some music"
	A: ["Play some cheerful music"]

	Q: "{command_text}"
	A: 
	"""

	completion = openai.Completion.create(engine=engine, prompt=llm_prompt, max_tokens=len(command_text.split(" "))*2)

	for task in eval(completion.choices[0].text):
		execute_command(task)


def execute_command(command_text: str) -> None:
	"""Execute a Siri command."""

	script = applescript.AppleScript(f"""
		tell application "System Events" to tell the front menu bar of process "SystemUIServer"
			tell (first menu bar item whose description is "Siri")
				perform action "AXPress"
			end tell
		end tell

		delay 2

		tell application "System Events"
			set textToType to "{command_text}"
			keystroke textToType
			key code 36
		end tell
	""")

	script.run()


if __name__ == "__main__":
	parser = argparse.ArgumentParser()
	parser.add_argument("command", nargs="?", type=str, help="The command to pass to Siri", default="What time is it?")
	parser.add_argument('--openai', action=argparse.BooleanOptionalAction, help="Use OpenAI to detect multiple intents", default=False)
	args = parser.parse_args()

	if args.openai:
		execute_with_llm(args.command)
	else:
		execute_command(args.command)
```

Usage:

```bash
python3 main.py "play some taylor swift"
python3 main.py "turn off the lights and play some music" --openai
```

## ELI5 

I am not actually going to explain it as if I am explaining to a five-year old kid.

### AppleScript

In the age of Siri Shortcuts, AppleScript can still do more. It is a scripting language created by Apple that can help you automate pretty much anything you see on your screen.

We use the following AppleScript to trigger Siri and then type in our command:

```applescript
tell application "System Events" to tell the front menu bar of process "SystemUIServer"
	tell (first menu bar item whose description is "Siri")
		perform action "AXPress"
	end tell
end tell

delay 2

tell application "System Events"
	set textToType to "Play some rock music"
	keystroke textToType
	key code 36
end tell
```

This first triggers Siri, waits for a couple of seconds, and then types in our command. In the script, this functionality is handled by the `execute_command` function.

```python
import applescript

def execute_command(command_text: str) -> None:
	"""Execute a Siri command."""

	script = applescript.AppleScript(f"""
		tell application "System Events" to tell the front menu bar of process "SystemUIServer"
			tell (first menu bar item whose description is "Siri")
				perform action "AXPress"
			end tell
		end tell

		delay 2

		tell application "System Events"
			set textToType to "{command_text}"
			keystroke textToType
			key code 36
		end tell
	""")

	script.run()
```

### Multi-Intent Commands

We can call OpenAI's API to autocomplete our prompt and extract multiple commands. We don't need to use OpenAI's API, and can also simply use Google's Flan-T5 model using HuggingFace's transformers library. 

#### Ze Prompt

```text
You are provided with multiple commands as a single command. Break down all the commands and return them in a list of strings. If you are provided with a single command, return a list with a single string, trying your best to understand the command.
	
	Example:
	Q: "Turn on the lights and turn off the lights"
	A: ["Turn on the lights", "Turn off the lights"]

	Q: "Switch off the lights and then play some music"
	A: ["Switch off the lights", "Play some music"]

	Q: "I am feeling sad today, play some music"
	A: ["Play some cheerful music"]

	Q: "{command_text}"
	A:
```

This prompt gives the model a few examples to increase the generation accuracy, along with instructing it to return a Python list. 


#### Ze Code

```python
import openai

from os import getenv

openai.api_key = getenv("OPENAI_KEY")
engine = "text-davinci-003"

def execute_with_llm(command_text: str) -> None:
	llm_prompt = f"""You are provided with multiple commands as a single command. Break down all the commands and return them in a list of strings. If you are provided with a single command, return a list with a single string, trying your best to understand the command.
	
	Example:
	Q: "Turn on the lights and turn off the lights"
	A: ["Turn on the lights", "Turn off the lights"]

	Q: "Switch off the lights and then play some music"
	A: ["Switch off the lights", "Play some music"]

	Q: "I am feeling sad today, play some music"
	A: ["Play some cheerful music"]

	Q: "{command_text}"
	A: 
	"""

	completion = openai.Completion.create(engine=engine, prompt=llm_prompt, max_tokens=len(command_text.split(" "))*2)

	for task in eval(completion.choices[0].text): # NEVER EVAL IN PROD RIGHT LIKE THIS
		execute_command(task)
```


### Gluing together code

To finish it all off, we can use argparse to only send the input command to OpenAI when asked to do so.

```python
import argparse

if __name__ == "__main__":
	parser = argparse.ArgumentParser()
	parser.add_argument("command", nargs="?", type=str, help="The command to pass to Siri", default="What time is it?")
	parser.add_argument('--openai', action=argparse.BooleanOptionalAction, help="Use OpenAI to detect multiple intents", default=False)
	args = parser.parse_args()

	if args.openai:
		execute_with_llm(args.command)
	else:
		execute_command(args.command)
```

## Conclusion

Siri is still dumb. When I ask it to `Switch off the lights`, it default to the home thousands of miles away. But, this code snippet definitely does work!