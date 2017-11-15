/*
	Component Name: get_batch_folder
	Author: William Dowling
	Creation Date: 14 November, 2017
	Description: 
		prompt the user for a batch folder
	Arguments
		none
	Return value
		folder object

*/

function getBatchFolder()
{
	return new Folder("~/Desktop/").selectDlg("Choose a folder to batch.");
}