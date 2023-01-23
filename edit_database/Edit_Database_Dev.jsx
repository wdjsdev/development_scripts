#target Illustrator
function editDatabase ()
{
	var valid = true;
	var scriptName = "edit_database";

	app.coordinateSystem = CoordinateSystem.DOCUMENTCOORDINATESYSTEM;

	function getUtilities ()
	{
		var utilNames = [ "Utilities_Container" ]; //array of util names
		var utilFiles = []; //array of util files
		//check for dev mode
		var devUtilitiesPreferenceFile = File( "~/Documents/script_preferences/dev_utilities.txt" );
		function readDevPref ( dp ) { dp.open( "r" ); var contents = dp.read() || ""; dp.close(); return contents; }
		if ( devUtilitiesPreferenceFile.exists && readDevPref( devUtilitiesPreferenceFile ).match( /true/i ) )
		{
			$.writeln( "///////\n////////\nUsing dev utilities\n///////\n////////" );
			var devUtilPath = "~/Desktop/automation/utilities/";
			utilFiles = [ devUtilPath + "Utilities_Container.js", devUtilPath + "Batch_Framework.js" ];
			return utilFiles;
		}

		var dataResourcePath = customizationPath + "Library/Scripts/Script_Resources/Data/";

		for ( var u = 0; u < utilNames.length; u++ )
		{
			var utilFile = new File( dataResourcePath + utilNames[ u ] + ".jsxbin" );
			if ( utilFile.exists )
			{
				utilFiles.push( utilFile );
			}

		}

		if ( !utilFiles.length )
		{
			alert( "Could not find utilities. Please ensure you're connected to the appropriate Customization drive." );
			return [];
		}


		return utilFiles;

	}
	var utilities = getUtilities();

	for ( var u = 0, len = utilities.length; u < len && valid; u++ )
	{
		eval( "#include \"" + utilities[ u ] + "\"" );
	}

	if ( !valid || !utilities.length ) return;

	DEV_LOGGING = user === "will.dowling";



	logDest.push( getLogDest() );






	///////Begin/////////
	///Logic Container///
	/////////////////////


	function displayDialog ()
	{

		var w = new Window( "dialog", "Database Editor" );
		var inputGroup = UI.group( w );
		inputGroup.orientation = "column";
		var gcGroup = UI.group( inputGroup );
		var gcMsg = UI.static( gcGroup, "Garment Code: " );
		gcInput = UI.edit( gcGroup, "FD-####", 10 );
		gcInput.active = true;
		gcInput.addEventListener( "keyup", function ( k )
		{
			gcInput.text = gcInput.text.replace( "_", "-" );

			if ( prepressInfo[ gcInput.text ] )
			{
				populateFields( gcInput.text );
			}
			else
			{
				emptyFields();
			}
		} );

		var msGroup = UI.group( inputGroup );
		var msMsg = UI.static( msGroup, "Mockup Size: " );
		msInput = UI.edit( msGroup, "", 7 );

		var sflGroup = UI.group( inputGroup );
		var sflMsg = UI.static( sflGroup, "Scale Front Logo: " );
		sflInput = UI.edit( sflGroup, "", 7 );

		var sGroup = UI.group( inputGroup );
		var sMsg = UI.static( sGroup, "Sizes: " );
		sInput = UI.edit( sGroup, "", 50 );

		var wsGroup = UI.group( inputGroup );
		var wsMsg = UI.static( wsGroup, "Waist Sizes: " );
		wsInput = UI.edit( wsGroup, "", 50 );

		var pGroup = UI.group( inputGroup );
		var pMsg = UI.static( pGroup, "Pieces: " );
		pInput = UI.edit( pGroup, "", 50 );

		var aGroup = UI.group( inputGroup );
		var aMsg = UI.static( aGroup, "Art Locations: " );
		aInput = UI.edit( aGroup, "", 50 );

		var rGroup = UI.group( inputGroup );
		rGroup.orientation = "column";
		var rMsg = UI.static( rGroup, "Rotation" );
		var rg1 = UI.group( rGroup );
		rg1.orientation = "row"
		var rg1AngleMsg = UI.static( rg1, "Angle: " );
		rg1AngleInput = UI.edit( rg1, "", 5 );
		var rg1PieceMsg = UI.static( rg1, "Pieces: " );
		rg1PieceInput = UI.edit( rg1, "", 50 );

		var rg2 = UI.group( rGroup );
		rg2.orientation = "row"
		var rg2AngleMsg = UI.static( rg2, "Angle: " );
		rg2AngleInput = UI.edit( rg2, "", 5 );
		var rg2PieceMsg = UI.static( rg2, "Pieces: " );
		rg2PieceInput = UI.edit( rg2, "", 50 );


		var btnGroup = UI.group( w );
		var cancel = UI.button( btnGroup, "Cancel", function ()
		{
			w.close();
		} )
		var submit = UI.button( btnGroup, "Submit", function ()
		{
			if ( validate() )
			{
				w.close();
				overwriteDbEntry()
			}
		}, { name: "ok" } )

		w.show();
	}

	function emptyFields ()
	{
		msInput.text = "";
		sInput.text = "";
		sflInput.text = "";
		wsInput.text = "";
		pInput.text = "";
		aInput.text = "";
		rg1AngleInput.text = rg1PieceInput.text = "";
		rg2AngleInput.text = rg2PieceInput.text = "";
	}

	function populateFields ( gc )
	{
		var data = prepressInfo[ gc ];
		var btData = templateInfo[ gc ];



		msInput.text = data.mockupSize;
		sInput.text = btData.sizes.join( "," );
		sflInput.text = data.scaleFrontLogo;
		if ( btData.waist )
		{
			wsInput.text = btData.waist.join( "," );
		}
		pInput.text = btData.pieces.join( "," );
		aInput.text = btData.artLayers.join( "," );

		if ( data.rotate && data.rotate.length )
		{
			rg1AngleInput.text = data.rotate[ 0 ].angle;
			rg1PieceInput.text = data.rotate[ 0 ].pieces.join( "," );
			if ( data.rotate.length === 2 )
			{
				rg2AngleInput.text = data.rotate[ 1 ].angle;
				rg2PieceInput.text = data.rotate[ 1 ].pieces.join( "," );
			}
		}

	}

	function validate ()
	{
		var result = true;
		var gcPat = /^[a-z]*-[\d]*[a-z]?$/i;
		var errorMsg = "Error:";

		if ( !gcInput.text || !gcPat.test( gcInput.text ) )
		{
			result = false;
			errorMsg += "\nInvalid garment code.";
		}

		if ( !msInput.text )
		{
			result = false;
			errorMsg += "\nPlease enter a mockup size.";
		}

		if ( !sInput.text )
		{
			result = false;
			errorMsg += "\nPlease enter a the necessary sizes.";
		}

		if ( !pInput.text )
		{
			result = false;
			errorMsg += "\nPlease enter the necessary piece names.";
		}


		if ( !prepressInfo[ gcInput.text ] || !templateInfo[ gcInput.text ] )
		{
			result = false;
			errorMsg += "\nCouldn't find the garment code \"" + gcInput.text + "\" in the database.";
		}

		if ( !result )
		{
			alert( errorMsg );
		}

		return result;
	}


	function overwriteDbEntry ()
	{
		var pi = prepressInfo[ gcInput.text ];
		var bti = templateInfo[ gcInput.text ];

		if ( !pi || !bti )
		{
			alert( "No database entry found for " + gcInput.text );
			return;
		}

		var result;
		result = {};
		result.mockupSize = msInput.text;
		result.gc = gcInput.text.replace( "_", "-" );
		result.sizes = cleanupInput( sInput.text );
		result.pieces = cleanupInput( pInput.text );
		result.artLayers = cleanupInput( aInput.text );
		result.scaleFrontLogo = sflInput.text.toLowerCase().indexOf( "true" ) > -1 ? true : false;


		if ( wsInput.text !== "" )
		{
			result.waist = cleanupInput( wsInput.text );
		}

		if ( rg1AngleInput.text !== "" && rg1PieceInput !== "" )
		{
			result.rotate = [ { angle: rg1AngleInput.text, pieces: cleanupInput( rg1PieceInput.text ) } ]
		}

		if ( rg2AngleInput.text !== "" && rg2PieceInput !== "" )
		{
			if ( !result.rotate ) result.rotate = [];
			result.rotate.push( { angle: rg2AngleInput.text, pieces: cleanupInput( rg2PieceInput.text ) } );
		}





		//saved the new data to a temp object
		//now input those values into the datbases

		//overwrite data
		bti.mockupSize = pi.mockupSize = result.mockupSize;
		pi.scaleFrontLogo = result.scaleFrontLogo;
		bti.pieces = pi.pieces = result.pieces;
		bti.sizes = result.sizes;
		bti.artLayers = result.artLayers;

		if ( result.rotate )
		{
			pi.rotate = JSON.parse( JSON.stringify( result.rotate ) );
			bti.rotate = JSON.parse( JSON.stringify( result.rotate ) );
			for ( var r = 0; r < bti.rotate.length; r++ )
			{
				bti.rotate[ r ].angle *= -1;
			}
		}
		else
		{
			pi.rotate = bti.rotate = [];
		}


		if ( pi.updatedOn )
		{
			if ( typeof pi.updatedOn === "string" )
			{
				pi.updatedOn = [ pi.updatedOn ];
			}
		}
		else
		{
			pi.updatedOn = [];
		}

		if ( bti.updatedOn )
		{
			if ( typeof bti.updatedOn === "string" )
			{
				bti.updatedOn = [ bti.updatedOn ];
			}
		}
		else
		{
			bti.updatedOn = [];
		}

		pi.updatedOn.push( logTime() );
		bti.updatedOn.push( logTime() );
		bti.updatedBy = pi.updatedBy = user;

		writeDatabase( clPath, "var prepressInfo = " + JSON.stringify( prepressInfo ) );
		writeDatabase( btPath, "var templateInfo = " + JSON.stringify( templateInfo ) );

		alert( "Successfully updated the database." );
	}


	function cleanupInput ( string )
	{
		return string.replace( /^[\s,]*|[\s,]*$/g, "" ).replace( /\s*,\s*/g, "," ).split( "," );
	}



	////////End//////////
	///Logic Container///
	/////////////////////

	/*****************************************************************************//*****************************************************************************/
	/*****************************************************************************//*****************************************************************************/
	/*****************************************************************************//*****************************************************************************/
	/*****************************************************************************//*****************************************************************************/

	///////Begin////////
	////Data Storage////
	////////////////////

	var clPath = dataPath + "central_library.js";
	var btPath = dataPath + "build_template_library.js";
	eval( "#include \"" + clPath + "\"" );
	eval( "#include \"" + btPath + "\"" );

	var library = prepressInfo;

	////////End/////////
	////Data Storage////
	////////////////////

	/*****************************************************************************//*****************************************************************************/
	/*****************************************************************************//*****************************************************************************/
	/*****************************************************************************//*****************************************************************************/
	/*****************************************************************************//*****************************************************************************/

	///////Begin////////
	///Function Calls///
	////////////////////

	//dialog input variables
	//these are used to get or set
	//the information in these inputs
	//from outside the dialog function
	var gcInput;
	var msInput;
	var sflInput;
	var sInput;
	var wsInput;
	var pInput;
	var aInput;
	var rg1AngleInput;
	var rg2AngleInput;
	var rg1PieceInput;
	var rg2PieceInput;


	displayDialog();

	if ( errorList.length > 0 )
	{
		sendErrors( errorList );
	}

	printLog();
	return valid;

}
editDatabase();