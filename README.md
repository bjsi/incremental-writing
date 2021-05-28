# Obsidian Incremental Writing Plugin

This plugin allows you to do [incremental writing](https://supermemo.guru/wiki/Incremental_writing) in Obsidian. In incremental writing you add notes and blocks to prioritised queues to be reviewed incrementally over time.

To learn more about the ideas behind incremental writing, check out [this video I made](https://youtu.be/LLS_8Y744lk).

To learn the basic features of the Obsidian incremental writing plugin, check out the [getting started video](https://youtu.be/bFF3umvXydQ).

To learn about the more advanced features like using multiple queues, check out [this video](https://youtu.be/onvKkHQfOzU).

### Support

I want to put all of my energy into these projects and work on them full time! I also want to keep as much of my content open source and freely available as possible. That those seeking knowledge may find it!

If you would like to support my work, I have a [Patreon page](https://www.patreon.com/experimental_learning) with rewards for each tier or you can [buy me a coffee](https://www.buymeacoffee.com/experilearning).

## Using the plugin

### Notes

- This plugin adds a button to the search pane using private Obsidian APIs which could cause the plugin to break when Obsidian updates until I have time to fix it.
- If you are using Vim mode, adding a block to the queue must be done with a hotkey because using ctrl+p to open the command palette causes the cursor to move up a line, so the wrong block will get added.
- If you have installed the nldates plugin, you can use natural language when you are asked to provide a date eg. "tomorrow" or "in two weeks".

There are currently 10 hotkey / command palette commands and a couple of buttons and context menu commands.

1. Load a queue: The plugin supports multiple queues that you can switch between using a fuzzy search menu. The fuzzy menu searches in the queue folder specified in the settings.
2. Open queue in current pane: Open the currently loaded queue in the current pane. Toggle to preview mode to see it formatted correctly.
3. Open queue in new pane: Open the currently loaded queue in a new pane. Toggle to preview mode to see it formatted correctly.
4. Add note to queue: Adds the current note to the current incremental writing queue.
5. Add block to queue: Adds the current block to the current incremental writing queue.
6. Current repetition: Goes to the current repetition for the loaded queue.
7. Next repetition: Goes to the next repetition for the loaded queue.
8. Dismiss current repetition: Dismiss the current repetition from the queue. This note or block will not show up again for review.
9. Add links within the current note to a queue: Add any links to other notes within the current note to a queue.
10. Add note to queue through a fuzzy finder

You can also add the output from an inbuilt search to a queue. Do a search and click the button at the top of the search pane to try it out.

You can also right click on folders, files and links to add them to queues through the context menu.

## Scheduling Options

There are currently two scheduling styles to choose from: A-Factor and Simple.

### Simple

When you hit next repetition, the current repetition gets pushed to the end of the queue.

### A-Factor

When you hit next repetition, the interval between repetitions gets multiplied by the A-Factor to work out the next repetition date.
