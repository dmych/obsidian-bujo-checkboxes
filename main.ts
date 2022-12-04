import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface BujoCheckboxesSettings {
    availableCheckboxes: '';
}

const availableMarks = '/x-<>!?*"lbiSIpcfkwud';

const DEFAULT_SETTINGS: BujoCheckboxesSettings = {
    availableCheckboxes: availableMarks
}

export default class BujoCheckboxes extends Plugin {
	settings: BujoCheckboxesSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
		    id: 'toggle-bujo-checkboxd',
		    name: 'Toggle BuJo Checkbox',
		    editorCallback: (editor: Editor, view: MarkdownView) => {
			console.log('toggle bujo checkbox');
			this.toggleTodos(editor, true);
			},
		    hotkeys: [
			{
			    modifiers: ["Mod"],
			    key: ".",
			},
		    ],

		});
		this.addSettingTab(new BuJoSettingTab(this.app, this));

	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    getSelectedText(editor) {
        if (editor.somethingSelected()) {
            // Toggle to-dos under the selection
            var cursorStart = editor.getCursor('from');
            var cursorEnd = editor.getCursor('to');
	    console.log('cursor: '+cursorStart+':'+cursorEnd);
            var content = editor.getRange({ line: cursorStart.line, ch: 0 }, { line: cursorEnd.line, ch: editor.getLine(cursorEnd.line).length });
	    console.log('selection: '+content);
            return {
                start: { line: cursorStart.line, ch: 0 },
                end: {
                    line: cursorEnd.line,
                    ch: editor.getLine(cursorEnd.line).length,
                },
                content: content,
            };
        }
        else {
            // Toggle the todo in the line
            var lineNr = editor.getCursor().line;
            var contents = editor.getDoc().getLine(lineNr);
            var cursorStart = {
                line: lineNr,
                ch: 0,
            };
            var cursorEnd = {
                line: lineNr,
                ch: contents.length,
            };
            var content = editor.getRange(cursorStart, cursorEnd);
	    console.log('cursor: '+cursorStart+':'+cursorEnd+' content: '+content);
            return { start: cursorStart, end: cursorEnd, content: content };
        }
    }
    
    doReplaceTodoElement(startText, optionList)
    {
	// var optionList = ' '+this.settings.availableCheckboxes;
	console.log('replace: '+startText+' options: '+optionList);
	if (startText === '') {
	    startText = '- ';
	}
	else if (startText === '- ') {
	    startText = '- [ ] '
	}
	else {
	    optionList = ' ' + optionList;
	    for (let i=0; i < optionList.length; i++) {
		var next = (i+1) % optionList.length;
		if (startText === "- [" + optionList[i] + "] ") {
		    startText = '- [' + optionList[next] + '] ';
		    break;
		}
	    }
	}
	console.log('new startText: "'+startText+'"');
	return startText;
    }
    replaceTodoElement = (match, spaces, startText, sentence) => {
	var replacement = this.doReplaceTodoElement(startText, this.settings.availableCheckboxes);
	console.log('spaces: "'+spaces+'" startText: "'+startText+'" sentence: "'+sentence+'"');
	console.log('replacement: '+replacement);
	return spaces + replacement + sentence;
    }

    toggleTodos(editor, toggle) {
        var re = /(^\s*|^\t*)(-\s\[ \]\s|-\s\[.\]\s|\*\s|-\s|\d*\.\s|\*\s|\b|^)([^\n\r]*)/gim;
	console.log("toggle: "+toggle);
	console.log("editor: "+editor);
	var optionList = availableMarks;
	if (toggle)
	    optionList = this.settings.availableCheckboxes;
	console.log("available list: "+optionList);
        var selection = editor.somethingSelected();
	console.log('selection: '+selection);
        var selectedText = this.getSelectedText(editor);
	console.log('selectedTest: ' +selectedText.content);
        var newString = selectedText.content.replace(re, this.replaceTodoElement);
        editor.replaceRange(newString, selectedText.start, selectedText.end);
        // Keep cursor in the same place
        if (selection) {
            editor.setSelection(selectedText.start, {
                line: selectedText.end.line,
                ch: editor.getLine(selectedText.end.line).length,
            });
        }

    }

}

class BuJoSettingTab extends PluginSettingTab {
	plugin: BujoCheckboxes;

	constructor(app: App, plugin: BujoCheckboxes) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

	    containerEl.createEl('h2', {text: 'BuJo Checkboxes Settings'});
		new Setting(containerEl)
		.setName('Available Checkboxes')
		.setDesc('')
		.addText(text => text
		    .setPlaceholder(availableMarks)
		    .setValue(this.plugin.settings.availableCheckboxes)
		    .onChange(async (value) => {
			if (value === "")
			    value = availableMarks;
			console.log('checkboxes: ' + value);
			this.plugin.settings.availableCheckboxes = value;
			await this.plugin.saveSettings();
		    }));
	}
}
