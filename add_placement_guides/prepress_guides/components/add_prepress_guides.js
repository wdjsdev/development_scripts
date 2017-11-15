/*
	Component Name: add_prepress_guides
	Author: William Dowling
	Creation Date: 14 November, 2017
	Description: 
		add a guide to each necessary piece on the prepress layer
		per the guidesToAdd object
	Arguments
		none
	Return value
		success boolean

*/

function addPrepressGuides()
{
	var result = true;

	var docRef = app.activeDocument;
	var layers = docRef.layers;
	var ppLay = getPPLay(layers);
	if(ppLay)
	{
		ppLay.visible = true;
		var len = ppLay.layers.length;
		var curLay,curSize,pieceLen,curPiece;
		var dataLen;
		var newGuide;
		for(var x=0;x<len;x++)
		{
			curLay = ppLay.layers[x];
			curSize = curLay.name;
			pieceLen = curLay.pageItems.length;
			for(var y=0;y<pieceLen;y++)
			{
				curPiece = curLay.pageItems[y];
				curData = guidesToAdd[curSize][curPiece.name];
				if(curData)
				{
					dataLen = curData.length;
					for(var z=0;z<dataLen;z++)
					{
						newGuide = curPiece.pathItems.rectangle(curData[z][0],curData[z][1],curData[z][2],curData[z][3]);
						newGuide.guides = true;
					}
				}
			}
		}
		ppLay.visible = false;
	}

	return result;
}