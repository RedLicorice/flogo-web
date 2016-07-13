import path from 'path';
import fs from 'fs';
import performanceNow from 'performance-now';
import _ from 'lodash';
import { FLOGO_TASK_TYPE } from '../common/constants';
import { spawn } from 'child_process';
import { inspect } from 'util';

export function btoa( str ) {
  var buffer;

  if ( str instanceof Buffer ) {
    buffer = str;
  } else {
    buffer = new Buffer( str.toString(), 'binary' );
  }

  return buffer.toString( 'base64' );
}

export function atob( str ) {
  return new Buffer( str, 'base64' ).toString( 'binary' );
}

export function isExisted( testedPath ) {
  try {
    fs.accessSync( testedPath, fs.F_OK );
    return true;
  } catch ( e ) {
    return false;
  }
}

export function isDirectory( testedPath ) {
  if ( isExisted( testedPath ) ) {
    let stats = fs.statSync( testedPath );
    if ( stats.isDirectory() ) {
      return true
    } else {
      return false;
    }
  } else {
    return undefined;
  }
}

export function readDirectoriesSync( dirPath ) {
  let dirs = fs.readdirSync( dirPath );
  let nDirs = [];
  dirs.forEach( ( dir )=> {
    if ( isDirectory( path.join( dirPath, dir ) ) ) {
      nDirs.push( dir );
    }
  } );

  return nDirs;
}

/**
 * judge whether a string is a valid json string. if i
 * @param  {string}  str - the JSON string
 * @return {object|undefined} if it is a valid json, return json, otherwise return undefined
 */
export function isJSON( str ) {
  try {
    return JSON.parse( str );
  } catch ( e ) {
    return undefined;
  }
}

/**
 * Read a JSON file
 * @param  {string|Path} jSONPath - the path of JSON file
 * @return {object|undefined} if it is a valid and exist json, return json, otherwise return undefined
 */
export function readJSONFileSync( JSONPath ) {
  let data = undefined;
  if ( isExisted( JSONPath ) ) {
    data = fs.readFileSync( JSONPath, {
      "encoding" : "utf8"
    } );
    data = isJSON( data );
  } else {
    console.error( "[error][utils.js->readJSONFileSync] path doesn't exist. path: ", JSONPath );
  }

  return data;
}

/**
 * Async version of readJSONFileSync
 * @param  {string|Path} jSONPath - the path of JSON file
 * @return {Promise<object|undefined>} if it is a valid and exist json, return json, otherwise return undefined
 */
export function readJSONFile( JSONPath ) {
  return new Promise( ( resolve, reject ) => {
    if ( isExisted( JSONPath ) ) {
      fs.readFile( JSONPath, { 'encoding' : 'utf8' }, ( err, data )=> {
        if ( err ) {
          reject( err );
        } else {
          resolve( isJSON( data ) );
        }
      } );
    } else {
      console.error( "[error][utils.js->readJSONFile] path doesn't exist. path: ", JSONPath );
      throw new Error( `Path [${JSONPath}] doesn't exist.` );
    }
  } );
}

/**
 * write a JSON file
 * @param {string|Path} JSONPath - the path of JSON file
 * @param {object} data - the JSON data you want to write
 * @return {boolean} if write successful, return ture, otherwise return false
 */
export function writeJSONFileSync( JSONPath, data ) {
  try {
    fs.writeFileSync( JSONPath, JSON.stringify( data, null, 2 ), {
      "encoding" : "utf8"
    } );
    return true;
  } catch ( err ) {
    console.error( "[error][utils.js->writeJSONFileSync] err: ", err );
    return false;
  }
}

