/*
	Component Name: get_guides
	Author: William Dowling
	Creation Date: 13 November, 2017
	Description: 
		search through the prepress layer of a given
		document and extract any pieces of artwork
		that include the word 'guide' in the name
	Arguments
		document object
	Return value
		object containing guides
		eg.
			{
				"XL":
				{
					"XL Front":[[top,left,width,height],[top,left,width,height]],
					...
				}
			}		

*/

function getGuides(doc)
{
	var result = {};
	var layers = doc.layers;
	var ppLay = getPPLay(layers);
	var layLen = ppLay.layers.length;
	var curLay,curSize,
		subLen,curPiece,
		subPiece,subPieceLen;
	var guidesFound = false;
	for(var x=0;x<layLen;x++)
	{
		curLay = ppLay.layers[x];
		curSize = curLay.name;
		result[curSize] = {};
		subLen = curLay.pageItems.length;
		for(var y=0;y<subLen;y++)
		{
			curPiece = curLay.pageItems[y];
			result[curSize][curPiece.name] = [];
			subPieceLen = curPiece.pageItems.length;
			for(var z=0;z<subPieceLen;z++)
			{
				subPiece = curPiece.pageItems[z];
				if(subPiece.clipped)
				{
					subPiece = subPiece.pageItems[1];
				}
				if(subPiece.name.toLowerCase().indexOf("guide")>-1)
				{
					subPiece.name = curPiece.name + " Guide";
					result[curSize][curPiece.name].push([subPiece.top,subPiece.left,subPiece.width,subPiece.height]);
					guidesFound = true;
				}
			}
			
		}
	}
	if(!guidesFound)
	{
		errorList.push("No prepress guides were found. Please make sure you've added \
			guide boxes to the current document so the script can duplicate them to the other files.");
		result = false;
	}
	return result;
}