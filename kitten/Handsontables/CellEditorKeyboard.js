alert("HI");
cell_editor.commands.addCommand({
	name: 'enter_break',
	bindKey: {win: 'Enter',  mac: 'Enter'},
	exec: function(editor) {
		editor.session.insert(editor.getCursorPosition(), "<br>\n");
	},
	readOnly: true // false if this command should not apply in readOnly mode
});
cell_editor.commands.addCommand({
	name: 'enter_bold',
	bindKey: {win: 'Ctrl-B',  mac: 'Command-B'},
	exec: function(editor) {
		editor.session.insert(editor.getCursorPosition(), "<b>");
		custom_alert("You need to add &lt;/b&gt; to stop using bold");
	},
	readOnly: true // false if this command should not apply in readOnly mode
});
cell_editor.commands.addCommand({
	name: 'enter_italics',
	bindKey: {win: 'Ctrl-I',  mac: 'Command-I'},
	exec: function(editor) {
		editor.session.insert(editor.getCursorPosition(), "<em>");
		custom_alert("You need to add &lt;em&gt; to stop using italics");
	},
	readOnly: true // false if this command should not apply in readOnly mode
});
cell_editor.commands.addCommand({
	name: 'enter_underline',
	bindKey: {win: 'Ctrl-U',  mac: 'Command-U'},
	exec: function(editor) {
		editor.session.insert(editor.getCursorPosition(), "<u>");
		custom_alert("You need to add &lt;u&gt; to stop using underline");
	},
	readOnly: true // false if this command should not apply in readOnly mode
});