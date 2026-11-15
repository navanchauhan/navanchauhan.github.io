---
date: 2026-11-14 20:00
description: Teaching Claude to farm Clash of Clans with OCR, template matching, and a deterministic game harness.
tags: AI, Projects, Gaming
---

# Making Claude Play with my CoC

While editing this post, I realised this sounds more like some of the online recipe websites where they post a story about how the recipe the reader was about to read had been in their generations for centuries, and it was their great pleasure to now share. I first played Clash of Clans (CoC) in middle school, on an iPod Touch. Back then, we had to use resources to train troops and would have to wait before we could attack. I don’t even think we had heroes in the game around that time. All of this to show that a lot has changed in the world since the first day I played with my CoC. These days, we have figured out how to teach sand to play with computers. So, why not get Claude on my base?

Some CoC purists might say that this is part of the grind. The gruelling weeks and months of farming and then upgrading the walls are the point. That CoC might be a way of life. But to them I say: Well, I did it because I could. I remember the global chat in CoC. I think I deserve to have some fun with my CoC and face the repercussions. 

One thing I will say is that using this in a competitive manner to gain a competitive advantage in a real competition, in my opinion, goes against the spirit of the game. And this is coming from a guy who doesn’t really get competitive gaming and has never been interested in and would much rather get VAC banned trying to mod games than actually put the same amount of hours in getting better.

One day, the models will get better and to the point you can just tell them to use computer use to play with your CoC, but that day isn’t today (or as of writing this). Real-time strategy games require real-time decision-making or super-fast algorithms, or some other kind of trick. I actually started this project by trying to see if I could use the new computer use in ChatGPT Codex and see what they could do. 

I remembered using BlueStacks in the good ol’ days and was pleasantly surprised to see that it still existed. It is an Android emulator that is optimised for playing games on the desktop. So, I fired it up, installed CoC, set everything up, and then let the model play with it.

Okay, so the computer use stuff relies on accessibility trees to expose things to the models, and if that doesn’t exist, well, it will rely on native screenshots and then telling where to point and where to drag and click.

But the main issue was that they were taking too long between their decisions and turns to actually be of any use. The three-minute timer actually ran out before the model would even figure out how to deploy troops and where to place them. So, now we had a fun problem that we couldn’t simply one-shot with a basic ask, and we would have to think about this a bit. Too slow; message received. Would ADB help speed things up? By itself, probably not, but what if we made a bunch of things around it? This thing knew a lot of stuff about Clash of Clans but could not reliably drop a goblin to farm resources.

So, clearly, this problem as it stood was too big for a simple agent loop. The obvious next step was to formulate a harness for the game. Thinking about the problem, what did we exactly want to do? We just wanted to be able to use a pre-computed army (the sneaky goblin army) to look for opponents, deploy troops, and then, once the resources were full, upgrade walls in batches and then keep doing this until all the walls were upgraded. I also found out that Google Play Games on PC existed, and it was the official way of playing with your CoC on PC.

The sneaky goblin strategy relies on the fact that the sneaky goblins are invisible for the first few seconds and are attracted towards resources. This makes them very convenient when you just want to farm and don’t really care about how many stars you get.  

So now we have an actual achievable objective: instead of just “upgrade all my walls”, it becomes “be able to scout bases and then deploy an army on a loop.” Sweet, we have moved one level of abstraction now.

Now, the OCR engine is responsible for recognising the current game state. How much loot do we have right now? What buttons are active, and what are their positions? Did the game disconnect, and do we have to reload the game first? When we are scouting a base, how much loot does the base have? Where is the button responsible for going to the next base?  After the battle ends, where is the button to go back to the base? In the builder menu, where is the option to upgrade the walls? How many walls are left? What level are they on? How do we go from these pixels to text?

![Saved scout before and after general OCR, with numbered text boxes](/assets/coc/coc-evidence-04-ocr-before-after.png)

*The same saved scout before and after an offline RapidOCR pass. Cyan quadrilaterals are returned text boxes; the numbered table contains the actual recognised strings and scores.*

![Loot crops, white-pixel masks and segmented digit prototypes](/assets/coc/coc-evidence-01-digit-pipeline.png)

*The fast number-reader pipeline on that scout: raw loot crop → white/pale pixel mask → separated glyphs normalised to 12 × 18 → prototype matches. Actual outputs are 1,837,639 gold, 1,838,410 elixir and 11,377 dark elixir. Scenery can survive the pixel mask; baseline, height and glyph-match checks reject it.*

![Chosen scout frame with loot totals and troop cards](/assets/coc/coc-004-scout-chosen.png)

*A base selected during a run: 1,837,639 gold, 1,838,410 elixir and 11,377 dark elixir available. This shows the available resources that we can loot from our opponent. The current storage is depicted on the top-right.*

We also detect and identify where the Town Hall is on a scout base and where the army cards are by using template matching. 

![Loot reading regions, Town Hall template box and army-card windows](/assets/coc/coc-evidence-02-bounding-boxes.png)

