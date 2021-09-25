# Incremental Writing Plugin for Obsidian

This plugin allows you to do [incremental writing](https://supermemo.guru/wiki/Incremental_writing) in Obsidian. In incremental writing you add notes and blocks from your Obsidian vault to prioritised queues to be reviewed incrementally over time.

If you are interested in learning more about this plugin and incremental writing in general, here are some resources you may find useful:

- (Video) [What is Incremental Writing? (Obsidian and SuperMemo)](https://youtu.be/LLS_8Y744lk): A video I made to introduce the concept of incremental writing with examples in Obsidian and SuperMemo.
- (Article) [Incremental Writing: A Summary](https://www.experimental-learning.com/SimpleGuru/IncrementalWriting.md): An article version of the above video.
- (Video) [Obsidian Incremental Writing Plugin: Getting Started](https://youtu.be/bFF3umvXydQ): A video I made to explain the basic features of this plugin.
- (Video) [Obsidian Incremental Writing Plugin: Advanced Stuff](https://youtu.be/onvKkHQfOzU): A video I made to explain some of the advanced features

Also, if you find incremental writing useful, you should definitely check out [incremental reading](https://www.experimental-learning.com/en/SimpleGuru/IncrementalReading)!

### Support

I want to put all of my energy into these projects and work on them full time! I also want to keep as much of my content open source and freely available as possible. That those seeking knowledge may find it!

If you would like to support my work, I have a [Patreon page](https://www.patreon.com/experimental_learning) with rewards for each tier or you can [buy me a coffee](https://www.buymeacoffee.com/experilearning).

## Using the plugin

### Notes

- This plugin adds a button to the search pane using private Obsidian APIs which could cause the plugin to break when Obsidian updates until I have time to fix it.
- The Obsidian API is in early alpha so this plugin could break (temporarily) after an update.
- I strongly recommend installing the [Natural Language Dates](https://github.com/argenos/nldates-obsidian) plugin alongside this plugin because it allows you to use natural language when you are asked to provide a date eg. "tomorrow" or "in two weeks", rather than having to type out a date like "2020-02-02".
- This plugin is not supported on mobile! (yet)

### Important! Priorities

- Confusingly, low priority numbers correspond to high priorities! That means your daily queue of repetitions will be sorted from lowest priority number (most important) to highest priority number (least important). This is because this is the way priorities work in SuperMemo and having used it for a couple years I just got used to thinking about it like that. I didn't realise how confusing this could be until someone mentioned it in an issue. Apologies for any confusion!

### Features

#### Commands

- **Load a queue**: The plugin supports multiple incremental writing queues that you can switch between using a fuzzy search menu. This command uses a fuzzy search component to search in the queue folder specified in the settings for queue files.
- **Open queue in current pane**: Open the currently loaded queue in the current pane. You can check which queue is currently loaded by looking at the status bar at the bottom of the Obsidian window.
- **Open queue in new pane**: Same as above, but open the currently loaded queue in a new pane.
- **Add note to queue**: Adds the active note in Obsidian to the currently loaded incremental writing queue.
- **Add block to queue**: Adds the current block to the currently loaded incremental writing queue.
- **Current repetition**: Goes to the current repetition for the currently loaded queue.
- **Next repetition**: Goes to the next repetition for the currently loaded queue.
- **Edit current repetition data**: Edit the interval, priority, next repetition date or notes for the current repetition.
- **Next repetition and manually schedule**: Executes next repetition and opens a modal for you to edit the next repetition date and interval manually.
- **Dismiss current repetition**: Dismiss the current repetition from the queue. This note or block will not show up again for review.
- **Add links within the current note to a queue**: Add any links to other notes within the current note to a queue.
- **Bulk add blocks with references to queue**: Add all of the blocks with "^references" to an incremental writing queue.
- **Add note to queue through a fuzzy finder**: Opens a fuzzy finder which you can use to add any note in your vault to the current incremental writing queue.
- **Add search results to a queue**: Do a search and click the "Add to IW Queue" button at the top of the search pane to add all of the results to a queue.
- **Add folders, files and links to a queue**: You can also right click on folders, files and links to add them to queues through the context menu.

#### Automatically Add Notes to Queues

There are some options for automatically adding notes to queues.

- **Auto add notes using tags**: In the settings page you can define a list of queue names and associated tags. When you modify a note, the plugin will check to see if a queue tag was added. If so, the note will automatically get added to the queue. This mapping only applies to newly created notes, ie. when you install the plugin it won't automatically add all notes with a given tag to a queue. So the recommended workflow is to begin by searching for all notes with a given tag and adding those to a queue using the "add search results to queue" function (see above). Then you can set up the queue to tag mapping in the settings to make sure that future notes with a given tag get added to the queue.

- **Auto add new notes option**: When toggled on in the settings, new will automatically get added to the default queue. I recommend using the tag method above rather than this because using tags gives you more control over which notes get added and which queue(s) they get added to.

#### Scheduling Options

There are currently two scheduling styles to choose from: A-Factor and Simple.

- **Simple**: When you hit next repetition, the current repetition gets pushed to the end of the queue by setting its priority to 99.
- **A-Factor**: When you hit next repetition, the interval between repetitions gets multiplied by the A-Factor to work out the next repetition date.
