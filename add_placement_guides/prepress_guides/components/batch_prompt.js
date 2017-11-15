/*
	Component Name: batch_prompt
	Author: William Dowling
	Creation Date: 13 November, 2017
	Description: 
		prompt the user for how they want to run the batch
	Arguments
		none
	Return value
		void

*/

function batchPrompt()
{
	/* beautify ignore:start */
	var w = new Window("dialog", "Current Document or All Documents?");
		var btnGroup = w.add("group");
		btnGroup.orientation = "column";
			var batchOpen = btnGroup.add("button", undefined, "All Open Documents");
				batchOpen.onClick = function()
				{
					populateFiles();
					executeBatch();
					w.close();
				}
			var getBatchDocs = btnGroup.add("button", undefined, "Open A Folder to Batch");
				getBatchDocs.onClick = function()
				{
					var folder = getBatchFolder();
					batchFiles = openBatchFiles(folder,".ai");
					executeBatch();
					w.close();
				}
			var cancel = btnGroup.add("button", undefined, "Cancel");
				cancel.onClick = function()
				{
					valid = false;
					w.close();
				}
	w.show();
	/* beautify ignore:end */
}