export function flogoIDEncode( id ) {
  return btoa( id )
    .replace( /\+/g, '-' )
    .replace( /\//g, '_' )
    .replace( /=+$/, '' );
}

// URL safe base64 decoding
// reference: https://gist.github.com/jhurliman/1250118
export function flogoIDDecode( encodedId ) {

  encodedId = encodedId.replace( /-/g, '+' )
    .replace( /_/g, '/' );

  while ( encodedId.length % 4 ) {
    encodedId += '=';
  }

  return atob( encodedId );
}

export function flogoGenTaskID( items ) {
  let taskID;

  // TODO
  //  generate a more meaningful task ID in string format
  if ( items ) {
    let ids = _.keys( items );
    let startPoint = 2; // taskID 1 is reserved for the rootTask

    let taskIDs = _.map( _.filter( ids, id => {
      return items[ id ].type === FLOGO_TASK_TYPE.TASK;
    } ), id => {
      return _.toNumber( flogoIDDecode( id ) );
    } );

    let currentMax = _.max( taskIDs );

    if ( currentMax && _.isFinite( currentMax ) ) { // isFinite: _.max coerces values to number in lodash versions < 4
      taskID = '' + ( currentMax + 1);
    } else {
      taskID = '' + startPoint;
    }

  } else {
    // shift the timestamp for avoiding overflow 32 bit system
    taskID = '' + (Date.now() >>> 1);
  }

  return flogoIDEncode( taskID );

}

export function flogoGenTriggerID() {
  return flogoIDEncode( `Flogo::Trigger::${Date.now()}` );
}

export function genNodeID( items ) {


  let id = '';

  if ( performanceNow && _.isFunction( performanceNow ) ) {
    id = `FlogoFlowDiagramNode::${Date.now()}::${performanceNow()}`;
  } else {
    id = `FlogoFlowDiagramNode::${Date.now()}}`;
  }

  return flogoIDEncode( id );
};

/**
 * Convert task ID to integer, which is the currently supported type in engine
 * TODO
 *  taskID should be string in the future, perhaps..
 *
 * @param taskID
 * @returns {number}
 * @private
 */
export function convertTaskID( taskID ) {
  let id = '';

  try {
    id = flogoIDDecode( taskID );

    // get the timestamp
    let parsedID = id.split( '::' );

    if ( parsedID.length >= 2 ) {
      id = parsedID[ 1 ];
    }
  } catch ( e ) {
    console.warn( e );
    id = taskID;
  }

  return parseInt( id );
}

/** *******
 * GitHub related utility functions
 */

// TODO support more git format
//  for the moment
//    https://github.com/:username/:projectname.git
//    https://github.com/:username/:projectname
const GITHUB_URL_PATTERN = /^(?:https\:\/\/)?github\.com\/(?:([\w\-]+)\/)(?:([\w\-]+)(?:\.git)?)$/.source;
const GITHUB_URL_SUBFOLDER_PATTERN = /^(?:https\:\/\/)?github\.com\/(?:([\w\-]+)\/)(?:([\w\-]+))\/(?:([\w\-/]+))$/.source;

export function isGitHubURL( url ) {
  let simplePattern = new RegExp( GITHUB_URL_PATTERN );
  let subfolderPattern = new RegExp( GITHUB_URL_SUBFOLDER_PATTERN );
  return simplePattern.test( url ) || subfolderPattern.test( url );
}

export function parseGitHubURL( url ) {
  let simplePattern = new RegExp( GITHUB_URL_PATTERN );
  let subfolderPattern = new RegExp( GITHUB_URL_SUBFOLDER_PATTERN );
  let result = null;

  let parsed = url.match( simplePattern );

  if ( parsed ) {
    result = {
      url : url,
      username : parsed[ 1 ],
      repoName : parsed[ 2 ]
    }
  } else {
    parsed = url.match( subfolderPattern );

    if ( parsed ) {
      result = {
        url : url,
        username : parsed[ 1 ],
        repoName : parsed[ 2 ],
        extraPath : parsed[ 3 ]
      }
    }
  }

  return result;
}

/**
 * Verify if the given url is within the given GitHub repo.
 *
 * @param repoURL
 * @param url
 */
export function isInGitHubRepo( repoURL, url ) {
  if ( isGitHubURL( repoURL ) && isGitHubURL( url ) ) {
    const parsedRepoURL = parseGitHubURL( repoURL );
    const parsedURL = parseGitHubURL( url );

    return parsedRepoURL.username === parsedURL.username && parsedRepoURL.repoName === parsedURL.repoName;
  } else {
    console.warn( `[warn] invalid GitHub URL: ${repoURL}` );
    return false;
  }
}

/**
 * Construct GitHub file URI using the download URL format.
 *
 * https://raw.githubusercontent.com/:username/:repoName/[:branchName | :commitHash]/:filename
 *
 * @param githubInfo {Object} `username`, `repoName`, `branchName`, `commitHash`
 * @param fileName {String} Name of the file.
 * @returns {string} The file URI to retrieve the raw data of the file.
 */
export function constructGitHubFileURI( githubInfo, fileName ) {
  let commitish = githubInfo.commitHash || githubInfo.branchName || 'master';
  let extraPath = githubInfo.extraPath ? `/${ githubInfo.extraPath }` : '';

  return `https://raw.githubusercontent.com/${ githubInfo.username }/${ githubInfo.repoName }/${ commitish }${ extraPath }/${ fileName }`;
}

export function constructGitHubPath( githubInfo ) {
  let extraPath = githubInfo.extraPath ? `/${ githubInfo.extraPath }` : '';
  return `github.com/${ githubInfo.username }/${ githubInfo.repoName }${ extraPath }`;
}

export function constructGitHubRepoURL( githubInfo ) {
  return `https://github.com/${githubInfo.username}/${githubInfo.repoName}.git`;
}

/** *******
 * CMD related utility functions
 */

/**
 * Port `child_process.spawn` with Promise, same inputs as the original API
 *
 * https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
 */
export function runShellCMD( cmd, args, opts ) {
  return new Promise( ( resolve, reject ) => {
    const _cmd = spawn( cmd, args, opts );
    let _data = '';
    let errData = '';

    console.log( `[info] run command: ${cmd} ${args.join( ' ' )}` );

    _cmd.stdout.on( 'data', ( data ) => {
      _data += data;
    } );

    _cmd.stderr.on( 'data', ( data ) => {
      errData += data instanceof Buffer ? data.toString() : data;
    } );

    _cmd.on( 'close', ( code ) => {
      if ( code !== 0 ) {
        console.log( `[log] command exited with code ${code}: ${cmd} ${args.join( ' ' )}` );
        reject( errData );
      } else {
        resolve( _data );
      }
    } );
  } );
}

/**
 * Create the given folder using `mkdir` command
 *
 * @param folderPath
 * @returns {Promise}
 */
export function createFolder( folderPath ) {
  return new Promise( ( resolve, reject )=> {
    runShellCMD( 'mkdir', [ '-p', folderPath ] )
      .then( ()=> {
        resolve( true );
      } )
      .catch( ( err )=> {
        reject( err );
      } );
  } );
}

/**
 * Remove the given folder using `rm -rf`
 *
 * @param folderPath
 * @returns {Promise}
 */
export function rmFolder( folderPath ) {
  return new Promise( ( resolve, reject )=> {
    runShellCMD( 'rm', [ '-rf', folderPath ] )
      .then( ()=> {
        resolve( true );
      } )
      .catch( ( err )=> {
        reject( err );
      } );
  } );
}

/**
 * Git clone a given repo with `--recursive` flag, to an absolute path
 *
 * @param repoURL
 * @param folderPath
 * @returns {Promise}
 */
export function gitClone( repoURL, folderPath ) {
  return new Promise( ( resolve, reject )=> {
    runShellCMD( 'git', [ 'clone', '--recursive', repoURL, folderPath ] )
      .then( ()=> {
        resolve( true );
      } )
      .catch( ( err )=> {
        reject( err );
      } );
  } );
}

/**
 * Run `git pull --rebase` under the given absolute path.
 *
 * @param folderPath
 * @returns {Promise}
 */
export function gitUpdate( folderPath ) {
  return new Promise( ( resolve, reject )=> {
    runShellCMD( 'git', [ 'pull', '--rebase' ], { cwd : folderPath } )
      .then( ()=> {
        resolve( true );
      } )
      .catch( ( err )=> {
        reject( err );
      } );
  } );
}

/** *******
 * Logging related utilities
 */

/**
 * Inspect object using `util.inspect` of NodeJS
 * Mainly for debugging only, SHOULD NOT be used in production.
 *
 * @param obj
 */
export function inspectObj( obj ) {
  console.log( inspect( obj, { depth : 7, color : true } ) );
}
