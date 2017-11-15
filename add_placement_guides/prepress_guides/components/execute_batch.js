/*
	Component Name: execute_batch
	Author: William Dowling
	Creation Date: 14 November, 2017
	Description: 
		loop the filesToBatch array and add the prepress guides to each doc
	Arguments
		none
	Return value
		void

*/

function executeBatch()
{
	var len = batchFiles.length;
	for(var x=len-1;x>=0;x--)
	{
		batchFiles[x].activate();
		if(!addPrepressGuides())
		{
			errorList.push("Failed to process the file: " + batchFiles[x].name);
			batchFiles.splice(x,1);
		}
	}
}