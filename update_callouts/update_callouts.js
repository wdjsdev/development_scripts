

#target Illustrator
#targetengine main

function test ()
{
    var scriptName = "test";
    var valid = true;


    function getUtilities ()
    {
        var utilNames = [ "Utilities_Container", "Batch_Framework" ]; //array of util names
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

    app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
    app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;


    function getSrcFolder ()
    {
        var srcFolder = Folder.selectDialog( "Select a folder to process" );
        if ( !srcFolder || !srcFolder.exists || !srcFolder.getFiles().length )
        {
            return;
        }
        return srcFolder;
    }

    function createSrcFile ( baseFile )
    {
        if ( baseFile )
        {
            app.open( baseFile );
        }
        var srcProdInfoGroup;
        var doc = app.activeDocument;
        var layers = doc.layers;
        var layArray = afc( doc, "layers" );

        layArray.forEach( function ( l )
        {
            if ( !l.pageItems.length && !l.layers.length )
            {
                l.remove();
            }
        } )


        var prepressLayer = layers[ 0 ].layers[ "Prepress" ];
        prepressLayer.locked = false;
        prepressLayer.visible = true;
        var ppls = afc( prepressLayer, "layers" );
        var crosshairGroups = [];
        var srcProdInfoLayer = layers.add();
        srcProdInfoLayer.name = "Prod Info";
        srcProdInfoGroup = srcProdInfoLayer.groupItems.add();
        var prodInfoGroup; //current prod info group inside each garment piece

        var calloutSwatch = findSpecificSwatch( doc, "CALLOUT" ) || makeNewSpotColor( "CALLOUT" );
        var cutlineSwatch = findSpecificSwatch( doc, "CUT LINE" ) || findSpecificSwatch( doc, "CUTLINE" ) || makeNewSpotColor( "CUT LINE" );
        var calloutText = "%ordernumber%";
        var calloutTextSize = 2.5;
        var calloutTextFontName = "ArialMT";
        var calloutTextFont = app.textFonts.getByName( calloutTextFontName );
        var caloutTextColor = calloutSwatch.color;

        //create a callout textFrame and apply the colors and font and blend mode
        //maybe duplicating that will make it faster than creating individual textFrames for each piece
        //update.. yup. way faster
        var srcCalloutLayer = doc.layers.add();
        var srcCalloutFrame = srcCalloutLayer.textFrames.add();
        srcCalloutFrame.contents = calloutText;
        srcCalloutFrame.textRange.characterAttributes.size = calloutTextSize;
        srcCalloutFrame.textRange.characterAttributes.textFont = calloutTextFont;
        srcCalloutFrame.textRange.characterAttributes.fillColor = caloutTextColor;
        srcCalloutFrame.textRange.characterAttributes.baselineShift = .25;



        var digCount = 0;

        var timer = new Stopwatch();
        timer.logStart();

        cleanupCrosshairs();

        makeProdInfoGroup( ppls );

        timer.logEnd();

        prepressLayer.visible = false;
        srcCalloutLayer.remove();

        doc.selection = null;
        var docPath = normalizeLocalFilePath( doc.fullName.toString() );
        doc.saveAs( new File( docPath.replace( ".ai", "_src.ait" ) ) );
        srcDoc = doc;
        return srcProdInfoGroup;


        function makeProdInfoGroup ( ppls )
        {
            ppls.forEach( function ( curSizeLayer )
            {
                curSizeLayer.locked = false;
                curSizeLayer.visible = true;
                afc( curSizeLayer, "groupItems" ).forEach( function ( curPiece )
                {
                    var thrucutPath;
                    prodInfoGroup = curPiece.groupItems.add();
                    prodInfoGroup.name = curPiece.name + " Prod Info";

                    //locate all prod info art and place it into a prod info group
                    dig( curPiece );

                    if ( !prodInfoGroup.pageItems.length )
                    {
                        return;
                    }

                    var crosshairGroup = prodInfoGroup.groupItems.add();
                    crosshairGroup.name = "Crosshairs";

                    //locate all cut line crosshairs and remove any non-crosshair
                    afc( prodInfoGroup, "pageItems" ).forEach( function ( pi )
                    {
                        var piColor = getPathColor( pi );

                        if ( piColor.stroke && piColor.stroke.spot.name.match( /thru-cut/i ) )
                        {
                            prodInfoGroup.thrucut = pi;
                            pi.name = "thru-cut";
                            thrucutPath = pi;
                            return;
                        }

                        if ( piColor.fill && piColor.fill.spot.name.match( /cut[\s]?line/i ) )
                        {
                            if ( analyzeShape( pi ) )
                            {
                                //color is cut line and shape is a crosshair
                                //move it to the crosshair group
                                pi.moveToBeginning( crosshairGroup );
                            }
                            else
                            {
                                //color is cut line but shape is not a crosshair
                                //delete it
                                pi.remove();
                            }
                        }
                    } );

                    makeTextPath( thrucutPath, prodInfoGroup, srcCalloutFrame );

                    prodInfoGroup.duplicate( srcProdInfoGroup );

                } );

            } )
            doc.selection = null;

        }

        function getPathColor ( pathItem )
        {
            var fillColor, strokeColor;
            var testItem;
            if ( pathItem.typename.match( /compoundpathitem/i ) )
            {
                if ( !pathItem.pathItems.length )
                {
                    pathItem = cleanupCompoundPath( pathItem );
                }
                testItem = pathItem.pathItems[ 0 ];

            }
            else
            {
                testItem = pathItem;
            }


            if ( testItem.filled && testItem.fillColor.spot )
            {
                fillColor = testItem.fillColor;
            }
            if ( testItem.stroked && testItem.strokeColor.spot )
            {
                strokeColor = testItem.strokeColor;
            }
            return { fill: fillColor, stroke: strokeColor };
        }

        function cleanupCrosshairs ()
        {
            //expand all crosshairs and unite and ungroup them
            doc.selection = null;
            doc.defaultStrokeColor = cutlineSwatch.color;
            app.executeMenuCommand( "Find Stroke Color menu item" );
            app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
            app.executeMenuCommand( "expandStyle" );
            app.executeMenuCommand( "Expand3" );
            app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;

            doc.selection = null;
        }

        function makeTextPath ( thruCutPath, prodGroup, srcFrame )
        {
            var parentPiece = prodGroup.parent;
            timer.beginTask( "makeTextPath" + parentPiece.name )
            var calloutGroup = prodGroup.groupItems.add();
            calloutGroup.name = "Callouts";
            var textPathPoints = extractLongestLineSegment( thruCutPath );
            if ( !textPathPoints || textPathPoints.length < 2 )
            {
                errorList.push( "Something failed when identifying the thru cut path for " + parentPiece.name );
                return;
            }

            //get the general orientation of the path made by textPathPoints
            //get the slope of the first and last point. if the slope is greater than 1, the path is mostly vertical
            //if the slope is less than 1, the path is mostly horizontal
            var textPathOrientation = Math.abs( ( textPathPoints[ 0 ].anchor[ 1 ] - textPathPoints[ 1 ].anchor[ 1 ] ) / ( textPathPoints[ 0 ].anchor[ 0 ] - textPathPoints[ 1 ].anchor[ 0 ] ) ) > 1 ? "v" : "h";
            //if textPathPoints represents a mostly vertical line, sort the points from top to bottom
            //else sort them left to right
            if ( textPathOrientation === "v" )
            {
                textPathPoints.sort( function ( a, b ) { return a.anchor[ 1 ] < b.anchor[ 1 ] } );
            }
            else
            {
                textPathPoints.sort( function ( a, b ) { return b.anchor[ 0 ] < a.anchor[ 0 ] } );
            }
            timer.beginTask( "makeText_" + parentPiece.name )
            var textPath = calloutGroup.pathItems.add();
            textPath.setEntirePath( textPathPoints.map( function ( p ) { return p.anchor } ) );
            var calloutFrame = calloutGroup.textFrames.pathText( textPath, undefined, undefined, undefined, srcFrame.duplicate(), false );

            calloutFrame.contents = "_" + parentPiece.name + "_" + calloutText;

            if ( parentPiece.name.match( /collar|placard|placket|binding|/i ) )
            {
                calloutFrame.textRange.characterAttributes.size = 1;
                calloutFrame.contents = parentPiece.name.replace( /\s.*/i, "" ) + "_%ordernumber%_";
                // calloutFrame.textRange.characterAttributes.baselineShift = 0;
            }

            calloutFrame.contents = "  " + calloutFrame.contents;
            calloutFrame.blendingMode = BlendModes.LUMINOSITY;

            if ( textPathOrientation === "v" )
            {
                calloutFrame.paragraphs[ 0 ].paragraphAttributes.justification = Justification.RIGHT;
            }

            timer.endTask( "makeText_" + parentPiece.name );

            timer.endTask( "makeTextPath" + parentPiece.name );


        }

        function analyzeColor ( item )
        {
            var testItem = item.duplicate();
            var testPath = testItem;
            if ( item.typename.match( /compoundpathitem/i ) )
            {
                if ( !testItem.pathItems.length )
                {
                    log.l( "cleanup compound path" )
                    testItem = cleanupCompoundPath( testItem );
                }
                testPath = testItem.pathItems[ 0 ];
            }
            if ( testPath.stroked && testPath.strokeColor.spot && testPath.strokeColor.spot.name.match( /thru-cut/i ) )
            {
                testItem.remove();
                item.moveToEnd( prodInfoGroup );
                return;
            }

            if ( itemIsProdColor( testPath ) )
            {
                testItem.remove();
                item.moveToEnd( prodInfoGroup );
                return;

            }

        }

        function dig ( item )
        {
            digCount++;
            if ( item.typename.match( /groupitem/i ) )
            {
                afc( item, "pageItems" ).forEach( function ( curItem )
                {
                    dig( curItem );
                } )
                return;
            }
            if ( item.typename.match( /text/i ) )
            {
                item.remove();
                return;
            }

            analyzeColor( item );

        }

        // Function to check if a set of points forms a crosshair shape
        function analyzeShape ( item )
        {
            return isValidCrosshair( item );

            // Function to calculate the minimum distance between consecutive right angles
            function minDistBetweenRightAngles ( pathItem )
            {
                var pathPoints = afc( pathItem, "pathPoints" );
                var minDist = Number.MAX_VALUE;

                //loop through the pathPoints and build an array of any points that make an angle between 85 and 95 degrees with the previous and next points
                var rightAnglePoints = [];
                pathPoints.forEach( function ( point, i, arr )
                {
                    var prevPoint = arr[ i - 1 < 0 ? arr.length - 1 : i - 1 ];
                    var nextPoint = arr[ i + 1 >= arr.length ? 0 : i + 1 ];
                    var angle = angleBetweenPoints( prevPoint.anchor, point.anchor, nextPoint.anchor );
                    if ( angle > 85 && angle < 95 )
                    {
                        rightAnglePoints.push( point.anchor );
                    }
                } );

                //loop through the rightAnglePoints and calculate the distance between each point and the next
                rightAnglePoints.forEach( function ( point, i, arr )
                {
                    //draw an ellipse at each point
                    // var ellipse = doc.pathItems.ellipse( point[ 1 ] + .1, point[ 0 ] - .1, .2, .2 );
                    var nextPoint = arr[ i + 1 >= arr.length ? 0 : i + 1 ];
                    var dist = vectorLength( subtractVectors( point, nextPoint ) );
                    if ( dist < minDist )
                    {
                        minDist = dist;
                    }
                } );


                return minDist;
            }

            // Function to check if a path resembles a crosshair
            function isValidCrosshair ( pathItem )
            {

                if ( pathItem.typename.match( /compound/i ) )
                {
                    var chResult = false;
                    if ( pathItem.pathItems < 1 ) { return false };
                    afc( pathItem, "pathItems" ).forEach( function ( pi )
                    {
                        if ( isValidCrosshair( pi ) )
                        {
                            chResult = true;
                        }
                    } );
                    return chResult;
                }

                var pathPoints = getPoints( pathItem );
                var numPoints = pathPoints.length;

                // Check if the path has at least 4 points
                if ( numPoints < 4 )
                {
                    return false;
                }

                // Check the minimum distance between consecutive right angles
                var minDist = minDistBetweenRightAngles( pathItem );

                // Set a threshold for the minimum distance
                var thicknessThreshold = .065; // Adjust as needed

                // If the minimum distance is above the threshold, it's not a crosshair
                if ( minDist > thicknessThreshold )
                {
                    return false;
                }

                // Additional checks for rectangular, "L" shape, or "+" shape can be added here

                return true;
            }


        }

        function getPoints ( item )
        {
            var points = [];
            if ( item.typename.match( /compoundpathitem/i ) )
            {
                if ( !item.pathItems.length )
                {
                    item = cleanupCompoundPath( item );
                }
                afc( item, "pathItems" ).forEach( function ( pi )
                {
                    afc( pi, "pathPoints" ).forEach( function ( pp )
                    {
                        points.push( pp.anchor );
                    } );
                } );
            }
            else 
            {
                afc( item, "pathPoints" ).forEach( function ( pp )
                {
                    points.push( [ pp.anchor[ 0 ], pp.anchor[ 1 ] ] );
                } );
            }
            return points;
        }

        function extractLongestLineSegment ( parentPath )
        {
            // timer.beginTask( "extractLongestLineSegment" )
            var points = afc( parentPath, "pathPoints" );
            var parentPathBounds = getBoundsData( parentPath );

            var outputPaths = [];
            var currentPath = [];


            //extract all line segments from the path
            points.forEach( function ( curPoint, index )
            {
                if ( currentPath.length < 1 ) 
                {
                    currentPath.push( curPoint );
                    return;
                }
                if ( index === points.length - 1 )
                {
                    currentPath.push( curPoint );
                    outputPaths.push( currentPath );
                    currentPath = [ curPoint ];
                    currentPath.push( points[ 0 ] );
                    outputPaths.push( currentPath );
                    return;
                }


                var prevPoint = points[ ( index - 1 + points.length ) % points.length ];
                var nextPoint = points[ ( index + 1 ) % points.length ];

                var curAngle = angleBetweenPoints( prevPoint.anchor, curPoint.anchor, nextPoint.anchor );
                var controlAngle = angleBetweenPoints( curPoint.anchor, curPoint.leftDirection, curPoint.rightDirection );


                if ( ( curAngle > 160 && curAngle < 200 && controlAngle > 160 && controlAngle < 200 ) )
                {
                    currentPath.push( curPoint );
                }
                else
                {
                    currentPath.push( curPoint );
                    outputPaths.push( currentPath );
                    currentPath = [ curPoint ];
                }
            } );

            if ( currentPath.length > 0 )
            {
                outputPaths.push( currentPath );
            }

            var longestSegments = getLongestSegments( outputPaths, "bottom" );

            // timer.endTask( "extractLongestLineSegment" )

            return longestSegments[ "bottom" ] || longestSegments[ "left" ] || undefined;





            // function to get the longest segment from an array of segments
            // the segment must be in the lower left quadrant of the overall bounding box
            // with a buffer of 10 points
            // if the edge is "left", the segment must be mostly vertical
            // if the edge is "bottom", the segment must be mostly horizontal
            function getLongestSegments ( segments )
            {
                var longestBottom, lbDim;
                var longestLeft, llDim;
                var pbhc = parentPathBounds.left + parentPathBounds.width * .65;
                var pbvc = parentPathBounds.top - parentPathBounds.height * .35;



                segments.forEach( function ( seg, segIndex )
                {
                    if ( seg.length < 2 )
                    {
                        return;
                    }

                    var segBounds = getBoundsFromPoints( seg );

                    if ( segBounds.hc > pbhc || segBounds.vc > pbvc || ( segBounds.width < 30 && segBounds.height < 30 ) )
                    {
                        return;
                    }
                    var slope = Math.abs( ( segBounds.height ) / ( segBounds.width ) );
                    if ( slope < 1 && segBounds.maxDim > lbDim )
                    {
                        lbDim = segBounds.maxDim;
                        longestBottom = seg;
                    }
                    else if ( slope > 1 && segBounds.maxDim > llDim )
                    {
                        llDim = segBounds.maxDim;
                        longestLeft = seg;
                    }
                } )

                return { "left": longestLeft, "bottom": longestBottom };
            }

            function getBoundsFromPoints ( points )
            {
                if ( !points || !points.length ) return;
                var bounds = {
                    left: Number.MAX_VALUE,
                    top: -Number.MAX_VALUE,
                    right: -Number.MAX_VALUE,
                    bottom: Number.MAX_VALUE
                };

                points.forEach( function ( p )
                {
                    bounds.left = Math.min( bounds.left, p.anchor[ 0 ] );
                    bounds.top = Math.max( bounds.top, p.anchor[ 1 ] );
                    bounds.right = Math.max( bounds.right, p.anchor[ 0 ] );
                    bounds.bottom = Math.min( bounds.bottom, p.anchor[ 1 ] );
                } );
                bounds.hc = ( bounds.left + bounds.right ) / 2;
                bounds.vc = ( bounds.top + bounds.bottom ) / 2;
                bounds.width = bounds.right - bounds.left;
                bounds.height = bounds.top - bounds.bottom;
                bounds.maxDim = Math.max( bounds.width, bounds.height );
                return bounds;
            }
        }

        //
        //old version... just in case
        //
        // function extractLongestLineSegment ( parentPath )
        // {
        //     timer.beginTask( "extractLongestLineSegment" )
        //     var points = afc( parentPath, "pathPoints" );
        //     var parentPathBounds = getBoundsData( parentPath );

        //     var outputPaths = [];
        //     var currentPath = [ points[ 0 ] ];

        //     points.forEach( function ( curPoint, index )
        //     {
        //         var prevPoint = points[ ( index - 1 + points.length ) % points.length ];
        //         var nextPoint = points[ ( index + 1 ) % points.length ];

        //         var curAngle = angleBetweenPoints( prevPoint.anchor, curPoint.anchor, nextPoint.anchor );
        //         var controlAngle = angleBetweenPoints( curPoint.anchor, curPoint.leftDirection, curPoint.rightDirection );

        //         if ( curAngle > 160 && curAngle < 200 && controlAngle > 160 && controlAngle < 200 )
        //         {
        //             currentPath.push( curPoint );
        //         } else
        //         {
        //             if ( currentPath.length > 0 )
        //             {
        //                 outputPaths.push( currentPath );
        //             }
        //             currentPath = [ curPoint ];
        //         }
        //     } );

        //     if ( currentPath.length > 0 )
        //     {
        //         outputPaths.push( currentPath );
        //     }

        //     var longestSegment = getLongestSegment( outputPaths, "bottom" );
        //     if ( !longestSegment || !longestSegment.length || getBoundsFromPoints( longestSegment ).width < 30 )
        //     {
        //         longestSegment = getLongestSegment( outputPaths, "left" ) || longestSegment;
        //     }

        //     timer.endTask( "extractLongestLineSegment" )

        //     return longestSegment || undefined;





        //     // function to get the longest segment from an array of segments
        //     // the segment must be in the lower left quadrant of the overall bounding box
        //     // with a buffer of 10 points
        //     // if the edge is "left", the segment must be mostly vertical
        //     // if the edge is "bottom", the segment must be mostly horizontal
        //     function getLongestSegment ( segments, edge )
        //     {
        //         var longest;
        //         var longestLength = 0;

        //         segments.forEach( function ( seg, segIndex )
        //         {
        //             if ( seg.length < 2 ) return;
        //             var segBounds = getBoundsFromPoints( seg );
        //             if ( ( segBounds.hc > ( parentPathBounds.left + ( parentPathBounds.width * .65 ) ) ) || ( segBounds.vc > ( parentPathBounds.top - ( parentPathBounds.height * .35 ) ) ) )
        //             {
        //                 return;
        //             }
        //             var slope = ( segBounds.height ) / ( segBounds.width );
        //             if ( edge === "left" && Math.abs( slope ) < 1 ) return;
        //             if ( edge === "bottom" && Math.abs( slope ) > 1 ) return;

        //             var segLength = vectorLength( subtractVectors( seg[ 0 ].anchor, seg[ seg.length - 1 ].anchor ) );
        //             if ( segLength > longestLength )
        //             {
        //                 longestLength = segLength;
        //                 longest = seg;
        //             }
        //         } )

        //         // //debug
        //         // if ( longest && longest.length && edge === "bottom" )
        //         // {
        //         //     debugLayer.pathItems.add().setEntirePath( longest.map( function ( p ) { return p.anchor } ) );
        //         //     debugLayer.pageItems[ 0 ].name = parentPath.parent.parent.name + "_" + edge;
        //         // }

        //         return longest;
        //     }

        //     function getBoundsFromPoints ( points )
        //     {
        //         if ( !points || !points.length ) return;
        //         ''
        //         var bounds = {
        //             left: Number.MAX_VALUE,
        //             top: -Number.MAX_VALUE,
        //             right: -Number.MAX_VALUE,
        //             bottom: Number.MAX_VALUE
        //         };

        //         points.forEach( function ( p )
        //         {
        //             bounds.left = Math.min( bounds.left, p.anchor[ 0 ] );
        //             bounds.top = Math.max( bounds.top, p.anchor[ 1 ] );
        //             bounds.right = Math.max( bounds.right, p.anchor[ 0 ] );
        //             bounds.bottom = Math.min( bounds.bottom, p.anchor[ 1 ] );
        //         } );
        //         bounds.hc = ( bounds.left + bounds.right ) / 2;
        //         bounds.vc = ( bounds.top + bounds.bottom ) / 2;
        //         bounds.width = bounds.right - bounds.left;
        //         bounds.height = bounds.top - bounds.bottom;
        //         return bounds;
        //     }
        // }

    }

    function angleBetweenPoints ( p1, p2, p3 )
    {
        if (
            p1[ 0 ] === p2[ 0 ] &&
            p1[ 1 ] === p2[ 1 ] &&
            p1[ 0 ] === p3[ 0 ] &&
            p1[ 1 ] === p3[ 1 ]
        )
            return 180;

        var v1 = [ p1[ 0 ] - p2[ 0 ], p1[ 1 ] - p2[ 1 ] ];
        var v2 = [ p3[ 0 ] - p2[ 0 ], p3[ 1 ] - p2[ 1 ] ];
        var dot = v1[ 0 ] * v2[ 0 ] + v1[ 1 ] * v2[ 1 ];
        var mag1 = Math.sqrt( v1[ 0 ] * v1[ 0 ] + v1[ 1 ] * v1[ 1 ] );
        var mag2 = Math.sqrt( v2[ 0 ] * v2[ 0 ] + v2[ 1 ] * v2[ 1 ] );
        var angle = ( Math.acos( dot / ( mag1 * mag2 ) ) * 180 ) / Math.PI;
        if ( angle.toString() === "NaN" )
        {
            angle = 180;
        }
        return angle;
    }

    // Function to subtract vectors
    function subtractVectors ( v1, v2 )
    {
        return [ v1[ 0 ] - v2[ 0 ], v1[ 1 ] - v2[ 1 ] ];
    }

    // Function to calculate the length of a vector
    function vectorLength ( v )
    {
        return Math.sqrt( v[ 0 ] * v[ 0 ] + v[ 1 ] * v[ 1 ] );
    }

    function removeProdInfo ()
    {
        log.l( "removeProdInfo()" )
        log.l( "app.activeDocument = " + app.activeDocument.name )
        var doc = app.activeDocument;
        var layers = afc( doc, "layers" );
        var garmentLayer;
        layers.forEach( function ( l )
        {
            l.locked = l.visible = true;
            if ( !garmentLayer && l.name.match( /[a-z]{2,}[-_]/i ) )
            {
                garmentLayer = l;
                garmentLayer.locked = false;
            }
        } );
        if ( !garmentLayer )
        {
            log.e( "Failed to find a garment layer in document " + doc.name );
            errorList.push( "Failed to find a garment layer in document " + doc.name );
            return;
        }

        log.l( "garmentLayer = " + garmentLayer.name )
        app.executeMenuCommand( "unlockAll" );
        app.executeMenuCommand( "showAll" );
        doc.selection = null;
        afc( garmentLayer, "layers" ).forEach( function ( l )
        {
            if ( l.name.match( /usa/i ) )
            {
                log.l( "removing " + l.name )
                l.remove();
                return;
            }
            if ( !l.name.match( /prepress/i ) )
            {
                l.visible = false;
            }

        } );

        log.l( "cleaning up swatches" )
        runAction( "cleanup_swatches", CLEANUP_SWATCHES_ACTION_STRING );
        var swatches = afc( doc, "swatches" );
        log.l( "current swatches = " + swatches.map( function ( s ) { return s.name } ).join( ", " ) );
        swatches.forEach( function ( swatch )
        {
            if ( !colorNameIsProdColor( swatch.name ) )
            {
                log.l( swatch.name + " is not a prod color" );
                return;
            }
            log.l( "removing " + swatch.name );
            selectAndRemove( swatch )
        } );

        afc( garmentLayer, "layers" ).forEach( function ( l )
        {
            l.visible = true;
            l.locked = l.name.match( /info/i ) ? true : false;
        } );

        function selectAndRemove ( swatch )
        {
            doc.selection = null;
            doc.defaultFillColor = swatch.color;
            app.executeMenuCommand( "Find Fill Color menu item" );
            app.executeMenuCommand( "clear" )

            doc.defaultStrokeColor = swatch.color;
            app.executeMenuCommand( "Find Stroke Color menu item" );
            app.executeMenuCommand( "clear" )
            doc.selection = null;

        }

    }

    function batchApplyCallouts ()
    {
        srcFiles.forEach( function ( f )
        {
            app.open( f );
            removeProdInfo();
            applyCallouts();
        } );
    }

    function applyCallouts ()
    {
        var doc = app.activeDocument;
        var layers = doc.layers;
        var layArray = afc( doc, "layers" );
        var garmentLayer, ppLay;
        layArray.forEach( function ( l )
        {
            if ( l.layers.length === 0 && l.pageItems.length === 0 )
            {
                l.remove();
                return;
            }
            l.visible = true;
            if ( l.name.match( /guides|bkgrd|do not unlock/i ) )
            {
                l.locked = true;
                return;
            }
            ppLay = findSpecificLayer( l, "Prepress", "any" );
            if ( !garmentLayer && ppLay )
            {
                garmentLayer = l;
                garmentLayer.locked = false;
                garmentLayer.visible = true;
            }
        } );
        if ( !garmentLayer )
        {
            errorList.push( "Failed to find a garment layer in document " + doc.name );
            return;
        }

        var prodInfoLayer = layers.add();
        var prodInfoGroup = srcProdInfoGroup.duplicate( doc );

        ppLay.locked = false;
        ppLay.visible = true;
        var ppLayers = afc( ppLay, "layers" );
        ppLayers.forEach( function ( sizeLayer )
        {
            var sizeName = sizeLayer.name;
            var sizePieces = afc( sizeLayer, "groupItems" );
            sizePieces.forEach( function ( piece )
            {
                piece.visible = true;
                piece.locked = false;
                var pieceName = piece.name;
                if ( pieceName.match( /^L/i ) ) { debugger };
                var pieceProdInfoGroup = findSpecificPageItem( prodInfoGroup, pieceName + " Prod Info", "imatch" );
                pieceProdInfoGroup.duplicate( piece );
            } );
        } );

        ppLay.visible = false;
        prodInfoLayer.remove();
        doc.selection = null;
        doc.saveAs( new File( outputPath + doc.name ) );
        docsToClose.push( doc );
    }

    function getSrcFiles ()
    {
        var srcFolder = getSrcFolder();
        if ( !srcFolder ) { return []; }
        var srcFiles = [];
        var files = srcFolder.getFiles( function ( f )
        {
            return f.name.match( /\.ai$/i );
        } );
        files.forEach( function ( f )
        {
            srcFiles.push( f );
        } );

        outputPath = normalizeLocalFilePath( srcFolder.fullName.toString() ) + "/Batched_Files/";
        var outputFolder = new Folder( outputPath );
        if ( !outputFolder.exists )
        {
            outputFolder.create();
        }
        return srcFiles;
    }


    var docsToClose = [];
    var outputPath;
    var srcFiles = getSrcFiles();
    if ( !srcFiles.length ) 
    {
        alert( "No .ai files found in the selected folder. Please select a different folder." )
        return;
    }

    var baseFile = srcFiles.filter( function ( f ) { return f.name.match( /_1000/i ) } )[ 0 ];
    var srcProdInfoGroup = createSrcFile( baseFile );

    batchApplyCallouts();
    docsToClose.forEach( function ( d )
    {
        d.close();
    } );



    if ( errorList.length )
    {
        sendErrors( errorList );
    }
}
test();
