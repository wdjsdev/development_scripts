function container()
{
	function getDescriptions()
	{
		var valid = true;
		srcDoc = app.activeDocument;
		var srcLayers = srcDoc.layers;
		var srcDesc = srcLayers[0];
		var newDescriptions = [];
		if(srcDesc.name.indexOf("FD") > -1 || srcDesc.name.indexOf("PS") > -1)
		{
			alert("Please make a new layer at the top of the layers panel and put your new text frames in that new layer.");
			valid = false;
		}

		if(valid)
		{
			var len = srcDesc.textFrames.length;
			for(var x=0;x<len;x++)
			{
				newDescriptions.push(srcDesc.textFrames[x]);
			}
			if(!newDescriptions.length)
			{
				valid = false;
				alert("No new text frames were found..");
			}
		}
		if(valid)
		{
			return newDescriptions;
		}
		else
		{
			return false;
		}
	}
	function addDescriptions()
	{
		var result = true;
		var docRef = app.activeDocument;
		var layers = docRef.layers;
		var infoLay = getInfoLay(layers);
		if(infoLay)
		{
			infoLay.locked = false;
			//duplicate the new text frames into position
			//on the information layer.
			var len = newDescriptions.length;
			for(var x=0;x<len;x++)
			{
				newDescriptions[x].duplicate(infoLay);
			}
		}
		else
		{
			alert("Failed to find the information layer for the document: " + docRef.name);
			result = false;
		}
		return result;
	}

	function batch()
	{
		var batchFiles = [];
		var batchFolder = new Folder("~/Desktop/");
		batchFolder = batchFolder.selectDlg("Select the folder you want to batch.");
		if(!batchFolder)
		{
			return;
		}
		var files = batchFolder.getFiles();
		var len = files.length;

		for(var x=0;x<len;x++)
		{
			if(files[x].name.indexOf(".ai")>-1 && files[x].name.indexOf(".ait") === -1 && files[x].name !== srcDoc.name)
			{
				app.open(files[x]);
				batchFiles.push(app.activeDocument);
			}
		}
		if(!batchFiles.length)
		{
			alert("No files were found in the folder you selected. Make sure the file extensions are .ai and not .ait");
		}
		else
		{
			len = batchFiles.length;
			//run the batch
			for(var x=len-1;x>=0;x--)
			{
				batchFiles[x].activate();
				if(!addDescriptions())
				{
					batchFiles.splice(x,1);
				}
			}
			//save and close;
			for(var x=len -1;x>=0;x--)
			{
				batchFiles[x].activate();
				app.activeDocument.close(SaveOptions.SAVECHANGES);
			}

		}
	}

	function getInfoLay(layers)
	{
		var result;
		var len = layers.length;
		for(var x=0;x<len && !result;x++)
		{
			var curLay = layers[x];
			if(curLay.layers.length && curLay.layers["Information"])
			{
				result = curLay.layers["Information"];
			}
		}
		return result;
	}

	var srcDoc;

	var newDescriptions = getDescriptions();

	if(newDescriptions)
	{
		batch();
	}
	

}
container();