*Cyan rectangles mark the configured loot-reading regions; yellow marks the matched Town Hall template (TH18, match score 0.647); pink marks located card windows.* 

![Army bar and extracted Goblin, Jump and Invisibility cards](/assets/coc/coc-evidence-03-army-crops.png)

*The bottom-bar search region and the located Goblin, Jump and Invisibility card crops. The count reader uses each card’s upper badge. Card positions come from the saved frame rather than assuming* every army has the same slot order, since special events *sometimes add event troops.*

Okay, so now we have a harness that can get us the correct game state and lets you deploy troops and click on buttons, but how do we know where we can actually deploy the troops? We try candidate perimeter points, step outwards, and then keep a point when the Goblin count reads lower afterwards. We don’t infer a complete legal-ground map just yet. Basically, we filter based by loot → probe possible Town Hall entry → Deploy Heroes and time Goblin/spell waves → Surrender after damage stalls / Round ends → Return home → Optionally upgrade walls → Repeat

![Red boundary segmentation, HUD exclusions, candidate points and accepted probes](/assets/coc/coc-evidence-05-deployment-zones.png)

*Top: magenta highlights red/orange boundary candidates from earlier segmentation prototypes; walls, scenery and UI also trigger it, so its legal-side mask remains entirely unknown. Bottom: red excludes HUD regions, yellow shows fixed geometry and candidate deployment points, and green shows 13 accepted probe events from this raid’s log. Those green outcomes were observed later in the raid and are overlaid on its scout for context.*

![Historical rejected and accepted troop-deployment points](/assets/coc/coc-evidence-07-accepted-rejected.png)

![Wall upgrade confirmation showing a seven million gold total](/assets/coc/coc-wall-batch-dialog.png)

*A saved regression fixture shows the bulk wall-upgrade confirmation for 7,000,000 gold. This documents the confirmation screen the upgrader checks; it is not evidence by itself that the purchase completed.*

Wait, so if all of this is being run by deterministic scripts that are calculating all of these things on the fly, what is even the reason for having Claude (or any other LLM) here? It was just a hook to reel you in to read about “classical” machine learning. But Claude does have its uses. In the middle of this experiment, Supercell decided to give the app a new UI overhaul, which meant, technically, all of the OCR scripts and custom frames were broken now! But this is where the agent shines. Claude is able to recognise when the deterministic script fails and come into play and fix and train models as needed.

![September and November scout interfaces before and after the redesign](/assets/coc/coc-evidence-06-ui-before-after.png)

*Top: a saved September scout from the first Play Games farm run. Bottom: a November scout after the October redesign.* 

![Post-redesign loot fixture and corrected recognition output](/assets/coc/coc-evidence-08-redesign-fix.png)

*The documented redesign failure read 293,767 gold as 4,911,074. Replaying the current reader on the saved stone/scenery regression fixture returns 293,767 gold, 191,314 elixir and 1,455 dark elixir. The fix recentered loot windows and learned new digit prototypes on its own.*

And then what? Did this farm? Yes, it did. I can now send a remote message to a Claude Code / Codex session saying “farm and max resources”, and before I even get home to look at my base, all the resources are maxed out. This is only one part of the game, though. You still have to wait for other things.

A random session excerpt (`captures/raids/fill-20261111b.log`):

```text
after 23 raid(s), 40.1 min: {'gold': 21368097, 'elixir': 19710190, 'dark': 154538}
storages full: stopping after 23 raid(s): {'gold': 29000000, 'elixir': 31000000}
```

Is this the best we can do? In the Builder Base the best way to maximise the loot is by getting the daily record, which you in turn do by getting the required stars. This means you can no longer rely on just spamming an attack, or, can you?

The home-village farm can lose a battle and still do its job of coming back with actual loot. Builder Base makes the stars part of the objective. There are also two maps to get through. Clearing the first one is only half the attack.

The staged plan starts with the Battle Machine and P.E.K.K.A, waits, then puts the Bomber behind them. Electrofire Wizards go down at separate points along the edge, and the Hog Gliders follow after a delay. The intent is to get the tougher units in front before the rest arrive. The script also taps my Battle Machine’s ability automagically while watching the battle.

After the first map is cleared, there is another preparation screen and another set of reinforcement cards. The harness waits for the second map, throws away the entry points it remembered from the first, and runs the staged deployment again.

![Builder Base preparation, second-map reinforcements and the matching result](/assets/coc/coc-09-builder-stages.png)

The saved batch from my logs gives a more useful picture than one good screenshot. Its 38 completed attack logs total 151 stars, an average of 3.97 stars per attack, and 4,621,000 reported builder gold. Twelve attacks reached six stars; others did much worse, including one zero-star result.

This just goes to show how you can pretty much break any problem that involves running something on a computer and reshape it in such a way that agents nowadays can help you solve it, even if the agents aren’t driving all of the actions themselves. 

I don’t think I would have ever thought as a kid that we would be able to have a thing on our machines that could play with our CoCs. Was this worth the hours I spent trying to figure out the best strategies to get this to work? Probably not. Would I do this again? Heck yeah! Because why not?

