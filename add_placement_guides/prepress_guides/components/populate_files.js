/*
	Component Name: populate_files
	Author: William Dowling
	Creation Date: 13 November, 2017
	Description: 
		populate the global batchFiles array
	Arguments
		none
	Return value
		void

*/

function populateFiles()
{
	var len = app.documents.length;
	for(var x=len-1;x>0;x--)
	{
		batchFiles.push(app.documents[x]);
	}
}