/*
	Component Name: save_and_close
	Author: William Dowling
	Creation Date: 14 November, 2017
	Description: 
		loop the batchFiles array and save/close each file
	Arguments
		none
	Return value
		void

*/

function saveAndClose()
{
	var len = batchFiles.length;
	for(var x=len-1;x>=0;x--)
	{
		batchFiles[x].activate();
		app.executeMenuCommand("fitin");
		batchFiles[x].close(SaveOptions.SAVECHANGES);
	}
}