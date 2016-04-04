import {Injectable} from 'angular2/core';

@Injectable()
export class FlogoDBService{

  // PouchDB instance
  private _db:PouchDB;
  private _activitesDB: PouchDB;
  private _sync:Object;
  private _syncActivities: Object;
  public PREFIX_AUTO_GENERATE:string = 'auto-generate-id';
  public FLOW:string = 'flows';
  public DIAGRAM:string = 'diagram';
  public DELIMITER:string = ":";
  public DEFAULT_USER_ID = 'flogoweb-admin';

  constructor(){
    // When create this service, initial pouchdb
    this._initDB();
  }

  /**
   * initial a pouchdb
   */
  private _initDB(): FlogoDBService{
    this._activitiesDB = new PouchDB('flogo-web-activities-local');
    this._activitiesDB.info().then(function(db){
      console.log(db);
    }).catch(function(err:Object){
      console.error(err);
    });
    this._syncActivities = PouchDB.sync('flogo-web-activities-local', 'http://localhost:5984/flogo-web-activities', {
      live: true,
      retry: true
    });

    this._db = new PouchDB('flogo-web-local');
    // create db in browser
    this._db.info().then(function(db){
      console.log(db);
    }).catch(function(err:Object){
      console.error(err);
    });
    this._sync = PouchDB.sync('flogo-web-local', 'http://localhost:5984/flogo-web', {
      live: true,
      retry: true
    }).on('change', function (info) {
      // handle change
      console.group("[DB Sync] Change");
      console.log("info: ", info);
      console.groupEnd();
    }).on('paused', function () {
      // replication paused (e.g. user went offline)
      console.group("[DB Sync] Paused");
      console.groupEnd();
    }).on('active', function () {
      // replicate resumed (e.g. user went back online)
      console.group("[DB Sync] Active");
      console.groupEnd();
    }).on('denied', function (info) {
      // a document failed to replicate (e.g. due to permissions)
      console.group("[DB Sync] Denied");
      console.log("info: ", info);
      console.groupEnd();
    }).on('complete', function (info) {
      // handle complete
      console.group("[DB Sync] Complete");
      console.log("info: ", info);
      console.groupEnd();
    }).on('error', function (err) {
      // handle error
      console.group("[DB Sync] Error");
      console.log("err: ", err);
      console.groupEnd();
    });
    return this;
  }

  /**
   * generate a unique id
   */
  generateID(userID: string): string{
    // if userID isn't passed, then use default 'flogoweb'
    if(!userID){
      // TODO for now, is optional. When we implement user login, then this is required
      userID = this.DEFAULT_USER_ID;
    }
    let timestamp = new Date().toISOString();
    let random = Math.random();
    let id = `${this.PREFIX_AUTO_GENERATE}${this.DELIMITER}${userID}${this.DELIMITER}${timestamp}${this.DELIMITER}${random}`;

    return id;
  }

  /**
   * generate an id of flow
   * @param {string} [userID] - the id of currently user.
   */
  generateFlowID(userID: string): string{
    // if userID isn't passed, then use default 'flogoweb'
    if(!userID){
      // TODO for now, is optional. When we implement user login, then this is required
      userID = this.DEFAULT_USER_ID;
    }

    let timestamp = new Date().toISOString();
    let id = `${this.FLOW}${this.DELIMITER}${userID}${this.DELIMITER}${timestamp}`;

    console.log("[info]flowID: ", id);
    return id;
  }

  /**
   * create a doc to db
   * @param {Object} doc
   */
  create(doc: Object): Object{
    return new Promise((resolve, reject)=>{
      if(!doc) reject("Please pass doc");

      if(!doc.$table){
        console.error("[Error]doc.$table is required. You must pass. ", doc);
        reject("[Error]doc.$table is required.");
      }

      // if this doc don't have id, generate an id for it
      if(!doc._id){
        doc._id = this.generateID();
        console.log("[warning]We generate an id for you, but suggest you give a meaningful id to this document.");
      }

      if(!doc['created_at']){
        doc['created_at'] = new Date().toISOString();
      }
      this._db.put(doc).then((response)=>{
        console.log("response: ", response);
        resolve(response);
      }).catch((err)=>{
        console.error(err);
        reject(err);
      });
    });
  }

  /**
   * update a doc
   * @param {Object} doc
   */
  update(doc: Object): Object{
    return new Promise((resolve, reject)=>{
      if(!doc) reject("Please pass doc");

      // if this doc don't have id, generate an id for it
      if(!doc._id){
        console.error("[Error] Your doc don't have a valid _id");
        reject("[Error] Your doc don't have a valid _id");
      }

      if(!doc._rev){
        console.error("[Error] Your doc don't have valid _rev");
        reject("[Error] Your doc don't have valid _rev");
      }

      if(!doc.$table){
        console.error("[Error]doc.$table is required. You must pass. ", doc);
        reject("[Error]doc.$table is required.");
      }

      if(!doc['updated_at']){
        doc['updated_at'] = new Date().toISOString();
      }
      this._db.put(doc).then((response)=>{
        console.log("response: ", response);
        resolve(response);
      }).catch((err)=>{
        console.error(err);
        reject(err);
      });
    });
  }

  allDocs(options:Object){
    return new Promise((resolve, reject)=>{
      this._db.allDocs(options).then((response)=>{
        console.log("[allDocs]response: ", response);
        resolve(response);
      }).catch((err)=>{
        console.error(err);
        reject(err);
      });
    });
  }
  /**
   * remove doc. You can pass doc object or doc._id and doc._rev
   */
  remove(){
    let parameters = arguments;
    return new Promise((resolve, reject)=>{
      let doc, docId, docRev;
      // user pass doc
      if(parameters.length==1){
        doc = parameters[0];
        if(typeof doc != "object"){
          console.error("[error]Please pass correct doc object");
          reject("[error]Please pass correct doc object");
        }
        this._db.remove(doc).then((response)=>{
          resolve(response);
        }).catch((err)=>{
          reject(err);
        })
      }else if(parameters.length>1){ // remove by _id and _rev
        docId = parameters[0];
        docRev = parameters[1];

        if(!docId||!docRev){
          console.error("[error]Please pass correct doc._id and doc._rev");
          reject("[error]Please pass correct doc._id and doc._rev");
        }

        this._db.remove(docId, docRev).then((response)=>{
          resolve(response);
        }).catch((err)=>{
          reject(err);
        })
      }
    });
  }

}
